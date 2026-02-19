import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths(), nodePolyfills()],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
    // Jika Anda butuh scoped CSS (opsional), biarkan, jika tidak bisa dihapus
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['js-big-decimal'],
  },
  build: {
    // Kembalikan ke standar Vite & Vercel
    outDir: 'dist', 
    emptyOutDir: true,
  }
})