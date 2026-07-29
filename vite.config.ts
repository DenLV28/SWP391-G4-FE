import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
<<<<<<< HEAD
      watch: process.env.DISABLE_HMR === 'true' ? null : {},      // Allow Ngrok & local hosts for public testing
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '*.ngrok-free.dev',
        '*.ngrok.io',
        'easel-underpay-antics.ngrok-free.dev', // Current Ngrok domain
      ],    },
=======
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
>>>>>>> 344a747c9562c30e6e5b6d29f6b2b91e3e69baf3
  };
});
