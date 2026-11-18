import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base: './' -> rutas relativas: funciona en Vercel, Netlify y GitHub Pages (también en subcarpetas).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
