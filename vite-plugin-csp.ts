import { Plugin } from 'vite';

export default function viteCspPlugin(): Plugin {
  return {
    name: 'vite-plugin-csp',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          // Permitir unsafe-eval y unsafe-inline para desarrollo (dev mode)
          // En producción, uses una CSP más estricta
          res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https:;"
          );
          next();
        });
      };
    },
  };
}
