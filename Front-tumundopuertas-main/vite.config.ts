import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Configuración para PWA
  publicDir: 'public',
  build: {
    // Code splitting automático
    rollupOptions: {
      output: {
        // Asegurar que el service worker se copie al build
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'sw.js') {
            return 'sw.js';
          }
          return 'assets/[name].[ext]';
        },
        // Separar vendor chunks para mejor caching
        manualChunks: {
          // Separar vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-tabs',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react', 'react-icons'],
        },
      },
    },
    // Optimizar chunks
    chunkSizeWarningLimit: 1000,
  },
  // Optimizar dependencias
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router'],
  },
})
