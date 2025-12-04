import { useState, useCallback } from 'react';

// Multiple free translation APIs for unlimited translations
const MYMEMORY_API = 'https://api.mymemory.translated.net/get';
const LIBRETRANSLATE_API = 'https://libretranslate.de/translate';
const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single';

// Function to clean warning messages from translated text
const cleanTranslationText = (text: string): string => {
  if (!text) return text;
  
  // Remove MyMemory warning messages
  let cleaned = text.replace(/MYMEMORYWARNING:.*?VISIT.*?/gi, '');
  cleaned = cleaned.replace(/MYMEMORYWARNING:.*?/gi, '');
  cleaned = cleaned.replace(/YOUUSEDALLAVAILABLEFREETRANSLATIONS.*?/gi, '');
  cleaned = cleaned.replace(/NEXTAVAILABLEIN.*?/gi, '');
  cleaned = cleaned.replace(/VISIT.*?USAGELIMITS.*?/gi, '');
  cleaned = cleaned.replace(/HTTPS?:\/\/[^\s]+/gi, '');
  
  // Remove any remaining warning patterns
  cleaned = cleaned.replace(/WARNING:.*?/gi, '');
  cleaned = cleaned.replace(/LIMIT.*?/gi, '');
  
  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
};

// Translate using MyMemory API
const translateWithMyMemory = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
  const langPair = `${sourceLang}|${targetLang}`;
  const response = await fetch(
    `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${langPair}`
  );
  const data = await response.json();
  
  if (data.responseData && data.responseData.translatedText) {
    return cleanTranslationText(data.responseData.translatedText);
  }
  throw new Error('MyMemory translation failed');
};

// Translate using LibreTranslate API (free, no limits)
const translateWithLibreTranslate = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
  try {
    const response = await fetch(LIBRETRANSLATE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      })
    });
    
    if (!response.ok) throw new Error('LibreTranslate failed');
    
    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    throw new Error('LibreTranslate unavailable');
  }
};

