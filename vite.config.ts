import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-charts': ['recharts'],
          'export-pdf': ['jspdf', 'jspdf-autotable'],
          'export-excel': ['xlsx'],
          'export-canvas': ['html2canvas'],
        },
      },
    },
  },
})
