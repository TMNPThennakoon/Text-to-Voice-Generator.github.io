# Text to Voice Generator 🎤

A modern, advanced text-to-speech (TTS) platform built with React, TypeScript, Tailwind CSS, Framer Motion, and GSAP. This is a **100% free** platform that uses the browser's built-in Web Speech API.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/TMNPThennakoon/Text-to-Voice-Generator)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://TMNPThennakoon.github.io/Text-to-Voice-Generator/)

**Repository:** [https://github.com/TMNPThennakoon/Text-to-Voice-Generator](https://github.com/TMNPThennakoon/Text-to-Voice-Generator)

**🌐 Live Demo:** [https://TMNPThennakoon.github.io/Text-to-Voice-Generator/](https://TMNPThennakoon.github.io/Text-to-Voice-Generator/)

## ✨ Features

### Core Features
- **Text Input** - Large textarea with character and word count
- **Voice Selection** - Multiple voices (languages, accents, genders)
- **Voice Controls** - Adjustable speed, pitch, and volume
- **Playback Controls** - Play, pause, stop functionality
- **Audio Download** - Save generated speech (browser limitations apply)
- **History Management** - Save and load previous generations
- **File Upload** - Import text files (.txt)

### Advanced Features
- **Chunk Processing** - Handles long texts by splitting into chunks
- **Real-time Stats** - Character count, word count, and estimated speech time
- **Voice Preview** - Test voices before generating
- **Dark UI** - Beautiful dark theme with smooth animations
- **Responsive Design** - Works on desktop, tablet, and mobile
- **LocalStorage** - Saves history and preferences locally
- **Smooth Animations** - Framer Motion and GSAP animations

### UI/UX Features
- **Modern Dark UI** - Sleek dark theme
- **Smooth Animations** - Framer Motion and GSAP for fluid interactions
- **Responsive Layout** - Adapts to all screen sizes
- **Keyboard Shortcuts** - Quick actions
- **Progress Indicators** - Visual feedback
- **Error Handling** - Graceful error messages

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Modern browser with Web Speech API support (Chrome, Edge, Safari, Firefox)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TMNPThennakoon/Text-to-Voice-Generator.git
   cd Text-to-Voice-Generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173` (or the port shown in the terminal)

### Building for Production

```bash
npm run build
# or
yarn build
# or
pnpm build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
# or
yarn preview
# or
pnpm preview
```

## 📦 Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animation library
- **GSAP** - Advanced animations
- **Lucide React** - Icons
- **Web Speech API** - Text-to-speech (browser native, free)

## 🎯 Usage

1. **Enter Text** - Type or paste your text in the text area
2. **Select Voice** - Choose from available voices in the voice settings
3. **Adjust Settings** - Customize speed, pitch, and volume
4. **Play** - Click the play button to start speech
5. **Control** - Use pause/stop buttons to control playback
6. **Download** - Download the audio (browser limitations apply)
7. **History** - Access your previous generations from the history panel

## 🔧 Configuration

### Voice Settings
- **Voice** - Select from available system voices
- **Speed** - 0.5x to 2.0x (default: 1.0x)
- **Pitch** - 0.5 to 2.0 (default: 1.0)
- **Volume** - 0% to 100% (default: 100%)

### History
- History is saved in localStorage
- Maximum 50 items are stored
- History persists across browser sessions

## 📝 Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Safari (macOS/iOS)
- ✅ Firefox
- ⚠️ Some older browsers may have limited voice support

## 🎨 Customization

### Dark Theme Colors
Edit `tailwind.config.js` to customize the dark theme:
```js
colors: {
  dark: {
    bg: '#0a0a0a',
    surface: '#121212',
    card: '#1a1a1a',
    border: '#2a2a2a',
    accent: '#6366f1',
    // ... more colors
  }
}
```

### Animations
- Framer Motion animations: Edit component files
- GSAP animations: Modify `App.tsx` and component files

## 🐛 Known Limitations

1. **Audio Download** - Web Speech API doesn't directly support audio recording. For production use, consider integrating a TTS API service (Google Cloud TTS, Amazon Polly, Azure TTS, etc.).

2. **Voice Quality** - Voice quality depends on browser and system voices.

3. **Long Texts** - Very long texts are split into chunks for processing.

4. **Browser Support** - Some browsers may have limited voice support.

## 🚧 Future Enhancements

- [ ] SSML support for advanced speech control
- [ ] Emotion/tone selection
- [ ] Text highlighting during playback
- [ ] Audio format selection (MP3, WAV, OGG)
- [ ] Voice cloning (requires API integration)
- [ ] Batch processing
- [ ] Export/import functionality
- [ ] Keyboard shortcuts
- [ ] Audio visualization

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

## 🙏 Acknowledgments

- Web Speech API for free TTS
- React team for the amazing framework
- Tailwind CSS for the utility-first CSS
- Framer Motion and GSAP for animations
- Lucide for the beautiful icons

---

Made with ❤️ using React, TypeScript, Tailwind CSS, Framer Motion & GSAP

