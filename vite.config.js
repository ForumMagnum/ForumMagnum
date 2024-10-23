import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/packages/lesswrong',
    },
  },
  define: {
    bundleIsServer: false,
    bundleIsTest: false,
    bundleIsE2E: false,
    bundleIsProduction: false,
    bundleIsMigrations: true,
    serverPort: 5001,
    estrellaPid: -1,
    global: 'globalThis',
    defaultSiteAbsoluteUrl: null,
  },
  build: {
    commonjsOptions: { transformMixedEsModules: true }
  }
})