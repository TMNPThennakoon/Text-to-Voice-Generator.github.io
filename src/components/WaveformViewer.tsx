import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface WaveformViewerProps {
  audioBuffer: AudioBuffer | null;
  width?: number;
  height?: number;
  color?: string;
  progress?: number; // 0-1 for playback progress
}

export const WaveformViewer = ({
  audioBuffer,
  width = 800,
  height = 200,
  color = '#6366f1',
  progress = 0,
}: WaveformViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get responsive width - use container width on mobile, fixed width on desktop
    const container = canvas.parentElement?.parentElement;
    const containerWidth = container ? Math.max(container.clientWidth - 32, 300) : width; // Subtract padding, min 300px
    const responsiveWidth = window.innerWidth < 640 ? containerWidth : width;
    
    canvas.width = responsiveWidth;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = 'rgba(18, 18, 18, 0.5)';
    ctx.fillRect(0, 0, responsiveWidth, height);

    // Get audio data
    const channelData = audioBuffer.getChannelData(0);
    const samples = channelData.length;
    const step = Math.ceil(samples / responsiveWidth);
    const amp = height / 2;

    // Draw waveform
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < responsiveWidth; i++) {
      const sampleIndex = Math.floor(i * step);
      if (sampleIndex >= samples) break;

      let min = 0;
      let max = 0;

      // Find min/max in this sample range
      for (let j = 0; j < step && sampleIndex + j < samples; j++) {
        const value = channelData[sampleIndex + j];
        min = Math.min(min, value);
        max = Math.max(max, value);
      }

      const x = i;
      const y1 = amp + min * amp;
      const y2 = amp + max * amp;

      if (i === 0) {
        ctx.moveTo(x, y1);
      } else {
        ctx.lineTo(x, y1);
        ctx.lineTo(x, y2);
      }
    }

    ctx.stroke();

    // Draw progress line
    if (progress > 0) {
      const progressX = progress * responsiveWidth;
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, height);
      ctx.stroke();
    }

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, amp);
    ctx.lineTo(responsiveWidth, amp);
    ctx.stroke();
  }, [audioBuffer, width, height, color, progress]);

  if (!audioBuffer) {
    return (
      <div className="glass border border-dark-border/50 rounded-xl p-6 sm:p-8 flex items-center justify-center min-h-[150px] sm:min-h-[200px]">
        <p className="text-base sm:text-lg text-dark-textSecondary text-center font-medium">No audio loaded</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass border border-dark-border/50 rounded-xl p-2 sm:p-4 w-full"
    >
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg max-w-full"
        style={{ height, maxWidth: '100%' }}
      />
    </motion.div>
  );
};

