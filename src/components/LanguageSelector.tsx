import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '../hooks/useTranslation';

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
  label: string;
  placeholder?: string;
}

export const LanguageSelector = ({ value, onChange, label, placeholder = 'Search language...' }: LanguageSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedLanguage = LANGUAGES.find(lang => lang.code === value);

  // Filter languages based on search query
  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    // Add event listener with a small delay to avoid immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-base font-semibold text-dark-textSecondary mb-2 block">{label}</label>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass border border-dark-border/50 rounded-lg px-4 py-3 text-base text-dark-text focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          {selectedLanguage?.flag} {selectedLanguage?.name}
        </span>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute z-50 w-full mt-2 glass-strong border border-dark-border/50 rounded-xl shadow-xl overflow-hidden"
            >
              {/* Search Input */}
              <div className="p-3 border-b border-dark-border/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-textSecondary" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={placeholder}
                    className="w-full glass border border-dark-border/50 rounded-lg px-11 py-3 text-base text-dark-text placeholder-dark-textSecondary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary hover:text-dark-text"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Language List */}
              <div className="max-h-60 overflow-y-auto scrollbar-hide">
                {filteredLanguages.length === 0 ? (
                  <div className="p-4 text-center text-dark-textSecondary text-base">
                    No languages found
                  </div>
                ) : (
                  filteredLanguages.map((lang) => (
                    <motion.button
                      key={lang.code}
                      whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                      onClick={() => handleSelect(lang.code)}
                      className={`w-full px-4 py-3 text-left text-base transition-colors flex items-center gap-3 ${
                        value === lang.code
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-dark-text hover:bg-dark-hover'
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <div className="flex-1">
                        <div className="font-medium">{lang.name}</div>
                        <div className="text-sm text-dark-textSecondary">{lang.country}</div>
                      </div>
                      {value === lang.code && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-blue-500"
                        />
                      )}
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

