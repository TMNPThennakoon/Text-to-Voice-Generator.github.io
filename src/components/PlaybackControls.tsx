import { motion } from 'framer-motion';
import { Play, Pause, Square, Download } from 'lucide-react';
import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onDownload: () => void;
  disabled?: boolean;
}

export const PlaybackControls = ({
  isPlaying,
  isPaused,
  onPlay,
  onPause,
  onStop,
  onDownload,
  disabled = false,
}: PlaybackControlsProps) => {
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);

  const handlePlayPause = () => {
    if (isPlaying && !isPaused) {
      onPause();
    } else {
      onPlay();
    }
  };

  const handleButtonClick = (callback: () => void) => {
    // Ripple effect
    if (rippleRef.current && playButtonRef.current) {
      const button = playButtonRef.current;
      const rect = button.getBoundingClientRect();
      const x = rect.width / 2;
      const y = rect.height / 2;

      gsap.fromTo(
        rippleRef.current,
        {
          x: x,
          y: y,
          scale: 0,
          opacity: 0.6,
        },
        {
          scale: 3,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
        }
      );
    }

    // Button animation
    if (playButtonRef.current) {
      gsap.to(playButtonRef.current, {
        scale: 0.9,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
      });
    }

    callback();
  };

  // Pulsing animation when playing
  useEffect(() => {
    if (isPlaying && !isPaused && playButtonRef.current) {
      const pulse = gsap.to(playButtonRef.current, {
        boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.7)',
        repeat: -1,
        duration: 1.5,
        ease: 'power2.out',
      });

      return () => {
        pulse.kill();
      };
    }
  }, [isPlaying, isPaused]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex items-center gap-2 sm:gap-4 justify-center sm:justify-start"
    >
      {/* Main Play/Pause Button with Ripple Effect */}
      <div className="relative">
        <motion.button
          ref={playButtonRef}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleButtonClick(handlePlayPause)}
          disabled={disabled}
          className="relative bg-gradient-to-r from-dark-accent via-purple-500 to-pink-500 hover:from-dark-accentHover hover:via-purple-600 hover:to-pink-600 text-white rounded-full p-3 sm:p-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-dark-accent/50 overflow-hidden group"
        >
          <div
            ref={rippleRef}
            className="absolute w-4 h-4 bg-white rounded-full pointer-events-none"
            style={{ transform: 'translate(-50%, -50%)' }}
          />
          <motion.div
            animate={{
              scale: isPlaying && !isPaused ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 1.5,
              repeat: isPlaying && !isPaused ? Infinity : 0,
            }}
          >
            {isPlaying && !isPaused ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5 sm:ml-1 relative z-10" />
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* Stop Button */}
      <motion.button
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(42, 42, 42, 1)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleButtonClick(onStop)}
        disabled={disabled || (!isPlaying && !isPaused)}
        className="glass border border-dark-border text-dark-text rounded-full p-2.5 sm:p-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-dark-accent/50"
      >
        <Square className="w-4 h-4 sm:w-5 sm:h-5" />
      </motion.button>

      {/* Download Button */}
      <motion.button
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(42, 42, 42, 1)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleButtonClick(onDownload)}
        disabled={disabled}
        className="glass border border-dark-border text-dark-text rounded-full p-2.5 sm:p-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-dark-accent/50"
      >
        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
      </motion.button>
    </motion.div>
  );
};

