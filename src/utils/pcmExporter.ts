// PCM Export utilities for ESP32/Arduino

export interface ExportOptions {
  arrayName?: string;
  sampleRate: number;
}

// Export as C array
export const exportAsCArray = (
  pcmData: Uint8Array,
  options: ExportOptions
): string => {
  const { arrayName = 'audioData', sampleRate } = options;
  const lines: string[] = [];
  
  lines.push(`// PCM Audio Data - ${pcmData.length} samples`);
  lines.push(`// Sample Rate: ${sampleRate} Hz`);
  lines.push(`// Format: 8-bit unsigned PCM`);
  lines.push(`const uint8_t ${arrayName}[] = {`);
  
  const chunkSize = 16;
  for (let i = 0; i < pcmData.length; i += chunkSize) {
    const chunk = pcmData.slice(i, Math.min(i + chunkSize, pcmData.length));
    const values = Array.from(chunk).map(v => v.toString().padStart(3, ' ')).join(', ');
    lines.push(`  ${values}${i + chunkSize < pcmData.length ? ',' : ''}`);
  }
  
  lines.push(`};`);
  lines.push(`const size_t ${arrayName}_length = ${pcmData.length};`);
  
  return lines.join('\n');
};

// Export as C header file
export const exportAsCHeader = (
  pcmData: Uint8Array,
  options: ExportOptions
): string => {
  const { arrayName = 'audioData', sampleRate } = options;
  const headerGuard = `AUDIO_DATA_${arrayName.toUpperCase()}_H`;
  
  const lines: string[] = [];
  lines.push(`#ifndef ${headerGuard}`);
  lines.push(`#define ${headerGuard}`);
  lines.push('');
  lines.push(`// PCM Audio Data - ${pcmData.length} samples`);
  lines.push(`// Sample Rate: ${sampleRate} Hz`);
  lines.push(`// Format: 8-bit unsigned PCM`);
  lines.push(`extern const uint8_t ${arrayName}[];`);
  lines.push(`extern const size_t ${arrayName}_length;`);
  lines.push('');
  lines.push(`#endif // ${headerGuard}`);
  
  return lines.join('\n');
};

// Export as RAW PCM file
export const exportAsRAW = (pcmData: Uint8Array): Blob => {
  return new Blob([pcmData], { type: 'application/octet-stream' });
};

// Export as WAV file
export const exportAsWAV = (
  pcmData: Uint8Array,
  sampleRate: number
): Blob => {
  const buffer = new ArrayBuffer(44 + pcmData.length);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (PCM)
  view.setUint16(22, 1, true); // num channels (mono)
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate, true); // byte rate
  view.setUint16(32, 1, true); // block align
  view.setUint16(34, 8, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, pcmData.length, true);
  
  // PCM data
  const dataView = new Uint8Array(buffer, 44);
  dataView.set(pcmData);
  
  return new Blob([buffer], { type: 'audio/wav' });
};

// Export as JSON
export const exportAsJSON = (
  pcmData: Uint8Array,
  options: ExportOptions
): string => {
  const { sampleRate } = options;
  return JSON.stringify({
    sampleRate,
    bitDepth: 8,
    channels: 1,
    length: pcmData.length,
    duration: pcmData.length / sampleRate,
    data: Array.from(pcmData),
  }, null, 2);
};

// Download file
export const downloadFile = (content: string | Blob, filename: string) => {
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: 'text/plain' })
    : content;
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

