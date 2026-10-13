import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves project sites from /<repo>/
  base: process.env.GITHUB_PAGES ? '/QuizApp/' : '/',
  plugins: [react(), tailwindcss()],
})
