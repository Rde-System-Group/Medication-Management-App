import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: process.cwd(), 
  resolve: {
    alias: {
      // This tells the bundler exactly where to find react
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      '@mui/system': path.resolve(__dirname, 'node_modules/@mui/system'),
      '@mui/material': path.resolve(__dirname, 'node_modules/@mui/material'),
      '@mui/system/Unstable_Grid': path.resolve(__dirname, 'node_modules/@mui/system/Grid'),
      '@mui/system/RtlProvider': path.resolve(__dirname, 'node_modules/@mui/system/RtlProvider/index.js'),
      '@mui/system/createStyled': path.resolve(__dirname, 'node_modules/@mui/system/createStyled/index.js'),
    },
  },
  optimizeDeps: {
    exclude: [
      '@mui/x-charts', 
      '@mui/joy'
    ],
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled'
    ]
  },
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