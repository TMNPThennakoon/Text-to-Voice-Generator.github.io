import { VoiceSettings } from '../types';
import { AudioFormat } from '../components/AudioFormatModal';

// Determine MIME type based on format
const getMimeType = (format: AudioFormat): string => {
  const types: Record<AudioFormat, string> = {
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg; codecs=opus',
    webm: 'audio/webm; codecs=opus',
  };
  return types[format] || types.webm;
};

// Try system audio capture (Chrome/Edge - getDisplayMedia)
const trySystemAudio = async (): Promise<MediaStream | null> => {
  try {
    if ('getDisplayMedia' in navigator.mediaDevices) {
      // Request system audio capture (Chrome/Edge)
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: false,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          suppressLocalAudioPlayback: false,
        } as any,
      });
      return stream;
    }
  } catch (error) {
    console.log('System audio capture not available or denied');
  }
  return null;
};

// Amplify audio volume using Web Audio API
const amplifyAudio = async (audioBlob: Blob, gainMultiplier: number = 3.0): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Create offline context for processing
        const offlineContext = new OfflineAudioContext(
          audioBuffer.numberOfChannels,
          audioBuffer.length,
          audioBuffer.sampleRate
        );

        // Create source from buffer
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;

        // Create gain node for amplification
        const gainNode = offlineContext.createGain();
        gainNode.gain.value = gainMultiplier;

        // Connect: source -> gain -> destination
        source.connect(gainNode);
        gainNode.connect(offlineContext.destination);

        // Start and render
        source.start(0);
        const renderedBuffer = await offlineContext.startRendering();

        // Normalize to prevent clipping
        const normalizedBuffer = normalizeAudio(renderedBuffer);

        // Convert to WAV format (best quality)
        const wavBlob = audioBufferToWav(normalizedBuffer);
        resolve(wavBlob);
      } catch (error) {
        console.error('Audio processing error:', error);
        // If processing fails, return original blob
        resolve(audioBlob);
      } finally {
        audioContext.close();
      }
    };

    fileReader.onerror = () => {
      reject(new Error('Failed to read audio file'));
    };

    fileReader.readAsArrayBuffer(audioBlob);
  });
};

// Normalize audio to prevent clipping
const normalizeAudio = (buffer: AudioBuffer): AudioBuffer => {
  const numberOfChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const sampleRate = buffer.sampleRate;

  // Find peak value
  let maxPeak = 0;
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > maxPeak) {
        maxPeak = abs;
      }
    }
  }

  // Normalize to 95% of max to prevent clipping
  const normalizationFactor = maxPeak > 0 ? 0.95 / maxPeak : 1.0;

  // Create new buffer with normalized data
  const normalizedBuffer = new AudioBuffer({
    numberOfChannels,
    length,
    sampleRate,
  });

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const inputData = buffer.getChannelData(channel);
    const outputData = normalizedBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      outputData[i] = inputData[i] * normalizationFactor;
    }
  }

  return normalizedBuffer;
};

// Convert AudioBuffer to WAV Blob
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const length = buffer.length * numChannels * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);

  // Convert audio data
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

// Main function to create and download audio file
export const createAudioFile = async (
  text: string,
  settings: VoiceSettings,
  format: AudioFormat
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = settings.voice;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = 1.0; // Always use maximum volume for recording

      // Try system audio first, then fallback to microphone
      trySystemAudio()
        .then((systemStream) => {
          if (systemStream) {
            // System audio available (Chrome/Edge)
            return systemStream;
          }
          // Fallback to microphone
          return navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            }
          });
        })
        .then((stream) => {
          const mimeType = getMimeType(format);
          
          // Check if format is supported, fallback if not
          let finalMimeType = mimeType;
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            // Fallback to supported formats
            if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
              finalMimeType = 'audio/webm; codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/ogg; codecs=opus')) {
              finalMimeType = 'audio/ogg; codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
              finalMimeType = 'audio/webm';
            } else {
              finalMimeType = 'audio/webm'; // Default fallback
            }
            console.warn(`Format ${format} not fully supported, using ${finalMimeType}`);
          }

          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: finalMimeType,
            audioBitsPerSecond: 128000, // Good quality
          });
          
          const audioChunks: Blob[] = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunks.push(event.data);
            }
          };

          mediaRecorder.onstop = async () => {
            try {
              if (audioChunks.length === 0) {
                stream.getTracks().forEach(track => track.stop());
                reject(new Error('No audio recorded. Please ensure the audio is playing and try again.'));
                return;
              }

              const audioBlob = new Blob(audioChunks, { type: finalMimeType });
              
              // Process audio to increase volume using Web Audio API
              // Note: Amplification converts to WAV format for best quality
              const processedBlob = await amplifyAudio(audioBlob, 3.0); // 3x amplification
              
              const url = URL.createObjectURL(processedBlob);
              const a = document.createElement('a');
              a.href = url;
              
              // Always use WAV extension since amplification outputs WAV format
              // WAV is uncompressed and maintains the best quality after amplification
              a.download = `speech-high-volume-${Date.now()}.wav`;
              document.body.appendChild(a);
              a.click();
              
              // Cleanup
              setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }, 100);
              
              stream.getTracks().forEach(track => track.stop());
              resolve();
            } catch (error: any) {
              stream.getTracks().forEach(track => track.stop());
              reject(error);
            }
          };

          mediaRecorder.onerror = (error) => {
            stream.getTracks().forEach(track => track.stop());
            reject(new Error(`Recording error: ${error}`));
          };

          // Start recording
          mediaRecorder.start();

          // Play speech
          utterance.onend = () => {
            // Wait a bit for audio to finish completely
            setTimeout(() => {
              mediaRecorder.stop();
            }, 500);
          };

          utterance.onerror = (error) => {
            mediaRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
            reject(new Error('Speech synthesis failed'));
          };

          // Start speaking
          speechSynthesis.speak(utterance);
        })
        .catch((error: any) => {
          // Handle errors
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            reject(new Error('Audio recording permission denied. Please allow microphone/system audio access and try again.'));
          } else if (error.name === 'NotFoundError') {
            reject(new Error('No audio input device found. Please connect a microphone or enable system audio.'));
          } else {
            reject(new Error(`Audio recording failed: ${error.message || 'Unknown error'}`));
          }
        });
    } catch (error: any) {
      reject(error);
    }
  });
};
