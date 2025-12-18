import { motion } from 'framer-motion';
import { VoiceSettings, SpeechSynthesisVoice } from '../types';
import { Volume2, Gauge, TrendingUp, Mic, Search, X, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState, useMemo } from 'react';
import { gsap } from 'gsap';

interface VoiceControlsProps {
  settings: VoiceSettings;
  availableVoices: SpeechSynthesisVoice[];
  onSettingsChange: (settings: Partial<VoiceSettings>) => void;
}

// Voice style presets
const VOICE_STYLES = [
  { id: 'normal', name: 'Normal', icon: '🎤', pitch: 1.0, rate: 1.0, description: 'Default voice' },
  { id: 'robot', name: 'Robot', icon: '🤖', pitch: 0.5, rate: 0.8, description: 'Robotic voice effect' },
  { id: 'child', name: 'Child', icon: '👶', pitch: 1.8, rate: 1.1, description: 'Child-like voice' },
  { id: 'chipmunk', name: 'Chipmunk', icon: '🐿️', pitch: 2.0, rate: 1.2, description: 'High-pitched fast voice' },
  { id: 'deep', name: 'Deep', icon: '🎭', pitch: 0.6, rate: 0.9, description: 'Deep masculine voice' },
  { id: 'slow', name: 'Slow', icon: '🐢', pitch: 1.0, rate: 0.6, description: 'Slow and clear' },
  { id: 'fast', name: 'Fast', icon: '⚡', pitch: 1.0, rate: 1.8, description: 'Fast speaking' },
  { id: 'whisper', name: 'Whisper', icon: '🔇', pitch: 0.8, rate: 0.9, description: 'Soft whisper voice' },
];

