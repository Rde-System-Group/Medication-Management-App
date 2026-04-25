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
      // Maps /cfm/prescriptions.cfm directly to the wwwroot
      '/cfm': {
        target: env.BACKEND_URL || 'http://localhost:8500',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/cfm/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
              proxyRes.headers['set-cookie'] = cookies.map(cookie =>
                cookie
                  .replace(/;\s*Domain=[^;]*/i, '')
                  .replace(/;\s*SameSite=[^;]*/i, '')
                  .replace(/;\s*Secure/i, '') // remove Secure since we're on HTTP locally
              );
            }
          });
        }
      },
    },
  },
}});