// Translate using Google Translate (free, unlimited)
const translateWithGoogle = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
  try {
    const url = `${GOOGLE_TRANSLATE_API}?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0].map((item: any[]) => item[0]).join('');
    }
    throw new Error('Google Translate failed');
  } catch (error) {
    throw new Error('Google Translate unavailable');
  }
};

export const useTranslation = () => {
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLang, setSourceLang] = useState('en'); // Default to English
  const [targetLang, setTargetLang] = useState('si'); // Default to Sinhala

  const translateText = useCallback(async (text: string, targetLanguage?: string, sourceLanguage?: string) => {
    if (!text.trim()) {
      setTranslatedText('');
      return;
    }

    setIsTranslating(true);
    const finalTarget = targetLanguage || targetLang;
    const finalSource = sourceLanguage || sourceLang;

    try {
      // Split long text into chunks for better handling
      const maxChunkLength = 1000; // Increased chunk size
      const textChunks = [];
      
      if (text.length > maxChunkLength) {
        // Split by sentences to maintain context
        const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
        let currentChunk = '';
        
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length <= maxChunkLength) {
            currentChunk += sentence;
          } else {
            if (currentChunk) textChunks.push(currentChunk.trim());
            currentChunk = sentence;
          }
        }
        if (currentChunk) textChunks.push(currentChunk.trim());
      } else {
        textChunks.push(text);
      }

      // Try multiple translation APIs with fallback
      const translateChunk = async (chunk: string): Promise<string> => {
        // Try Google Translate first (most reliable, unlimited)
        try {
          return await translateWithGoogle(chunk, finalSource, finalTarget);
        } catch (error) {
          console.log('Google Translate failed, trying LibreTranslate...');
        }

        // Try LibreTranslate as second option
        try {
          return await translateWithLibreTranslate(chunk, finalSource, finalTarget);
        } catch (error) {
          console.log('LibreTranslate failed, trying MyMemory...');
        }

        // Fallback to MyMemory (with warning cleaning)
        try {
          return await translateWithMyMemory(chunk, finalSource, finalTarget);
        } catch (error) {
          console.error('All translation APIs failed');
          return chunk; // Return original if all fail
        }
      };

      // Translate all chunks in parallel
      const translatedChunks = await Promise.all(
        textChunks.map(chunk => translateChunk(chunk))
      );

      // Join chunks and clean any remaining warnings
      const finalTranslation = cleanTranslationText(translatedChunks.join(' '));
      setTranslatedText(finalTranslation);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText(cleanTranslationText(text));
    } finally {
      setIsTranslating(false);
    }
  }, [sourceLang, targetLang]);

  const clearTranslation = useCallback(() => {
    setTranslatedText('');
  }, []);

  const swapLanguages = useCallback(() => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    // Swap texts
    const tempText = translatedText;
    setTranslatedText('');
  }, [sourceLang, targetLang, translatedText]);

  return {
    translatedText,
    isTranslating,
    sourceLang,
    targetLang,
    translateText,
    setSourceLang,
    setTargetLang,
    swapLanguages,
    clearTranslation,
  };
};

// Comprehensive list of world languages with country codes
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', country: 'United Kingdom' },
  { code: 'si', name: 'Sinhala', flag: '🇱🇰', country: 'Sri Lanka (LK)' },
  { code: 'ta', name: 'Tamil', flag: '🇱🇰', country: 'Sri Lanka' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', country: 'Spain' },
  { code: 'fr', name: 'French', flag: '🇫🇷', country: 'France' },
  { code: 'de', name: 'German', flag: '🇩🇪', country: 'Germany' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', country: 'Italy' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', country: 'Portugal' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', country: 'Russia' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', country: 'Japan' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', country: 'South Korea' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', country: 'China' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', country: 'Saudi Arabia' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', country: 'India' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱', country: 'Netherlands' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱', country: 'Poland' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷', country: 'Turkey' },
  { code: 'th', name: 'Thai', flag: '🇹🇭', country: 'Thailand' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', country: 'Vietnam' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩', country: 'Indonesia' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾', country: 'Malaysia' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩', country: 'Bangladesh' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰', country: 'Pakistan' },
  { code: 'fa', name: 'Persian', flag: '🇮🇷', country: 'Iran' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱', country: 'Israel' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿', country: 'Czech Republic' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪', country: 'Sweden' },
  { code: 'da', name: 'Danish', flag: '🇩🇰', country: 'Denmark' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮', country: 'Finland' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴', country: 'Norway' },
  { code: 'el', name: 'Greek', flag: '🇬🇷', country: 'Greece' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴', country: 'Romania' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺', country: 'Hungary' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦', country: 'Ukraine' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬', country: 'Bulgaria' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷', country: 'Croatia' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰', country: 'Slovakia' },
  { code: 'sl', name: 'Slovenian', flag: '🇸🇮', country: 'Slovenia' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸', country: 'Serbia' },
  { code: 'lt', name: 'Lithuanian', flag: '🇱🇹', country: 'Lithuania' },
  { code: 'lv', name: 'Latvian', flag: '🇱🇻', country: 'Latvia' },
  { code: 'et', name: 'Estonian', flag: '🇪🇪', country: 'Estonia' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪', country: 'Kenya' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦', country: 'South Africa' },
  { code: 'zu', name: 'Zulu', flag: '🇿🇦', country: 'South Africa' },
  { code: 'ne', name: 'Nepali', flag: '🇳🇵', country: 'Nepal' },
  { code: 'my', name: 'Burmese', flag: '🇲🇲', country: 'Myanmar' },
  { code: 'km', name: 'Khmer', flag: '🇰🇭', country: 'Cambodia' },
  { code: 'lo', name: 'Lao', flag: '🇱🇦', country: 'Laos' },
  { code: 'ka', name: 'Georgian', flag: '🇬🇪', country: 'Georgia' },
  { code: 'hy', name: 'Armenian', flag: '🇦🇲', country: 'Armenia' },
  { code: 'az', name: 'Azerbaijani', flag: '🇦🇿', country: 'Azerbaijan' },
  { code: 'kk', name: 'Kazakh', flag: '🇰🇿', country: 'Kazakhstan' },
  { code: 'uz', name: 'Uzbek', flag: '🇺🇿', country: 'Uzbekistan' },
  { code: 'mn', name: 'Mongolian', flag: '🇲🇳', country: 'Mongolia' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳', country: 'India' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳', country: 'India' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳', country: 'India' },
  { code: 'gu', name: 'Gujarati', flag: '🇮🇳', country: 'India' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳', country: 'India' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳', country: 'India' },
  { code: 'yi', name: 'Yiddish', flag: '🇮🇱', country: 'Israel' },
  { code: 'cy', name: 'Welsh', flag: '🇬🇧', country: 'United Kingdom' },
  { code: 'ga', name: 'Irish', flag: '🇮🇪', country: 'Ireland' },
  { code: 'is', name: 'Icelandic', flag: '🇮🇸', country: 'Iceland' },
  { code: 'mk', name: 'Macedonian', flag: '🇲🇰', country: 'North Macedonia' },
  { code: 'sq', name: 'Albanian', flag: '🇦🇱', country: 'Albania' },
  { code: 'bs', name: 'Bosnian', flag: '🇧🇦', country: 'Bosnia' },
  { code: 'mt', name: 'Maltese', flag: '🇲🇹', country: 'Malta' },
  { code: 'eu', name: 'Basque', flag: '🇪🇸', country: 'Spain' },
  { code: 'ca', name: 'Catalan', flag: '🇪🇸', country: 'Spain' },
  { code: 'gl', name: 'Galician', flag: '🇪🇸', country: 'Spain' },
  { code: 'br', name: 'Breton', flag: '🇫🇷', country: 'France' },
  { code: 'co', name: 'Corsican', flag: '🇫🇷', country: 'France' },
  { code: 'gd', name: 'Scottish Gaelic', flag: '🇬🇧', country: 'United Kingdom' },
  { code: 'lb', name: 'Luxembourgish', flag: '🇱🇺', country: 'Luxembourg' },
  { code: 'fy', name: 'Frisian', flag: '🇳🇱', country: 'Netherlands' },
  { code: 'be', name: 'Belarusian', flag: '🇧🇾', country: 'Belarus' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹', country: 'Ethiopia' },
  { code: 'so', name: 'Somali', flag: '🇸🇴', country: 'Somalia' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬', country: 'Nigeria' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬', country: 'Nigeria' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬', country: 'Nigeria' },
  { code: 'xh', name: 'Xhosa', flag: '🇿🇦', country: 'South Africa' },
  { code: 'st', name: 'Sesotho', flag: '🇱🇸', country: 'Lesotho' },
  { code: 'tn', name: 'Setswana', flag: '🇧🇼', country: 'Botswana' },
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼', country: 'Rwanda' },
  { code: 'mg', name: 'Malagasy', flag: '🇲🇬', country: 'Madagascar' },
  { code: 'eo', name: 'Esperanto', flag: '🌐', country: 'International' },
  { code: 'la', name: 'Latin', flag: '🏛️', country: 'Historical' },
  { code: 'gd', name: 'Gaelic', flag: '🇮🇪', country: 'Ireland' },
  { code: 'haw', name: 'Hawaiian', flag: '🇺🇸', country: 'USA' },
  { code: 'mi', name: 'Maori', flag: '🇳🇿', country: 'New Zealand' },
  { code: 'sm', name: 'Samoan', flag: '🇼🇸', country: 'Samoa' },
  { code: 'ty', name: 'Tahitian', flag: '🇵🇫', country: 'French Polynesia' },
];

