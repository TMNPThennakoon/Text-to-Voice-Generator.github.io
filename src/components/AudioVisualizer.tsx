import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

interface AudioVisualizerProps {
  isPlaying: boolean;
  volume: number;
}

export const AudioVisualizer = ({ isPlaying, volume }: AudioVisualizerProps) => {
  const barsRef = useRef<HTMLDivElement[]>([]);
  const [bars] = useState(() => Array.from({ length: 20 }, (_, i) => i));

  useEffect(() => {
    if (!isPlaying) {
      barsRef.current.forEach((bar) => {
        if (bar) {
          gsap.to(bar, {
            height: '10%',
            duration: 0.3,
            ease: 'power2.out',
          });
        }
      });
      return;
    }

    const animateBars = () => {
      barsRef.current.forEach((bar, index) => {
        if (bar) {
          const height = Math.random() * 80 + 20;
          const delay = (index % 5) * 0.05;
          
          gsap.to(bar, {
            height: `${height * volume}%`,
            duration: 0.5 + Math.random() * 0.3,
            delay: delay,
            ease: 'power2.out',
          });
        }
      });
    };

    const interval = setInterval(animateBars, 200);
    return () => clearInterval(interval);
  }, [isPlaying, volume]);

  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-end justify-center gap-1 h-16 w-full"
        >
          {bars.map((bar) => (
            <div
              key={bar}
              ref={(el) => {
                if (el) barsRef.current[bar] = el;
              }}
              className="w-1 bg-gradient-to-t from-dark-accent via-purple-500 to-pink-500 rounded-full transition-all"
              style={{ height: '10%' }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

