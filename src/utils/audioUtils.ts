import { VoiceSettings } from '../types';
import { AudioFormat } from '../components/AudioFormatModal';
import { createAudioFile } from './audioRecorder';

export const downloadAudio = async (
  text: string,
  settings: VoiceSettings,
  format: AudioFormat = 'wav'
): Promise<void> => {
  try {
    await createAudioFile(text, settings, format);
  } catch (error) {
    throw error;
  }
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getCharacterCount = (text: string): number => {
  return text.length;
};

export const getWordCount = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const estimateSpeechTime = (text: string, rate: number): number => {
  const wordsPerMinute = rate * 150; // Average speaking rate
  const wordCount = getWordCount(text);
  return (wordCount / wordsPerMinute) * 60;
};

