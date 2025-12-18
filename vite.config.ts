import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Use the repository name as the base so assets resolve correctly on GitHub Pages
// Project URL: https://tmnpthennakoon.github.io/Text-to-Voice-Generator.github.io/
export default defineConfig({
  plugins: [react()],
  base: '/Text-to-Voice-Generator.github.io/',
})

