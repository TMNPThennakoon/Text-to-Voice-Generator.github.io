import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TextHighlighterProps {
  text: string;
  isPlaying: boolean;
  rate: number;
}

export const TextHighlighter = ({ text, isPlaying, rate }: TextHighlighterProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const wordsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!text.trim()) {
      wordsRef.current = [];
      return;
    }

    wordsRef.current = text.trim().split(/(\s+)/);
  }, [text]);

  useEffect(() => {
    if (!isPlaying || wordsRef.current.length === 0) {
      setCurrentWordIndex(0);
      return;
    }

    const wordsPerMinute = rate * 150;
    const delayPerWord = (60 / wordsPerMinute) * 1000;

    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => {
        if (prev >= wordsRef.current.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, delayPerWord);

    return () => clearInterval(interval);
  }, [isPlaying, rate, text]);

  if (!text.trim()) return null;

  return (
    <div className="text-sm text-dark-text leading-relaxed">
      {wordsRef.current.map((word, index) => {
        const isCurrent = index === currentWordIndex && isPlaying;
        return (
          <motion.span
            key={index}
            animate={{
              color: isCurrent ? '#6366f1' : '#e0e0e0',
              scale: isCurrent ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="inline-block"
          >
            {word}
          </motion.span>
        );
      })}
    </div>
  );
};

