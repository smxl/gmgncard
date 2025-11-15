import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  const isServe = command === 'serve';
  const explicitBase = process.env.VITE_ADMIN_BASE;
  const base = explicitBase ?? (isServe ? '/' : '/admin');

  return {
    plugins: [react()],
    base,
    server: {
      port: 4173
    }
  };
});
