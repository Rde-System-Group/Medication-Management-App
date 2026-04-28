import { defineConfig, loadEnv  } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig( ({mode}) => {
const env = loadEnv(mode, process.cwd(), '')
return { 
  plugins: [react()],
  server: {
    proxy: {
      '/cfm': {
        target: env.BACKEND_URL || 'http://localhost:8500',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/cfm/, ''),
        cookieDomainRewrite: '',
        cookiePathRewrite: '/',
      },
    },
  },
}});
