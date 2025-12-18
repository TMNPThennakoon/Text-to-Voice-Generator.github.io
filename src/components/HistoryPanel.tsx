import { motion, AnimatePresence } from 'framer-motion';
import { History, Trash2, Clock, Play } from 'lucide-react';
import { HistoryItem } from '../types';

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

interface HistoryPanelProps {
  history: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const HistoryPanel = ({ history, onLoad, onDelete, onClear }: HistoryPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
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
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-dark-accent" />
            </motion.div>
            <h3 className="text-lg sm:text-xl font-semibold gradient-text">History</h3>
            <motion.span 
              className="text-xs sm:text-sm text-dark-textSecondary px-2 py-1 rounded bg-dark-surface/50"
              animate={{ scale: history.length > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              ({history.length})
            </motion.span>
          </motion.div>
          {history.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClear}
              className="text-xs sm:text-sm text-red-400 hover:text-red-300 transition-colors px-2 sm:px-3 py-1 rounded border border-red-400/30 hover:bg-red-400/10 whitespace-nowrap"
            >
              Clear All
            </motion.button>
          )}
        </div>

      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
        <AnimatePresence>
          {history.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-dark-textSecondary"
            >
              No history yet. Your generated speech will appear here.
            </motion.div>
          ) : (
            history.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass border border-dark-border/50 hover:border-dark-accent/50 rounded-lg p-4 transition-all group cursor-pointer hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark-text line-clamp-2 mb-2">
                      {item.text}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-dark-textSecondary">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(item.timestamp)}
                      </div>
                      <span>
                        {item.settings.voiceName || 'Default Voice'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onLoad(item)}
                      className="p-2 hover:bg-dark-border rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Load"
                    >
                      <Play className="w-4 h-4 text-dark-text" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-2 hover:bg-dark-border rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      </div>
    </motion.div>
  );
};

