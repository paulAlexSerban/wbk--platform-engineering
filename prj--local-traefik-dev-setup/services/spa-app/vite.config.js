import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        allowedHosts: ['local.app.traefik-poc.local'],
        hmr: {
            host: process.env.VITE_HMR_HOST || 'localhost',
            clientPort: Number(process.env.VITE_HMR_CLIENT_PORT || 5173),
            protocol: process.env.VITE_HMR_PROTOCOL || 'ws',
        },
    },
});
