// Audio processing utilities for PCM Audio Generator + Mini Audacity

export interface AudioBufferData {
  buffer: AudioBuffer;
  sampleRate: number;
  channels: number;
  duration: number;
}

export interface PCMOptions {
  sampleRate: number; // 8000, 11025, 16000
  bitDepth: 8; // 8-bit unsigned
}

// Convert AudioBuffer to PCM data
export const convertToPCM = (
  audioBuffer: AudioBuffer,
  options: PCMOptions
): Uint8Array => {
  const { sampleRate } = options;
  const sourceSampleRate = audioBuffer.sampleRate;
  const sourceData = audioBuffer.getChannelData(0); // Mono
  const targetLength = Math.floor((sourceData.length * sampleRate) / sourceSampleRate);
  const pcmData = new Uint8Array(targetLength);

  // Resample and convert to 8-bit unsigned
  for (let i = 0; i < targetLength; i++) {
    const sourceIndex = (i * sourceSampleRate) / sampleRate;
    const index = Math.floor(sourceIndex);
    const fraction = sourceIndex - index;
    
    let sample: number;
    if (index + 1 < sourceData.length) {
      // Linear interpolation
      sample = sourceData[index] * (1 - fraction) + sourceData[index + 1] * fraction;
    } else {
      sample = sourceData[index] || 0;
    }
    
    // Normalize to 0-1, then convert to 8-bit unsigned (0-255)
    // Clamp to [-1, 1] range
    sample = Math.max(-1, Math.min(1, sample));
    // Convert to 0-255 (8-bit unsigned)
    pcmData[i] = Math.round((sample + 1) * 127.5);
  }

  return pcmData;
};

// Normalize audio
export const normalizeAudio = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const channelData = audioBuffer.getChannelData(0);
  
  // Find peak
  let max = 0;
  for (let i = 0; i < channelData.length; i++) {
    max = Math.max(max, Math.abs(channelData[i]));
  }
  
  if (max === 0) return audioBuffer;
  
  // Normalize to 0.95 to avoid clipping
  const gain = 0.95 / max;
  const normalizedData = channelData.map(sample => sample * gain);
  
  const newBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const data = newBuffer.getChannelData(channel);
    const sourceData = channel === 0 ? normalizedData : audioBuffer.getChannelData(channel);
    data.set(sourceData);
  }
  
  return newBuffer;
};

// Amplify audio
export const amplifyAudio = async (
  audioBuffer: AudioBuffer,
  gain: number
): Promise<AudioBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const newBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const targetData = newBuffer.getChannelData(channel);
    
    for (let i = 0; i < sourceData.length; i++) {
      targetData[i] = Math.max(-1, Math.min(1, sourceData[i] * gain));
    }
  }
  
  return newBuffer;
};

// Pitch shift (simple time-stretching approach)
export const pitchShift = async (
  audioBuffer: AudioBuffer,
  semitones: number
): Promise<AudioBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const ratio = Math.pow(2, semitones / 12);
  const newLength = Math.floor(audioBuffer.length / ratio);
  const newBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    newLength,
    audioBuffer.sampleRate
  );
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const targetData = newBuffer.getChannelData(channel);
    
    for (let i = 0; i < newLength; i++) {
      const sourceIndex = i * ratio;
      const index = Math.floor(sourceIndex);
      const fraction = sourceIndex - index;
      
      if (index + 1 < sourceData.length) {
        targetData[i] = sourceData[index] * (1 - fraction) + sourceData[index + 1] * fraction;
      } else {
        targetData[i] = sourceData[index] || 0;
      }
    }
  }
  
  return newBuffer;
};

// Speed change
export const changeSpeed = async (
  audioBuffer: AudioBuffer,
  speed: number
): Promise<AudioBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const newLength = Math.floor(audioBuffer.length / speed);
  const newBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    newLength,
    audioBuffer.sampleRate
  );
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const targetData = newBuffer.getChannelData(channel);
    
    for (let i = 0; i < newLength; i++) {
      const sourceIndex = i * speed;
      const index = Math.floor(sourceIndex);
      const fraction = sourceIndex - index;
      
      if (index + 1 < sourceData.length) {
        targetData[i] = sourceData[index] * (1 - fraction) + sourceData[index + 1] * fraction;
      } else {
        targetData[i] = sourceData[index] || 0;
      }
    }
  }
  
  return newBuffer;
};

// Robot voice effect (formant shifting + metallic reverb)
export const robotizeVoice = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Create offline context for processing
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  // Create filter for formant shifting (low-pass filter)
  const filter = offlineContext.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800; // Lower frequency for robotic effect
  filter.Q.value = 10;
  
  // Create gain for metallic effect
  const gainNode = offlineContext.createGain();
  gainNode.gain.value = 1.2;
  
  // Connect: source -> filter -> gain -> destination
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(offlineContext.destination);
  
  source.start(0);
  const processedBuffer = await offlineContext.startRendering();
  
  // Apply slight pitch shift down for male robotic voice
  return await pitchShift(processedBuffer, -2);
};

// Noise reduction (simple high-pass filter)
export const reduceNoise = async (audioBuffer: AudioBuffer): Promise<AudioBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  
  const filter = offlineContext.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 80; // Remove low-frequency noise
  
  source.connect(filter);
  filter.connect(offlineContext.destination);
  
  source.start(0);
  return await offlineContext.startRendering();
};

// Trim audio (cut start and end)
export const trimAudio = (
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number
): AudioBuffer => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const startSample = Math.floor(startTime * audioBuffer.sampleRate);
  const endSample = Math.floor(endTime * audioBuffer.sampleRate);
  const length = endSample - startSample;
  
  const newBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    length,
    audioBuffer.sampleRate
  );
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const targetData = newBuffer.getChannelData(channel);
    targetData.set(sourceData.subarray(startSample, endSample));
  }
  
  return newBuffer;
};

// Cut audio (remove a section)
export const cutAudio = (
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number
): AudioBuffer => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const startSample = Math.floor(startTime * audioBuffer.sampleRate);
  const endSample = Math.floor(endTime * audioBuffer.sampleRate);
  const length = audioBuffer.length - (endSample - startSample);
  
  const newBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    length,
    audioBuffer.sampleRate
  );
  
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const targetData = newBuffer.getChannelData(channel);
    
    // Copy before cut
    targetData.set(sourceData.subarray(0, startSample), 0);
    // Copy after cut
    targetData.set(sourceData.subarray(endSample), startSample);
  }
  
  return newBuffer;
};

// Load audio file
export const loadAudioFile = async (file: File): Promise<AudioBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
};

// Record audio from microphone
export const recordAudio = async (duration: number): Promise<AudioBuffer> => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const mediaRecorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  
  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop());
      const blob = new Blob(chunks, { type: 'audio/wav' });
      const arrayBuffer = await blob.arrayBuffer();
      try {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        resolve(audioBuffer);
      } catch (error) {
        // If MediaRecorder doesn't produce valid WAV, use AudioWorklet
        reject(error);
      }
    };
    
    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), duration * 1000);
  });
};

