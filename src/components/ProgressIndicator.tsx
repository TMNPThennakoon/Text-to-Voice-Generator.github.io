import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ProgressIndicatorProps {
  isPlaying: boolean;
  text: string;
  rate: number;
}

export const ProgressIndicator = ({ isPlaying, text, rate }: ProgressIndicatorProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isPlaying) {
      setProgress(0);
      return;
    }

    const words = text.trim().split(/\s+/).length;
    const estimatedDuration = (words / (rate * 150)) * 60; // seconds
    const duration = estimatedDuration * 1000; // milliseconds

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, text, rate]);

  return (
    <div className="w-full">
      <div className="relative h-1.5 bg-dark-surface rounded-full overflow-hidden">
        <motion.div
          className="absolute h-full bg-gradient-to-r from-dark-accent via-purple-500 to-pink-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
        <motion.div
          className="absolute h-full w-20 bg-white/20 blur-lg"
          animate={{
            left: `${progress - 10}%`,
          }}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
      </div>
      {isPlaying && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-dark-textSecondary mt-1 text-center font-medium"
        >
          {Math.round(progress)}% complete
        </motion.p>
      )}
    </div>
  );
};

