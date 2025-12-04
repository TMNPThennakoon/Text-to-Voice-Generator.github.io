import { motion, AnimatePresence } from 'framer-motion';
import { X, Music, FileAudio } from 'lucide-react';
import { useState } from 'react';

export type AudioFormat = 'wav' | 'mp3' | 'ogg' | 'webm';

interface AudioFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFormat: (format: AudioFormat) => void;
}

export const AudioFormatModal = ({ isOpen, onClose, onSelectFormat }: AudioFormatModalProps) => {
  const [selectedFormat, setSelectedFormat] = useState<AudioFormat>('wav');

  const formats = [
    { value: 'wav' as AudioFormat, label: 'WAV', description: 'High quality, uncompressed', icon: '🎵' },
    { value: 'mp3' as AudioFormat, label: 'MP3', description: 'Compressed, widely compatible', icon: '🎶' },
    { value: 'ogg' as AudioFormat, label: 'OGG', description: 'Open source, compressed', icon: '🎧' },
    { value: 'webm' as AudioFormat, label: 'WebM', description: 'Web optimized, modern format', icon: '🌐' },
  ];

  const handleConfirm = () => {
    onSelectFormat(selectedFormat);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl p-4 sm:p-6 border border-dark-border/50 w-full max-w-md relative overflow-hidden mx-4 sm:mx-0"
            >
              {/* Animated gradient border */}
              <div className="absolute inset-0 rounded-2xl opacity-20">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl animate-pulse-slow" />
              </div>

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-blue-400" />
                    <h3 className="text-xl sm:text-2xl font-semibold gradient-text">Select Audio Format</h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 hover:bg-dark-hover rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-dark-textSecondary" />
                  </motion.button>
                </div>

                {/* Format Options */}
                <div className="space-y-3 mb-6">
                  {formats.map((format) => (
                    <motion.button
                      key={format.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedFormat(format.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        selectedFormat === format.value
                          ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/30'
                          : 'border-dark-border/50 glass hover:border-blue-500/50'
                      }`}
                    >
                      <div className="text-3xl">{format.icon}</div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <FileAudio className="w-5 h-5 text-dark-textSecondary" />
                          <span className="text-base font-semibold text-dark-text">{format.label}</span>
                        </div>
                        <p className="text-sm text-dark-textSecondary mt-1">{format.description}</p>
                      </div>
                      {selectedFormat === format.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 px-4 py-3 glass border border-dark-border/50 rounded-lg text-base text-dark-text font-semibold transition-all hover:border-dark-border"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white text-base font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/50"
                  >
                    Download {selectedFormat.toUpperCase()}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

