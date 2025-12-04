import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceSettings, HistoryItem } from '../types';

export const useTextToSpeech = () => {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>({
    voice: null,
    rate: 1,
    pitch: 1,
    volume: 1,
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chunksRef = useRef<string[]>([]);
  const currentIndexRef = useRef<number>(0);
  const settingsRef = useRef<VoiceSettings>(settings);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Set default voice if not set
      if (!settings.voice && voices.length > 0) {
        const defaultVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        setSettings(prev => ({ ...prev, voice: defaultVoice }));
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    // Load history from localStorage
    const savedHistory = localStorage.getItem('tts-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    }
  }, []);

  // Update settings ref when settings change
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('tts-history', JSON.stringify(history.slice(-50))); // Keep last 50
    }
  }, [history]);

  // Split text into chunks if too long
  const splitTextIntoChunks = useCallback((text: string, maxLength: number = 200) => {
    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    sentences.forEach(sentence => {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      }
    });

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks.length > 0 ? chunks : [text];
  }, []);

  // Play text
  const play = useCallback(() => {
    if (!text.trim()) return;

    if (isPaused && utteranceRef.current) {
      speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    // Stop any current speech
    speechSynthesis.cancel();

    // Split text into chunks
    chunksRef.current = splitTextIntoChunks(text);
    currentIndexRef.current = 0;

    // Create function to speak a chunk
    const speakChunk = (index: number) => {
      if (index >= chunksRef.current.length) {
        // All chunks done - save to history
        setIsPlaying(false);
        setIsPaused(false);
        utteranceRef.current = null;

        // Serialize settings for storage
        const serializedSettings: SerializedVoiceSettings = {
          voiceName: settingsRef.current.voice?.name || null,
          voiceLang: settingsRef.current.voice?.lang || null,
          rate: settingsRef.current.rate,
          pitch: settingsRef.current.pitch,
          volume: settingsRef.current.volume,
        };

        const historyItem: HistoryItem = {
          id: Date.now().toString(),
          text,
          timestamp: Date.now(),
          settings: serializedSettings,
        };
        setHistory(prev => [historyItem, ...prev]);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunksRef.current[index]);
      utterance.voice = settingsRef.current.voice;
      utterance.rate = settingsRef.current.rate;
      utterance.pitch = settingsRef.current.pitch;
      utterance.volume = settingsRef.current.volume;

      utterance.onend = () => {
        currentIndexRef.current = index + 1;
        // Move to next chunk
        speakChunk(currentIndexRef.current);
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setIsPlaying(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    };

    // Start speaking first chunk
    speakChunk(0);

    setIsPlaying(true);
    setIsPaused(false);
  }, [text, isPaused, splitTextIntoChunks]);

  // Pause
  const pause = useCallback(() => {
    speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  // Stop
  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    utteranceRef.current = null;
    currentIndexRef.current = 0;
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Load from history
  const loadFromHistory = useCallback((item: HistoryItem) => {
    setText(item.text);
    // Restore voice from serialized data
    const voice = item.settings.voiceName
      ? availableVoices.find(v => v.name === item.settings.voiceName && v.lang === item.settings.voiceLang)
        || availableVoices.find(v => v.name === item.settings.voiceName)
        || availableVoices.find(v => v.lang.startsWith('en'))
        || availableVoices[0]
      : availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
    
    setSettings({
      voice: voice || null,
      rate: item.settings.rate,
      pitch: item.settings.pitch,
      volume: item.settings.volume,
    });
  }, [availableVoices]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('tts-history');
  }, []);

  // Delete history item
  const deleteHistoryItem = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  return {
    text,
    setText,
    isPlaying,
    isPaused,
    availableVoices,
    settings,
    history,
    play,
    pause,
    stop,
    updateSettings,
    loadFromHistory,
    clearHistory,
    deleteHistoryItem,
  };
};

