import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Disable lightningcss CSS minification — it has a bug with @keyframes in Vite 8
    // JS is still minified; CSS will be unminified but fully functional
    cssMinify: false,
  },
})
