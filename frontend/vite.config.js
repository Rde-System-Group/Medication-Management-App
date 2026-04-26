import { defineConfig, loadEnv  } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig( ({mode}) => {
const env = loadEnv(mode, process.cwd(), '')
return { 
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: env.BACKEND_URL,
        changeOrigin: true,
        secure: false,
<<<<<<< Updated upstream
        rewrite: (path) => path.replace('/api/rest', '/rest'),
=======
        rewrite: (path) => path.replace(/^\/api\/rest/, '/rest'),
      },
      // Maps /cfm/prescriptions.cfm directly to the wwwroot
      '/cfm': {
        target: env.BACKEND_URL || 'http://localhost:8500',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/cfm/, '/rde/api'), // update this to your root path you have to access /backend
>>>>>>> Stashed changes
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
              // Strip Domain and SameSite, set Path=/ so cookie is sent on all requests
              proxyRes.headers['set-cookie'] = cookies.map(cookie =>
                cookie
                  .replace(/;\s*Domain=[^;]*/i, '')
                  .replace(/;\s*SameSite=[^;]*/i, '')
                  // .replace(/;\s*Secure/i, '')   // remove Secure since we're on HTTP locally
              );
            }
          });
        }
      },
    },
  },
}
});