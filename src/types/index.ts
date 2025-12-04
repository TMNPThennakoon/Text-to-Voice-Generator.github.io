export interface VoiceSettings {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
}

export interface SerializedVoiceSettings {
  voiceName: string | null;
  voiceLang: string | null;
  rate: number;
  pitch: number;
  volume: number;
}

export interface HistoryItem {
  id: string;
  text: string;
  timestamp: number;
  settings: SerializedVoiceSettings;
}

export interface AppState {
  text: string;
  isPlaying: boolean;
  isPaused: boolean;
  currentUtterance: SpeechSynthesisUtterance | null;
  availableVoices: SpeechSynthesisVoice[];
  settings: VoiceSettings;
  history: HistoryItem[];
}

