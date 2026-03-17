import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true, // Falla si 5173 está ocupado (evita arrancar en otro puerto y romper CORS)
  },
});
