import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  Upload,
  Scissors,
  Volume2,
  Zap,
  TrendingUp,
  Gauge,
  Filter,
  Download,
  Play,
  Pause,
  Square,
  RotateCcw,
  Save,
  FileCode,
  FileText,
  FileJson,
  Music,
  Sparkles,
  Copy,
  Check,
  Clock,
} from 'lucide-react';
import { WaveformViewer } from './WaveformViewer';
import {
  loadAudioFile,
  recordAudio,
  normalizeAudio,
  amplifyAudio,
  pitchShift,
  changeSpeed,
  robotizeVoice,
  reduceNoise,
  trimAudio,
  cutAudio,
  convertToPCM,
  PCMOptions,
} from '../utils/audioProcessor';
import {
  exportAsCArray,
  exportAsCHeader,
  exportAsRAW,
  exportAsWAV,
  exportAsJSON,
  downloadFile,
} from '../utils/pcmExporter';

export const AudioEditorPanel = () => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [originalAudioBuffer, setOriginalAudioBuffer] = useState<AudioBuffer | null>(null); // Store original audio
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [pcmSampleRate, setPcmSampleRate] = useState<8000 | 11025 | 16000>(16000);
  const [arrayName, setArrayName] = useState('audioData');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [amplifyGain, setAmplifyGain] = useState(1.5);
  const [pitchSemitones, setPitchSemitones] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [copied, setCopied] = useState(false);
  
  // Default values for reset
  const defaultAmplifyGain = 1.5;
  const defaultPitchSemitones = 0;
  const defaultSpeedMultiplier = 1.0;
  const defaultPcmSampleRate: 8000 | 11025 | 16000 = 16000;
  const defaultArrayName = 'audioData';
  
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (audioBuffer) {
      const duration = audioBuffer.duration;
      setTrimEnd(duration);
    }
  }, [audioBuffer]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await loadAudioFile(file);
      // Store original and current buffer
      setOriginalAudioBuffer(buffer);
      setAudioBuffer(buffer);
      setTrimEnd(buffer.duration);
      setTrimStart(0);
      setCurrentTime(0);
      setPlaybackProgress(0);
    } catch (error) {
      console.error('Failed to load audio:', error);
      alert('Failed to load audio file. Please ensure it is a valid audio file.');
    }
  };

  // Record audio
  const handleRecord = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && recordingStreamRef.current) {
        mediaRecorderRef.current.stop();
        recordingStreamRef.current.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        try {
          const buffer = await audioContext.decodeAudioData(arrayBuffer);
          // Store original and current buffer
          setOriginalAudioBuffer(buffer);
          setAudioBuffer(buffer);
          setTrimEnd(buffer.duration);
          setTrimStart(0);
          setCurrentTime(0);
          setPlaybackProgress(0);
        } catch (error) {
          // Try as WAV
          const wavBlob = new Blob(chunks, { type: 'audio/wav' });
          const wavArrayBuffer = await wavBlob.arrayBuffer();
          const buffer = await audioContext.decodeAudioData(wavArrayBuffer);
          // Store original and current buffer
          setOriginalAudioBuffer(buffer);
          setAudioBuffer(buffer);
          setTrimEnd(buffer.duration);
          setTrimStart(0);
          setCurrentTime(0);
          setPlaybackProgress(0);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording failed:', error);
      alert('Failed to start recording. Please allow microphone access.');
    }
  };

  // Play audio
  const handlePlay = async () => {
    if (!audioBuffer) return;

    if (isPlaying) {
      // Pause
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    source.onended = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
      setCurrentTime(0);
    };

    const startTime = audioContext.currentTime;
    const updateProgress = () => {
      const elapsed = audioContext.currentTime - startTime;
      if (elapsed < audioBuffer.duration) {
        setCurrentTime(elapsed);
        setPlaybackProgress(elapsed / audioBuffer.duration);
        requestAnimationFrame(updateProgress);
      } else {
        setCurrentTime(audioBuffer.duration);
        setPlaybackProgress(1);
      }
    };
    updateProgress();

    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  // Stop playback
  const handleStop = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
    setCurrentTime(0);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset all settings to defaults and restore original audio
  const handleResetSettings = () => {
    // Reset all settings
    setAmplifyGain(defaultAmplifyGain);
    setPitchSemitones(defaultPitchSemitones);
    setSpeedMultiplier(defaultSpeedMultiplier);
    setPcmSampleRate(defaultPcmSampleRate);
    setArrayName(defaultArrayName);
    setSelectedVoiceStyle(null); // Reset voice style selection
    
    // Restore original audio buffer (waveform and all)
    if (originalAudioBuffer) {
      setAudioBuffer(originalAudioBuffer);
      setTrimStart(0);
      setTrimEnd(originalAudioBuffer.duration);
      setCurrentTime(0);
      setPlaybackProgress(0);
      
      // Stop playback if playing
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current = null;
      }
      setIsPlaying(false);
    }
  };

  // Copy PCM bytes to clipboard
  const handleCopyPCMBytes = async () => {
    if (!audioBuffer) {
      alert('Please load or record audio first.');
      return;
    }

    try {
      const options: PCMOptions = {
        sampleRate: pcmSampleRate,
        bitDepth: 8,
      };

      const pcmData = convertToPCM(audioBuffer, options);
      // Convert to comma-separated string
      const bytesString = Array.from(pcmData).join(', ');
      
      await navigator.clipboard.writeText(bytesString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy PCM bytes to clipboard.');
    }
  };

  // Voice style presets
  const voiceStyles = [
    { id: 'robot', name: 'Robot', icon: '🤖', pitch: 0.5, rate: 0.8, description: 'Robotic voice effect' },
    { id: 'child', name: 'Child', icon: '👶', pitch: 1.8, rate: 1.1, description: 'Child-like voice' },
    { id: 'chipmunk', name: 'Chipmunk', icon: '🐿️', pitch: 2.0, rate: 1.2, description: 'High-pitched fast voice' },
    { id: 'female', name: 'Female', icon: '👩', pitch: 1.3, rate: 1.0, description: 'Higher pitched female voice' },
    { id: 'male', name: 'Male', icon: '👨', pitch: 0.7, rate: 0.9, description: 'Deeper male voice' },
    { id: 'alien', name: 'Alien', icon: '👽', pitch: 0.4, rate: 0.7, description: 'Alien-like voice' },
    { id: 'monster', name: 'Monster', icon: '👹', pitch: 0.3, rate: 0.6, description: 'Deep monster voice' },
    { id: 'cartoon', name: 'Cartoon', icon: '🎭', pitch: 1.5, rate: 1.3, description: 'Cartoon character voice' },
  ];

  const [selectedVoiceStyle, setSelectedVoiceStyle] = useState<string | null>(null);

  // Apply voice style
  const applyVoiceStyle = async (styleId: string) => {
    if (!originalAudioBuffer) return;

    const style = voiceStyles.find(s => s.id === styleId);
    if (!style) return;

    setSelectedVoiceStyle(styleId);

    try {
      // Always start from original audio buffer
      let processed = originalAudioBuffer;
      
      // Apply pitch shift first
      const semitones = (style.pitch - 1) * 12; // Convert to semitones
      if (semitones !== 0) {
        processed = await pitchShift(processed, semitones);
      }
      
      // Apply speed change
      if (style.rate !== 1.0) {
        processed = await changeSpeed(processed, style.rate);
      }
      
      // For robot style, apply additional robot effect
      if (styleId === 'robot') {
        processed = await robotizeVoice(processed);
      }
      
      setAudioBuffer(processed);
      setTrimEnd(processed.duration);
    } catch (error) {
      console.error('Voice style failed:', error);
      alert('Failed to apply voice style. Please try again.');
    }
  };

  // Apply effects
  const applyEffect = async (effect: string) => {
    if (!audioBuffer) return;

    let processed: AudioBuffer;
    
    try {
      switch (effect) {
        case 'normalize':
          processed = await normalizeAudio(audioBuffer);
          break;
        case 'amplify':
          processed = await amplifyAudio(audioBuffer, amplifyGain);
          break;
        case 'robot':
          processed = await robotizeVoice(audioBuffer);
          break;
        case 'pitch':
          processed = await pitchShift(audioBuffer, pitchSemitones);
          break;
        case 'speed':
          processed = await changeSpeed(audioBuffer, speedMultiplier);
          break;
        case 'noise':
          processed = await reduceNoise(audioBuffer);
          break;
        case 'trim':
          processed = trimAudio(audioBuffer, trimStart, trimEnd);
          break;
        default:
          return;
      }
      setAudioBuffer(processed);
      setTrimEnd(processed.duration);
    } catch (error) {
      console.error('Effect failed:', error);
      alert('Failed to apply effect. Please try again.');
    }
  };

  // Export functions
  const handleExport = async (format: 'c' | 'header' | 'raw' | 'wav' | 'json') => {
    if (!audioBuffer) {
      alert('Please load or record audio first.');
      return;
    }

    const options: PCMOptions = {
      sampleRate: pcmSampleRate,
      bitDepth: 8,
    };

    const pcmData = convertToPCM(audioBuffer, options);

    switch (format) {
      case 'c':
        downloadFile(exportAsCArray(pcmData, { arrayName, sampleRate: pcmSampleRate }), `${arrayName}.c`);
        break;
      case 'header':
        downloadFile(exportAsCHeader(pcmData, { arrayName, sampleRate: pcmSampleRate }), `${arrayName}.h`);
        break;
      case 'raw':
        downloadFile(exportAsRAW(pcmData), `${arrayName}.raw`);
        break;
      case 'wav':
        downloadFile(exportAsWAV(pcmData, pcmSampleRate), `${arrayName}.wav`);
        break;
      case 'json':
        downloadFile(exportAsJSON(pcmData, { sampleRate: pcmSampleRate }), `${arrayName}.json`);
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="glass-strong rounded-2xl p-4 sm:p-6 border border-dark-border/50">
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
          </motion.div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold gradient-text">PCM Audio Generator</h2>
            <p className="text-sm sm:text-base text-dark-textSecondary">Mini Audacity for ESP32/Arduino</p>
          </div>
        </div>

        {/* Input Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRecord}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-base sm:text-lg ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
            }`}
          >
            <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">{isRecording ? 'Stop Recording' : 'Record Voice'}</span>
            <span className="sm:hidden">{isRecording ? 'Stop' : 'Record'}</span>
          </motion.button>

          <motion.label
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white cursor-pointer text-base sm:text-lg"
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Import WAV/MP3</span>
            <span className="sm:hidden text-center">Import<br/>WAV/MP3</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </motion.label>
        </div>

        {/* Waveform Viewer */}
        <div className="w-full overflow-hidden">
          <WaveformViewer
            audioBuffer={audioBuffer}
            width={800}
            height={150}
            progress={playbackProgress}
          />
        </div>

        {/* Audio Timeline */}
        {audioBuffer && (
          <div className="mt-4 glass rounded-lg px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                <span className="text-sm sm:text-base font-semibold text-dark-text">
                  {formatTime(currentTime)} / {formatTime(audioBuffer.duration)}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-dark-textSecondary">
                <span className="hidden sm:inline">Sample Rate: {audioBuffer.sampleRate}Hz | Channels: {audioBuffer.numberOfChannels}</span>
                <span className="sm:hidden">{audioBuffer.sampleRate}Hz | {audioBuffer.numberOfChannels}ch</span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-dark-surface rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${playbackProgress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        )}

        {/* Playback Controls */}
        {audioBuffer && (
          <div className="flex items-center gap-2 sm:gap-3 mt-4 justify-center sm:justify-start">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlay}
              className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white"
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              className="p-2 sm:p-2.5 rounded-lg bg-red-500 text-white"
            >
              <Square className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Voice Style Selection */}
      {audioBuffer && (
        <div className="glass-strong rounded-2xl p-4 sm:p-6 border border-dark-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <h3 className="text-xl sm:text-2xl font-semibold gradient-text">Voice Style</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {voiceStyles.map((style) => (
              <motion.button
                key={style.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => applyVoiceStyle(style.id)}
                className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 rounded-lg border transition-all ${
                  selectedVoiceStyle === style.id
                    ? 'border-purple-500 bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/30'
                    : 'border-dark-border/50 glass text-dark-textSecondary hover:border-purple-500/50'
                }`}
                title={style.description}
              >
                <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">{style.icon}</div>
                <div className="text-sm sm:text-base font-semibold text-center">{style.name}</div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Audio Editing Tools */}
      {audioBuffer && (
        <div className="glass-strong rounded-2xl p-4 sm:p-6 border border-dark-border/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 mb-4">
            <h3 className="text-xl sm:text-2xl font-semibold gradient-text">Audio Editing</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResetSettings}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 glass border border-dark-border/50 rounded-lg hover:border-orange-500/50 text-dark-textSecondary hover:text-orange-400 transition-all w-full sm:w-auto justify-center sm:justify-start"
            >
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-sm sm:text-base font-medium">Reset Settings</span>
            </motion.button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Normalize */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => applyEffect('normalize')}
              className="flex flex-col items-center gap-2 p-4 glass border border-dark-border/50 rounded-lg hover:border-purple-500/50"
            >
              <Volume2 className="w-5 h-5 text-purple-400" />
              <span className="text-base font-medium">Normalize</span>
            </motion.button>

            {/* Amplify */}
            <div className="flex flex-col gap-2 p-4 glass border border-dark-border/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-base font-medium">Amplify</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={amplifyGain}
                onChange={(e) => setAmplifyGain(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-dark-textSecondary font-medium">{amplifyGain.toFixed(1)}x</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => applyEffect('amplify')}
                className="px-4 py-2 bg-purple-500 text-white rounded text-sm font-medium"
              >
                Apply
              </motion.button>
            </div>

            {/* Robot Voice */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => applyEffect('robot')}
              className="flex flex-col items-center gap-2 p-4 glass border border-dark-border/50 rounded-lg hover:border-purple-500/50"
            >
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="text-base font-medium">Robot Voice</span>
            </motion.button>

            {/* Noise Reduction */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => applyEffect('noise')}
              className="flex flex-col items-center gap-2 p-4 glass border border-dark-border/50 rounded-lg hover:border-purple-500/50"
            >
              <Filter className="w-5 h-5 text-green-400" />
              <span className="text-base font-medium">Noise Reduce</span>
            </motion.button>

            {/* Pitch Shift */}
            <div className="flex flex-col gap-2 p-4 glass border border-dark-border/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-pink-400" />
                <span className="text-base font-medium">Pitch</span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={pitchSemitones}
                onChange={(e) => setPitchSemitones(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-dark-textSecondary font-medium">{pitchSemitones > 0 ? '+' : ''}{pitchSemitones} semitones</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => applyEffect('pitch')}
                className="px-4 py-2 bg-purple-500 text-white rounded text-sm font-medium"
              >
                Apply
              </motion.button>
            </div>

            {/* Speed Change */}
            <div className="flex flex-col gap-2 p-4 glass border border-dark-border/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-5 h-5 text-blue-400" />
                <span className="text-base font-medium">Speed</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-dark-textSecondary font-medium">{speedMultiplier.toFixed(1)}x</span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => applyEffect('speed')}
                className="px-4 py-2 bg-purple-500 text-white rounded text-sm font-medium"
              >
                Apply
              </motion.button>
            </div>

            {/* Trim */}
            {audioBuffer && (
              <div className="flex flex-col gap-2 p-3 sm:p-4 glass border border-dark-border/50 rounded-lg sm:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Scissors className="w-5 h-5 text-orange-400" />
                  <span className="text-base font-medium">Trim (seconds)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-dark-textSecondary font-medium">Start:</label>
                    <input
                      type="number"
                      min="0"
                      max={audioBuffer.duration}
                      step="0.1"
                      value={trimStart}
                      onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                      className="w-full glass border border-dark-border/50 rounded px-3 py-2 text-base"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-dark-textSecondary font-medium">End:</label>
                    <input
                      type="number"
                      min="0"
                      max={audioBuffer.duration}
                      step="0.1"
                      value={trimEnd}
                      onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                      className="w-full glass border border-dark-border/50 rounded px-3 py-2 text-base"
                    />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => applyEffect('trim')}
                  className="px-4 py-2 bg-purple-500 text-white rounded text-sm font-medium mt-2"
                >
                  Apply Trim
                </motion.button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PCM Export Settings */}
      {audioBuffer && (
        <div className="glass-strong rounded-2xl p-4 sm:p-6 border border-dark-border/50">
          <h3 className="text-xl sm:text-2xl font-semibold gradient-text mb-4">PCM Export Settings</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <label className="block text-base font-medium text-dark-textSecondary mb-2">
                Sample Rate
              </label>
              <select
                value={pcmSampleRate}
                onChange={(e) => setPcmSampleRate(parseInt(e.target.value) as 8000 | 11025 | 16000)}
                className="w-full glass border border-dark-border/50 rounded-lg px-4 py-3 text-base text-dark-text"
              >
                <option value={8000}>8000 Hz</option>
                <option value={11025}>11025 Hz</option>
                <option value={16000}>16000 Hz</option>
              </select>
            </div>

            <div>
              <label className="block text-base font-medium text-dark-textSecondary mb-2">
                Array Name
              </label>
              <input
                type="text"
                value={arrayName}
                onChange={(e) => setArrayName(e.target.value)}
                className="w-full glass border border-dark-border/50 rounded-lg px-4 py-3 text-base text-dark-text"
                placeholder="audioData"
              />
            </div>
          </div>

          {/* Copy PCM Bytes to Clipboard */}
          <div className="mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyPCMBytes}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all text-base sm:text-lg ${
                copied
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 sm:w-6 sm:h-6" />
                  Copy PCM Bytes to Clipboard
                </>
              )}
            </motion.button>
            <p className="text-sm text-dark-textSecondary mt-2 text-center">
              Copies only the converted audio bytes (comma-separated values)
            </p>
          </div>

          {/* Export Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport('c')}
              className="flex flex-col items-center gap-2 p-3 glass border border-dark-border/50 rounded-lg hover:border-purple-500/50"
            >
              <FileCode className="w-6 h-6 text-purple-400" />
              <span className="text-sm font-medium">C Array</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport('header')}
              className="flex flex-col items-center gap-2 p-3 glass border border-dark-border/50 rounded-lg hover:border-purple-500/50"
            >
              <FileText className="w-6 h-6 text-blue-400" />
              <span className="text-sm font-medium">C Header</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport('raw')}
              className="flex flex-col items-center gap-2 p-3 glass border border-dark-border/50 rounded-lg hover:border-purple-500/50"
            >
              <Download className="w-6 h-6 text-green-400" />
              <span className="text-sm font-medium">RAW PCM</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport('wav')}
              className="flex flex-col items-center gap-2 p-3 glass border border-dark-border/50 rounded-lg hover:border-purple-500/50"
            >
              <Music className="w-6 h-6 text-pink-400" />
              <span className="text-sm font-medium">WAV</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport('json')}
              className="flex flex-col items-center gap-2 p-3 glass border border-dark-border/50 rounded-lg hover:border-purple-500/50"
            >
              <FileJson className="w-6 h-6 text-yellow-400" />
              <span className="text-sm font-medium">JSON</span>
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

