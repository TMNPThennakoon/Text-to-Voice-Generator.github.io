import { motion, AnimatePresence } from 'framer-motion';
import { Languages, ArrowRightLeft, X, Sparkles, FileText, RefreshCw, Copy, Check } from 'lucide-react';
import { LANGUAGES } from '../hooks/useTranslation';
import { useState, useEffect } from 'react';
import { LanguageSelector } from './LanguageSelector';

interface TranslationPanelProps {
  originalText: string;
  translatedText: string;
  isTranslating: boolean;
  sourceLang: string;
  targetLang: string;
  onTranslate: (text: string, targetLang?: string, sourceLang?: string) => void;
  onSetSourceLang: (lang: string) => void;
  onSetTargetLang: (lang: string) => void;
  onSwapLanguages: () => void;
  onClear: () => void;
  onUseTranslation: (text: string) => void;
}

export const TranslationPanel = ({
  originalText,
  translatedText,
  isTranslating,
  sourceLang,
  targetLang,
  onTranslate,
  onSetSourceLang,
  onSetTargetLang,
  onSwapLanguages,
  onClear,
  onUseTranslation,
}: TranslationPanelProps) => {
  const [localText, setLocalText] = useState('');
  const [useLocalText, setUseLocalText] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync with originalText when it changes (if not using local text)
  useEffect(() => {
    if (!useLocalText && originalText) {
      setLocalText(originalText);
    }
  }, [originalText, useLocalText]);

  const handleTranslate = () => {
    const textToTranslate = useLocalText ? localText : originalText;
    if (textToTranslate.trim()) {
      onTranslate(textToTranslate, targetLang, sourceLang);
    }
  };

  const handleUseMainText = () => {
    setLocalText(originalText);
    setUseLocalText(false);
  };

  const handleClear = () => {
    setLocalText('');
    setUseLocalText(false);
    onClear();
  };

  const handleSwap = () => {
    onSwapLanguages();
    // Also swap the texts
    const temp = localText;
    setLocalText(translatedText || '');
    if (temp) {
      // Clear translation to show swapped input
    }
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = translatedText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const sourceLanguage = LANGUAGES.find(lang => lang.code === sourceLang);
  const targetLanguage = LANGUAGES.find(lang => lang.code === targetLang);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-strong rounded-2xl p-4 sm:p-6 border border-dark-border/50 relative overflow-hidden"
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-2xl opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl animate-pulse-slow" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 mb-4 sm:mb-6">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            >
              <Languages className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-semibold gradient-text">Translate Text</h3>
          </motion.div>
          {(translatedText || localText) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClear}
              className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-dark-textSecondary" />
            </motion.button>
          )}
        </div>

        <div className="space-y-6">
          {/* Google Translate-like Layout */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Source Language Section */}
              <div className="space-y-2 relative">
                <div className="flex items-center justify-between">
                  {originalText.trim() && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleUseMainText}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      Use Main Text
                    </motion.button>
                  )}
                </div>
                <LanguageSelector
                  value={sourceLang}
                  onChange={onSetSourceLang}
                  label="From:"
                  placeholder="Search source language..."
                />
                <div className="glass border border-dark-border/50 rounded-xl p-4 min-h-[250px]">
                  <textarea
                    value={localText}
                    onChange={(e) => {
                      setLocalText(e.target.value);
                      setUseLocalText(true);
                    }}
                    placeholder="Enter text to translate..."
                    className="w-full h-[200px] bg-transparent border-none outline-none text-base text-dark-text placeholder-dark-textSecondary resize-none scrollbar-hide"
                  />
                  <div className="flex items-center justify-between text-sm text-dark-textSecondary mt-2 pt-2 border-t border-dark-border/30">
                    <span>{localText.length} characters</span>
                    {localText.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setLocalText('')}
                        className="text-dark-textSecondary hover:text-dark-text"
                        title="Clear"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

              {/* Swap Button - Positioned between columns */}
              <div className="absolute left-1/2 top-[60px] transform -translate-x-1/2 z-20 hidden md:block">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSwap}
                  className="p-3 glass border border-dark-border/50 rounded-full hover:border-blue-500/50 transition-all bg-dark-surface/80 shadow-lg"
                  title="Swap languages"
                >
                  <ArrowRightLeft className="w-5 h-5 text-dark-text" />
                </motion.button>
              </div>

              {/* Mobile Swap Button */}
              <div className="flex justify-center md:hidden">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSwap}
                  className="p-3 glass border border-dark-border/50 rounded-full hover:border-blue-500/50 transition-all bg-dark-surface/80"
                  title="Swap languages"
                >
                  <ArrowRightLeft className="w-5 h-5 text-dark-text" />
                </motion.button>
              </div>

              {/* Target Language Section */}
              <div className="space-y-2">
                <LanguageSelector
                  value={targetLang}
                  onChange={onSetTargetLang}
                  label="To:"
                  placeholder="Search target language..."
                />
                <div className="glass border border-dark-border/50 rounded-xl p-4 min-h-[250px] relative">
                  {isTranslating ? (
                    <div className="flex flex-col items-center justify-center h-[200px]">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="text-blue-400"
                      >
                        <Sparkles className="w-8 h-8" />
                      </motion.div>
                      <span className="mt-3 text-dark-textSecondary">Translating...</span>
                    </div>
                  ) : translatedText ? (
                    <>
                      <div className="relative w-full h-[200px]">
                        <p className="w-full h-full text-base text-dark-text whitespace-pre-wrap break-words overflow-y-auto scrollbar-hide pr-10">
                          {translatedText}
                        </p>
                        {/* Copy Button - Floating in top right corner */}
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleCopy}
                          className="absolute top-2 right-2 p-2 glass border border-dark-border/50 rounded-lg hover:border-blue-500/50 transition-all bg-dark-surface/80 group"
                          title={copied ? "Copied!" : "Copy translation"}
                        >
                          <AnimatePresence mode="wait">
                            {copied ? (
                              <motion.div
                                key="check"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ duration: 0.2 }}
                                className="text-green-400"
                              >
                                <Check className="w-4 h-4" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="copy"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                transition={{ duration: 0.2 }}
                                className="text-dark-textSecondary group-hover:text-blue-400 transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-[200px]">
                      <p className="text-dark-textSecondary text-base text-center">
                        Translation will appear here
                      </p>
                    </div>
                  )}
                  {translatedText && (
                    <div className="flex items-center justify-between text-sm text-dark-textSecondary mt-2 pt-2 border-t border-dark-border/30">
                      <span>{translatedText.length} characters</span>
                      <div className="flex items-center gap-2">
                        {/* Copy button in footer */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleCopy}
                          className="text-dark-textSecondary hover:text-blue-400 transition-colors flex items-center gap-1"
                          title={copied ? "Copied!" : "Copy translation"}
                        >
                          <AnimatePresence mode="wait">
                            {copied ? (
                              <motion.span
                                key="check"
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 5 }}
                                className="text-green-400 flex items-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                <span>Copied!</span>
                              </motion.span>
                            ) : (
                              <motion.span
                                key="copy"
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 5 }}
                                className="flex items-center gap-1"
                              >
                                <Copy className="w-4 h-4" />
                                <span>Copy</span>
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={onClear}
                          className="text-dark-textSecondary hover:text-dark-text"
                          title="Clear"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Translate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTranslate}
            disabled={(!originalText.trim() && !localText.trim()) || isTranslating}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/50 flex items-center justify-center gap-2 text-base sm:text-lg"
          >
            {isTranslating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.div>
                Translating...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
                Translate {sourceLanguage?.flag} → {targetLanguage?.flag}
              </>
            )}
          </motion.button>

          {/* Use Translated Text Button */}
          <AnimatePresence>
            {translatedText && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onUseTranslation(translatedText)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-green-500/50 text-base sm:text-lg"
              >
                Use Translated Text in Main Editor
              </motion.button>
            )}
          </AnimatePresence>

          {/* Info about unlimited characters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass border border-green-500/30 rounded-lg p-3 bg-green-500/10"
          >
            <p className="text-sm text-green-400 text-center">
              ✨ Special Feature: Unlimited translations with unlimited character support. No limits to use.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
