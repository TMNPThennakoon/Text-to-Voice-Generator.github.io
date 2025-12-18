import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { useTranslation } from './hooks/useTranslation';
import { useSpeechToText } from './hooks/useSpeechToText';
import { TextEditor } from './components/TextEditor';
import { VoiceControls } from './components/VoiceControls';
import { PlaybackControls } from './components/PlaybackControls';
import { HistoryPanel } from './components/HistoryPanel';
import { TranslationPanel } from './components/TranslationPanel';
import { SpeechToTextPanel } from './components/SpeechToTextPanel';
import { AnimatedBackground } from './components/AnimatedBackground';
import { GradientOrb } from './components/GradientOrb';
import { AudioVisualizer } from './components/AudioVisualizer';
import { ProgressIndicator } from './components/ProgressIndicator';
import { Volume2, Sparkles, Waves, Languages, Mic, FileText, Settings } from 'lucide-react';
import { AudioEditorPanel } from './components/AudioEditorPanel';
import { downloadAudio } from './utils/audioUtils';
import { AudioFormatModal, AudioFormat } from './components/AudioFormatModal';

function App() {
  const {
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
  } = useTextToSpeech();

  const {
    translatedText,
    isTranslating,
    sourceLang,
    targetLang,
    translateText,
    setSourceLang,
    setTargetLang,
    swapLanguages,
    clearTranslation,
  } = useTranslation();

  const {
    isListening,
    transcript,
    error: speechError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechToText();

  const [activeTab, setActiveTab] = useState<'text' | 'translate' | 'speech' | 'audio-editor'>('text');
  const [showFormatModal, setShowFormatModal] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // GSAP animation for animated gradient background
    if (bgRef.current) {
      gsap.to(bgRef.current, {
        backgroundPosition: '200% 200%',
        duration: 20,
        repeat: -1,
        ease: 'none',
      });
    }

    // GSAP animation for header
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      );
    }

    // GSAP animation for container
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 1, delay: 0.3, ease: 'power2.out' }
      );
    }
  }, []);

  const handleDownload = () => {
    if (!text.trim()) return;
    setShowFormatModal(true);
  };

  const handleFormatSelect = async (format: AudioFormat) => {
    try {
      await downloadAudio(text, settings, format);
      // Success will be handled by the download
    } catch (error: any) {
      console.error('Download failed:', error);
      alert(error.message || `Failed to download audio as ${format.toUpperCase()}. Please try again or use browser recording tools.`);
    }
  };

  const handleUseTranslation = (translatedText: string) => {
    setText(translatedText);
    setActiveTab('text');
  };

  const handleUseTranscript = (transcriptText: string) => {
    setText(transcriptText);
    setActiveTab('text');
  };

  const handleFileUpload = (content: string) => {
    setText(content);
    setActiveTab('text');
  };


  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Animated Background */}
      <div
        ref={bgRef}
        className="fixed inset-0 animated-gradient opacity-50"
        style={{ backgroundPosition: '0% 0%' }}
      />
      
      {/* Floating Gradient Orbs */}
      <GradientOrb color="#6366f1" size={300} x={10} y={20} />
      <GradientOrb color="#9333ea" size={400} x={80} y={60} />
      <GradientOrb color="#ec4899" size={250} x={50} y={80} />

      {/* Animated Particles */}
      <AnimatedBackground />

      {/* Header */}
      <motion.header
        ref={headerRef}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong border-b border-dark-border/50 backdrop-blur-xl sticky top-0 z-50 relative"
      >
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <motion.div 
              className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="bg-gradient-to-br from-dark-accent via-purple-500 to-pink-500 rounded-xl p-2 sm:p-3 shadow-lg shadow-dark-accent/50 flex-shrink-0"
              >
                <Volume2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text truncate">Text to Voice Generator</h1>
                <p className="text-sm sm:text-base text-dark-textSecondary hidden sm:block">Advanced TTS Platform - Free & Open Source</p>
              </div>
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 glass border border-dark-border/50 rounded-xl flex-shrink-0"
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
              <span className="text-sm sm:text-base text-dark-text font-medium hidden xs:inline">100% Free</span>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main ref={containerRef} className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10 max-w-7xl">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 glass-strong rounded-xl p-0.5 sm:p-1 border border-dark-border/50 overflow-x-auto scrollbar-hide"
        >
          {[
            { id: 'text', label: 'Text Input', icon: FileText, shortLabel: 'Text' },
            { id: 'translate', label: 'Translate', icon: Languages, shortLabel: 'Translate' },
            { id: 'speech', label: 'Voice to Text', icon: Mic, shortLabel: 'Voice' },
            { id: 'audio-editor', label: 'Audio Editor', icon: Settings, shortLabel: 'Editor' },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-dark-accent via-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-dark-textSecondary hover:bg-dark-hover'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </motion.button>
            );
          })}
        </motion.div>

        <div className={`grid grid-cols-1 ${activeTab !== 'audio-editor' ? 'lg:grid-cols-4' : ''} gap-4 sm:gap-6`}>
          {/* Left Column - Main Content (3 columns) */}
          <div className={`${activeTab !== 'audio-editor' ? 'lg:col-span-3' : 'lg:col-span-full'} space-y-4 sm:space-y-6 ${activeTab !== 'audio-editor' ? 'order-2 lg:order-1' : ''}`}>
            {/* Tab Content */}
            {activeTab === 'text' && (
              <motion.div
                key="text"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <TextEditor 
                  text={text} 
                  onChange={setText} 
                  rate={settings.rate} 
                  isPlaying={isPlaying}
                  onFileUpload={handleFileUpload}
                />
                
                {/* Audio Visualizer */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="glass-strong rounded-2xl p-6 border border-dark-border/50"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Waves className="w-5 h-5 text-dark-accent" />
                    <h3 className="text-xl sm:text-2xl font-semibold gradient-text">Audio Visualizer</h3>
                  </div>
                  <AudioVisualizer 
                    isPlaying={isPlaying && !isPaused} 
                    volume={settings.volume}
                  />
                </motion.div>
                
                {/* Progress Indicator */}
                {isPlaying && text && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="glass-strong rounded-2xl p-6 border border-dark-border/50"
                  >
                    <ProgressIndicator 
                      isPlaying={isPlaying && !isPaused}
                      text={text}
                      rate={settings.rate}
                    />
                  </motion.div>
                )}
                
                {/* Playback Controls */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="glass-strong rounded-2xl p-6 border border-dark-border/50"
                >
                  <PlaybackControls
                    isPlaying={isPlaying}
                    isPaused={isPaused}
                    onPlay={play}
                    onPause={pause}
                    onStop={stop}
                    onDownload={handleDownload}
                    disabled={!text.trim()}
                  />
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'translate' && (
              <motion.div
                key="translate"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <TranslationPanel
                  originalText={text}
                  translatedText={translatedText}
                  isTranslating={isTranslating}
                  sourceLang={sourceLang}
                  targetLang={targetLang}
                  onTranslate={translateText}
                  onSetSourceLang={setSourceLang}
                  onSetTargetLang={setTargetLang}
                  onSwapLanguages={swapLanguages}
                  onClear={clearTranslation}
                  onUseTranslation={handleUseTranslation}
                />
              </motion.div>
            )}

            {activeTab === 'speech' && (
              <motion.div
                key="speech"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
              <SpeechToTextPanel
                isListening={isListening}
                transcript={transcript}
                error={speechError}
                isSupported={isSpeechSupported}
                onStart={startListening}
                onStop={stopListening}
                onClear={clearTranscript}
                onUseTranscript={handleUseTranscript}
              />
              </motion.div>
            )}

            {activeTab === 'audio-editor' && (
              <motion.div
                key="audio-editor"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <AudioEditorPanel />
              </motion.div>
            )}

            {/* History Panel - Always visible (only on text tab) */}
            {activeTab === 'text' && (
              <HistoryPanel
                history={history}
                onLoad={loadFromHistory}
                onDelete={deleteHistoryItem}
                onClear={clearHistory}
              />
            )}
          </div>

          {/* Right Column - Voice Controls (1 column) - Hidden on audio-editor tab */}
          {activeTab !== 'audio-editor' && (
            <div className={`space-y-4 sm:space-y-6 ${activeTab === 'text' ? 'order-1 lg:order-2' : 'hidden lg:block lg:order-2'}`}>
              <VoiceControls
                settings={settings}
                availableVoices={availableVoices}
                onSettingsChange={updateSettings}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="border-t border-dark-border/50 glass-strong mt-8 sm:mt-12 relative z-10"
      >
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="text-center space-y-1 sm:space-y-2">
            <div className="pt-2">
              <p className="text-sm sm:text-base font-semibold text-dark-text">
                Developed by <span className="gradient-text">Nayana Pabasara</span>
              </p>
              <p className="text-xs sm:text-sm text-dark-textSecondary mt-1">
                Instrumentation and Automation Engineering Technology Student
              </p>
              <p className="text-xs sm:text-sm text-dark-textSecondary">
                University of Colombo
              </p>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* Audio Format Selection Modal */}
      <AudioFormatModal
        isOpen={showFormatModal}
        onClose={() => setShowFormatModal(false)}
        onSelectFormat={handleFormatSelect}
      />
      </div>
  );
}

export default App;

