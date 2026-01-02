import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    // 🔹 REQUIRED for GitHub Pages (repo name)
    base: '/ClassLog/',

    // 🔹 Build output folder GitHub Pages can serve
    build: {
      outDir: 'docs',
      emptyOutDir: true
    },

    // 🔹 Dev server (does not affect deployment)
    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    // 🔹 Environment variables (frontend-visible)
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    // 🔹 Path aliases
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  }
})
