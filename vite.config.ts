import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use the GitHub repository name as the base path for GitHub Pages
  base: '/Text-to-Voice-Generator.github.io/',
})

