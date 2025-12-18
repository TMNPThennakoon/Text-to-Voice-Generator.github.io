// Utility function to transcribe audio files
// Improved version with audio analysis and normalization

/**
 * Analyze PCM data to check if audio contains actual content (not just silence)
 */
const analyzeAudioContent = (audioBuffer: AudioBuffer): { hasContent: boolean; avgLevel: number; maxLevel: number; rmsLevel: number } => {
  const channelData = audioBuffer.getChannelData(0); // Mono
  let sum = 0;
  let sumSquares = 0;
  let max = 0;
  let sampleCount = 0;
  
  // Sample every 50th value for better accuracy
  for (let i = 0; i < channelData.length; i += 50) {
    const abs = Math.abs(channelData[i]);
    sum += abs;
    sumSquares += abs * abs;
    max = Math.max(max, abs);
    sampleCount++;
  }
  
  const avgLevel = sum / sampleCount;
  const rmsLevel = Math.sqrt(sumSquares / sampleCount); // RMS (Root Mean Square) level
  // More lenient threshold - check RMS level and max level
  const hasContent = rmsLevel > 0.005 || max > 0.05; // Lower threshold to catch quiet speech
  
  return { hasContent, avgLevel, maxLevel: max, rmsLevel };
};

/**
 * Normalize and amplify audio buffer - creates a new buffer to avoid mutating original
 */
const normalizeAudio = (audioBuffer: AudioBuffer, targetGain: number = 0.95): AudioBuffer => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  
  // Create new buffer
  const newBuffer = audioContext.createBuffer(numChannels, length, sampleRate);
  
  // Process each channel
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    const newChannelData = newBuffer.getChannelData(channel);
    
    // Find maximum amplitude
    let max = 0;
    for (let i = 0; i < channelData.length; i++) {
      max = Math.max(max, Math.abs(channelData[i]));
    }
    
    // Normalize to target gain (0.95 to avoid clipping) and optionally amplify
    if (max > 0) {
      const normalizeGain = targetGain / max;
      // If audio is very quiet, amplify it more
      const amplifyGain = max < 0.1 ? Math.min(4.0, 0.1 / max) : 1.0;
      const totalGain = Math.min(normalizeGain * amplifyGain, 8.0); // Limit total gain
      
      for (let i = 0; i < channelData.length; i++) {
        newChannelData[i] = Math.max(-1, Math.min(1, channelData[i] * totalGain));
      }
    } else {
      // Copy original data if max is 0 (silence)
      newChannelData.set(channelData);
    }
  }
  
  return newBuffer;
};

/**
 * Convert AudioBuffer to WAV Blob
 */
const audioBufferToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  
  // Create WAV header
  const buffer = new ArrayBuffer(44 + length * numChannels * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, length * numChannels * 2, true);
  
  // Convert audio data to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
};