export const VoiceControls = ({ settings, availableVoices, onSettingsChange }: VoiceControlsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('normal');
  
  // Filter voices based on search query
  const filteredVoices = useMemo(() => {
    if (!searchQuery.trim()) return availableVoices;
    
    const query = searchQuery.toLowerCase();
    return availableVoices.filter(voice => 
      voice.name.toLowerCase().includes(query) ||
      voice.lang.toLowerCase().includes(query) ||
      voice.name.toLowerCase().includes(query)
    );
  }, [availableVoices, searchQuery]);
  
  const groupedVoices = filteredVoices.reduce((acc, voice) => {
    const lang = voice.lang.split('-')[0];
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(voice);
    return acc;
  }, {} as Record<string, SpeechSynthesisVoice[]>);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.6, delay: 0.2 }
      );
    }
  }, []);

  // Sync selected style with current settings (with tolerance)
  useEffect(() => {
    const matchingStyle = VOICE_STYLES.find(
      style => 
        Math.abs(style.pitch - settings.pitch) < 0.15 && 
        Math.abs(style.rate - settings.rate) < 0.15
    );
    if (matchingStyle && matchingStyle.id !== selectedStyle) {
      setSelectedStyle(matchingStyle.id);
    }
  }, [settings.pitch, settings.rate, selectedStyle]);

  const handleSliderChange = (value: number, type: 'rate' | 'pitch' | 'volume') => {
    onSettingsChange({ [type]: value });
    
    // Check if the new value matches any style
    const newPitch = type === 'pitch' ? value : settings.pitch;
    const newRate = type === 'rate' ? value : settings.rate;
    
    const matchingStyle = VOICE_STYLES.find(
      style => 
        Math.abs(style.pitch - newPitch) < 0.15 && 
        Math.abs(style.rate - newRate) < 0.15
    );
    
    if (matchingStyle) {
      setSelectedStyle(matchingStyle.id);
    } else {
      setSelectedStyle('normal');
    }
    
    // Animate the container on change
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        scale: 1.02,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
      });
    }
  };

  const handleStyleChange = (styleId: string) => {
    const style = VOICE_STYLES.find(s => s.id === styleId);
    if (style) {
      setSelectedStyle(styleId);
      onSettingsChange({
        pitch: style.pitch,
        rate: style.rate,
      });
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-strong rounded-2xl p-4 sm:p-6 border border-dark-border/50 relative overflow-hidden"
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-2xl opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-accent via-purple-500 to-pink-500 rounded-2xl blur-xl animate-pulse-slow" />
      </div>

      <div className="relative z-10">
        <motion.div 
          className="flex items-center gap-2 mb-4 sm:mb-6"
          whileHover={{ scale: 1.05 }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-dark-accent" />
          </motion.div>
          <h3 className="text-xl sm:text-2xl font-semibold gradient-text">Voice Settings</h3>
        </motion.div>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Voice Style Presets */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass border border-dark-border/50 rounded-xl p-3 sm:p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <label className="text-sm sm:text-base font-semibold text-dark-text">
                Voice Style
              </label>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 sm:gap-2">
              {VOICE_STYLES.map((style) => (
                <motion.button
                  key={style.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleStyleChange(style.id)}
                  className={`p-2 sm:p-3 rounded-lg border transition-all flex flex-col items-center justify-center h-[70px] sm:h-[80px] overflow-hidden ${
                    selectedStyle === style.id
                      ? 'border-purple-500 bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/30'
                      : 'border-dark-border/50 glass text-dark-textSecondary hover:border-purple-500/50'
                  }`}
                  title={style.description}
                >
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-1.5 leading-none flex-shrink-0">{style.icon}</div>
                  <div className="text-[10px] sm:text-xs font-semibold leading-tight text-center w-full px-0.5 sm:px-1 line-clamp-2 overflow-hidden">
                    {style.name}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Voice Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-base font-medium text-dark-textSecondary mb-2">
              Voice
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-textSecondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search voices..."
                className="w-full glass border border-dark-border/50 rounded-lg pl-11 pr-11 py-3 text-base text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-dark-accent/50 focus:border-dark-accent/50 transition-all"
              />
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary hover:text-dark-text"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-dark-textSecondary mt-1">
                {filteredVoices.length} voice{filteredVoices.length !== 1 ? 's' : ''} found
              </p>
            )}
            <motion.select
              whileFocus={{ scale: 1.02 }}
              value={settings.voice?.name || ''}
              onChange={(e) => {
                const voice = filteredVoices.find(v => v.name === e.target.value);
                onSettingsChange({ voice: voice || null });
              }}
              className="w-full glass border border-dark-border/50 rounded-lg px-4 py-3 text-base text-dark-text focus:outline-none focus:ring-2 focus:ring-dark-accent/50 focus:border-dark-accent/50 transition-all mt-2"
            >
              {Object.keys(groupedVoices).length === 0 ? (
                <option value="">No voices found</option>
              ) : (
                Object.entries(groupedVoices).map(([lang, voices]) => (
                  <optgroup key={lang} label={lang.toUpperCase()}>
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </optgroup>
                ))
              )}
            </motion.select>
          </motion.div>

          {/* Rate Control */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <motion.label 
                className="flex items-center gap-2 text-base font-medium text-dark-textSecondary"
                whileHover={{ scale: 1.05 }}
              >
                <Gauge className="w-5 h-5 text-dark-accent" />
                Speed
              </motion.label>
              <motion.span 
                className="text-base font-semibold text-dark-accent px-3 py-1.5 rounded bg-dark-surface/50"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
                key={settings.rate}
              >
                {settings.rate.toFixed(1)}x
              </motion.span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.rate}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value), 'rate')}
                className="w-full h-2 bg-dark-surface rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((settings.rate - 0.5) / 1.5) * 100}%, #2a2a2a ${((settings.rate - 0.5) / 1.5) * 100}%, #2a2a2a 100%)`
                }}
              />
              <div className="flex justify-between text-sm text-dark-textSecondary mt-1">
                <span>0.5x</span>
                <span>1.0x</span>
                <span>2.0x</span>
              </div>
            </div>
          </motion.div>

          {/* Pitch Control */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-2">
              <motion.label 
                className="flex items-center gap-2 text-base font-medium text-dark-textSecondary"
                whileHover={{ scale: 1.05 }}
              >
                <TrendingUp className="w-5 h-5 text-purple-500" />
                Pitch
              </motion.label>
              <motion.span 
                className="text-base font-semibold text-purple-500 px-3 py-1.5 rounded bg-dark-surface/50"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
                key={settings.pitch}
              >
                {settings.pitch.toFixed(1)}
              </motion.span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={settings.pitch}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value), 'pitch')}
                className="w-full h-2 bg-dark-surface rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #9333ea 0%, #9333ea ${((settings.pitch - 0.5) / 1.5) * 100}%, #2a2a2a ${((settings.pitch - 0.5) / 1.5) * 100}%, #2a2a2a 100%)`
                }}
              />
              <div className="flex justify-between text-sm text-dark-textSecondary mt-1">
                <span>Low</span>
                <span>Normal</span>
                <span>High</span>
              </div>
            </div>
          </motion.div>

          {/* Volume Control */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-2">
              <motion.label 
                className="flex items-center gap-2 text-base font-medium text-dark-textSecondary"
                whileHover={{ scale: 1.05 }}
              >
                <Volume2 className="w-5 h-5 text-pink-500" />
                Volume
              </motion.label>
              <motion.span 
                className="text-base font-semibold text-pink-500 px-3 py-1.5 rounded bg-dark-surface/50"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
                key={Math.round(settings.volume * 100)}
              >
                {Math.round(settings.volume * 100)}%
              </motion.span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.volume}
                onChange={(e) => handleSliderChange(parseFloat(e.target.value), 'volume')}
                className="w-full h-2 bg-dark-surface rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${settings.volume * 100}%, #2a2a2a ${settings.volume * 100}%, #2a2a2a 100%)`
                }}
              />
              <div className="flex justify-between text-sm text-dark-textSecondary mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
