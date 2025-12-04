import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, AlertCircle, Download, Copy, Check } from 'lucide-react';
import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'react';

interface SpeechToTextPanelProps {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onUseTranscript: (text: string) => void;
}

export const SpeechToTextPanel = ({
  isListening,
  transcript,
  error,
  isSupported,
  onStart,
  onStop,
  onClear,
  onUseTranscript,
}: SpeechToTextPanelProps) => {
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const finalTranscript = transcript;

  useEffect(() => {
    if (isListening && micButtonRef.current) {
      // Pulsing animation
      const pulse = gsap.to(pulseRef.current, {
        scale: 1.5,
        opacity: 0,
        duration: 1,
        repeat: -1,
        ease: 'power2.out',
      });

      return () => {
        pulse.kill();
      };
    }
  }, [isListening]);

  if (!isSupported) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-strong rounded-2xl p-4 sm:p-6 border border-dark-border/50 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 text-yellow-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-base">Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-strong rounded-2xl p-6 border border-dark-border/50 relative overflow-hidden"
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-2xl opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl blur-xl animate-pulse-slow" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <Mic className="w-5 h-5 text-green-400" />
            <h3 className="text-xl sm:text-2xl font-semibold gradient-text">Voice to Text</h3>
          </motion.div>
          {(transcript || error) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClear}
              className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-dark-textSecondary" />
            </motion.button>
          )}
        </div>

        <div className="space-y-4">
          {/* Microphone Button */}
          <div className="flex justify-center">
            <div className="relative">
              {isListening && (
                <div
                  ref={pulseRef}
                  className="absolute inset-0 bg-green-500 rounded-full opacity-50"
                />
              )}
              <motion.button
                ref={micButtonRef}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isListening ? onStop : onStart}
                className={`relative z-10 w-20 h-20 rounded-full text-white font-semibold transition-all shadow-lg ${
                  isListening
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/50'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-500/50'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-10 h-10 mx-auto" />
                ) : (
                  <Mic className="w-10 h-10 mx-auto" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Status */}
          <motion.div
            animate={{ scale: isListening ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 1, repeat: isListening ? Infinity : 0 }}
            className="text-center"
          >
            <p className="text-base font-semibold text-dark-text">
              {isListening ? (
                <span className="text-green-400 flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ●
                  </motion.span>
                  Listening...
                </span>
              ) : (
                <span className="text-dark-textSecondary">Click microphone to start recording</span>
              )}
            </p>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center gap-2 text-red-400 text-base"
              >
                <AlertCircle className="w-5 h-5" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcript */}
          <AnimatePresence>
            {finalTranscript && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="glass border border-dark-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">Transcript</span>
                  </div>
                  <p className="text-base text-dark-text whitespace-pre-wrap break-words">{finalTranscript}</p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(finalTranscript);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch (error) {
                        console.error('Failed to copy:', error);
                      }
                    }}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-purple-500/50 text-base"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copy
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const blob = new Blob([finalTranscript], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `transcript-${Date.now()}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-blue-500/50 text-base"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onUseTranscript(finalTranscript)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-green-500/50 text-base"
                >
                  Use Transcript in Main Editor
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
