import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api/content': {
        target: 'https://peer.decentraland.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/content/, '/content'),
      },
    },
  },
});
