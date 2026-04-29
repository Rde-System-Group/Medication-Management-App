import { defineConfig, loadEnv  } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig( ({mode}) => {
const env = loadEnv(mode, process.cwd(), '')
return { 
  plugins: [react()],
  server: {
    proxy: {
      '/api/rest': {
        target: env.BACKEND_URL || 'http://localhost:8500',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/rest/, '/rest'),
      },
      // Patient-side endpoints live in backend/api/ and are registered by ColdFusion under /rest/<restPath>.
      // Strip the leading /api segment so /rest/api/patients/1 routes to /rest/patients/1 on the backend.
      '/rest/api': {
        target: env.BACKEND_URL || 'http://localhost:8500',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/rest\/api/, '/rest'),
      },
      '/rest': {
        target: env.BACKEND_URL || 'http://localhost:8500',
        changeOrigin: true,
        secure: false,
      },
      '/cfm': {
        target: env.BACKEND_URL || 'http://localhost:8500',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => `/api/Medication-Management-App/backend${path.replace(/^\/cfm/, '')}`,
        cookieDomainRewrite: '',
        cookiePathRewrite: '/',
      },
    },
  },
}});