export const transcribeAudioFile = async (file: File): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    let audioContext: AudioContext | null = null;
    let audioElement: HTMLAudioElement | null = null;
    let audioUrl: string | null = null;
    let recognition: any = null;
    let systemStream: MediaStream | null = null;

    try {
      // Check if browser supports Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.'));
        return;
      }

      // Check file type
      if (!file.type.startsWith('audio/')) {
        reject(new Error('Please select an audio file (MP3, WAV, OGG, etc.)'));
        return;
      }

      // Step 1: Load and analyze audio file
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Analyze audio content
        const analysis = analyzeAudioContent(audioBuffer);
        
        console.log('Audio analysis:', {
          hasContent: analysis.hasContent,
          avgLevel: analysis.avgLevel.toFixed(4),
          maxLevel: analysis.maxLevel.toFixed(4),
          rmsLevel: analysis.rmsLevel.toFixed(4),
          duration: audioBuffer.duration.toFixed(2) + 's'
        });
        
        // Warn if audio is very quiet but still try to process
        // Don't reject - Web Speech API might still be able to process it
        if (!analysis.hasContent) {
          console.warn('⚠️ Audio appears to be mostly silence (RMS:', analysis.rmsLevel.toFixed(4), 'Max:', analysis.maxLevel.toFixed(4), '), but attempting to process anyway...');
        } else if (analysis.rmsLevel < 0.02) {
          console.warn('⚠️ Audio is very quiet (RMS:', analysis.rmsLevel.toFixed(4), '), transcription may be unreliable');
        }
        
        // Always normalize audio for better transcription
        // This ensures consistent volume levels
        const normalizedBuffer = normalizeAudio(audioBuffer, 0.95);
        
        // Create new audio file from processed buffer
        const wavBlob = await audioBufferToWav(normalizedBuffer);
        audioUrl = URL.createObjectURL(wavBlob);
        
        // Close the temporary audio context used for normalization
        audioContext.close();
        // Create new audio context for playback
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
      } catch (error) {
        audioContext.close();
        reject(new Error('Failed to process audio file. Please check the file format.'));
        return;
      }

      // Step 1: Try to get system audio capture (Chrome/Edge)
      // This allows us to capture audio without playing through speakers
      const trySystemAudioCapture = async (): Promise<MediaStream | null> => {
        try {
          if ('getDisplayMedia' in navigator.mediaDevices) {
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

      // Step 2: Set up audio element for playback with processed audio
      audioElement = new Audio();
      audioElement.src = audioUrl;
      audioElement.volume = 0.5; // Moderate volume for processing (increased from 0.1)
      
      // Use Web Audio API to route audio with better gain
      const source = audioContext.createMediaElementSource(audioElement);
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1.2; // Higher gain (1.2x) for better recognition
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Ensure audio context is resumed (required by some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Step 3: Request microphone permission first (required by Speech Recognition)
      // Then try system audio capture for better quality
      try {
        await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          }
        });
      } catch (error) {
        audioContext.close();
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        reject(new Error('Microphone access is required for speech recognition. Please allow microphone access.'));
        return;
      }

      // Try system audio capture for better quality (optional)
      systemStream = await trySystemAudioCapture();

      // Step 4: Set up Speech Recognition
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US'; // Default to English

      let transcript = '';
      let isTranscribing = false;
      let hasReceivedResults = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        hasReceivedResults = true;
        console.log('Speech recognition result received:', event.resultIndex, event.results.length);
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          const confidence = result[0].confidence || 0;
          
          console.log(`Result ${i}: "${text}" (confidence: ${confidence.toFixed(2)}, final: ${result.isFinal})`);
          
          // Include both interim and final results for better coverage
          if (result.isFinal) {
            transcript += text + ' ';
          } else {
            // Also include interim results as they might be useful
            transcript += text + ' ';
          }
        }
        
        console.log('Current transcript:', transcript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error, event);
        
        // Some errors are acceptable
        if (event.error === 'no-speech') {
          // 'no-speech' errors are common, especially at the start
          // Continue waiting if we haven't received results yet
          if (!hasReceivedResults) {
            console.log('No speech detected yet, continuing to wait...');
            return;
          }
          // If we have results but get 'no-speech', it might be the end
          // Don't reject, let onend handle it
          return;
        }
        
        if (event.error === 'aborted') {
          // Recognition was stopped, this is expected
          return;
        }
        
        if (event.error === 'audio-capture') {
          cleanup();
          reject(new Error('No microphone found or microphone access denied. Please check your microphone settings.'));
          return;
        }
        
        if (event.error === 'network') {
          cleanup();
          reject(new Error('Network error. Speech recognition requires internet connection.'));
          return;
        }
        
        // For other errors, log but don't reject immediately
        // Let the onend handler decide what to do
        console.warn('Speech recognition error (non-fatal):', event.error);
      };


      // Cleanup function
      const cleanup = () => {
        if (recognition) {
          try {
            recognition.stop();
          } catch (e) {
            // Ignore errors when stopping
          }
        }
        if (audioElement) {
          audioElement.pause();
          audioElement.src = '';
        }
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        if (systemStream) {
          systemStream.getTracks().forEach(track => track.stop());
        }
        if (audioContext) {
          audioContext.close().catch(() => {
            // Ignore errors when closing
          });
        }
      };

      // Store original onend handler
      const handleRecognitionEnd = () => {
        console.log('Speech recognition ended. Transcript length:', transcript.length);
        
        if (isTranscribing) {
          isTranscribing = false;
          
          // Wait a bit more for any final results that might come
          setTimeout(() => {
            cleanup();
            
            const finalTranscript = transcript.trim();
            
            if (finalTranscript && finalTranscript.length > 0) {
              console.log('✅ Transcription successful:', finalTranscript.substring(0, 100) + (finalTranscript.length > 100 ? '...' : ''));
              resolve(finalTranscript);
            } else if (hasReceivedResults) {
              // We received results but they were empty
              console.log('⚠️ Received results but transcript is empty');
              resolve('Speech was detected but could not be transcribed. The audio may be unclear, too quiet, or in an unsupported language. Try using a clearer audio file with louder speech.');
            } else {
              // No results received
              console.log('⚠️ No speech detected');
              resolve('No speech detected in the audio file. Possible reasons:\n• The audio is too quiet or contains only silence\n• The microphone could not capture the audio\n• The audio format is not properly supported\n\nPlease ensure:\n1. The audio file contains clear, audible speech\n2. Your microphone is working and permissions are granted\n3. The audio is not muted or extremely quiet\n4. Try using a different audio file');
            }
          }, 1500); // Wait 1.5 seconds for final results
        }
      };
      
      // Set the onend handler
      recognition.onend = handleRecognitionEnd;

      // Step 5: Start transcription
      // Start recognition first, then play audio for better synchronization
      try {
        // Start recognition first
        recognition.start();
        isTranscribing = true;
        hasReceivedResults = false;
        
        // Wait a moment for recognition to initialize
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Now play audio - this ensures recognition is ready to process
        await audioElement.play();
        
        console.log('✅ Audio playback started. Duration:', audioElement.duration, 'seconds');
        
      } catch (error) {
        console.error('Audio play error:', error);
        cleanup();
        reject(new Error('Failed to play audio file. Please check the file format and ensure your browser allows audio playback.'));
        return;
      }

      // Handle audio end - wait longer for final results
      audioElement.onended = () => {
        console.log('Audio playback ended. Waiting for transcription...');
        // Wait longer for Speech Recognition to process final results
        // The audio has ended, but recognition might still be processing
        setTimeout(() => {
          if (isTranscribing && recognition) {
            console.log('Stopping recognition after audio ended');
            recognition.stop();
          }
        }, 6000); // Wait 6 seconds for final results (increased for better accuracy)
      };

      audioElement.onerror = () => {
        cleanup();
        reject(new Error('Failed to load audio file. Please check the file format.'));
      };

      // Safety timeout - stop after 10 minutes (for long audio files)
      setTimeout(() => {
        if (isTranscribing) {
          cleanup();
          if (transcript.trim()) {
            resolve(transcript.trim());
          } else {
            resolve('Transcription timeout. The audio file may be too long or contain no speech.');
          }
        }
      }, 10 * 60 * 1000); // 10 minutes

    } catch (error: any) {
      // Cleanup on error
      if (audioContext) {
        audioContext.close().catch(() => {});
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (systemStream) {
        systemStream.getTracks().forEach(track => track.stop());
      }
      reject(error);
    }
  });
};
