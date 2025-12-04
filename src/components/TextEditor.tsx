import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Upload } from 'lucide-react';
import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';
import { getCharacterCount, getWordCount, estimateSpeechTime } from '../utils/audioUtils';
import { TextHighlighter } from './TextHighlighter';

interface TextEditorProps {
  text: string;
  onChange: (text: string) => void;
  rate: number;
  isPlaying: boolean;
  onFileUpload?: (content: string) => void;
}

export const TextEditor = ({ text, onChange, rate, isPlaying, onFileUpload }: TextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const charCount = getCharacterCount(text);
  const wordCount = getWordCount(text);
  const estimatedTime = estimateSpeechTime(text, rate);

  useEffect(() => {
    if (textareaRef.current) {
      gsap.fromTo(
        textareaRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.2 }
      );
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        boxShadow: text ? '0 10px 40px rgba(99, 102, 241, 0.1)' : '0 0 0 rgba(99, 102, 241, 0)',
        duration: 0.3,
      });
    }
  }, [text]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'text/plain' || file.name.endsWith('.txt'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onChange(content);
        if (onFileUpload) {
          onFileUpload(content);
        }
        
        // Animation on file upload
        if (containerRef.current) {
          gsap.fromTo(
            containerRef.current,
            { scale: 0.98 },
            { scale: 1, duration: 0.3, ease: 'back.out(1.7)' }
          );
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a .txt file');
    }
  };

  const clearText = () => {
    onChange('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-strong rounded-2xl p-4 sm:p-6 border border-dark-border/50 relative overflow-hidden"
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-2xl opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-dark-accent via-purple-500 to-pink-500 rounded-2xl blur-xl animate-pulse-slow" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 mb-4">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-dark-accent" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-semibold gradient-text">Text Input</h3>
          </motion.div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <motion.label
              htmlFor="file-upload"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass border border-dark-border/50 rounded-lg text-sm sm:text-base text-dark-text cursor-pointer transition-all hover:border-dark-accent/50 flex-1 sm:flex-initial justify-center"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Upload .txt</span>
              <span className="sm:hidden">Upload</span>
            </motion.label>
            <AnimatePresence>
              {text && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={clearText}
                  className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-dark-textSecondary" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your text here... You can type or paste any text you want to convert to speech."
            className="w-full h-48 sm:h-64 glass border border-dark-border/50 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-dark-accent/50 focus:border-dark-accent/50 resize-none scrollbar-hide transition-all"
          />
          
          {/* Shimmer effect on focus */}
          {text && (
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-xl"
              animate={{
                background: [
                  'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.1) 50%, transparent 100%)',
                  'linear-gradient(90deg, transparent 0%, rgba(147, 51, 234, 0.1) 50%, transparent 100%)',
                  'linear-gradient(90deg, transparent 0%, rgba(236, 72, 153, 0.1) 50%, transparent 100%)',
                  'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.1) 50%, transparent 100%)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          )}
        </div>

        {/* Text Highlighter Preview */}
        <AnimatePresence>
          {isPlaying && text && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 glass rounded-lg border border-dark-border/50"
            >
              <TextHighlighter text={text} isPlaying={isPlaying} rate={rate} />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mt-4 text-sm sm:text-base text-dark-textSecondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <motion.span 
              whileHover={{ scale: 1.1, color: '#6366f1' }}
              className="px-3 py-1.5 rounded bg-dark-surface/50 whitespace-nowrap font-medium"
            >
              {charCount} chars
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.1, color: '#9333ea' }}
              className="px-3 py-1.5 rounded bg-dark-surface/50 whitespace-nowrap font-medium"
            >
              {wordCount} words
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.1, color: '#ec4899' }}
              className="px-3 py-1.5 rounded bg-dark-surface/50 whitespace-nowrap font-medium"
            >
              ~{estimatedTime.toFixed(1)}s
            </motion.span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

