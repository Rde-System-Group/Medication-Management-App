import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8500',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace('/api/rest', '/rest'),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
              // Strip Domain and SameSite, set Path=/ so cookie is sent on all requests
              proxyRes.headers['set-cookie'] = cookies.map(cookie =>
                cookie
                  .replace(/;\s*Domain=[^;]*/i, '')
                  .replace(/;\s*SameSite=[^;]*/i, '')
                  .replace(/;\s*Secure/i, '')   // remove Secure since we're on HTTP locally
              );
            }
          });
        }
      },
    },
  },
});
