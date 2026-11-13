import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        about: resolve(root, 'about.html'),
        experience: resolve(root, 'experience.html'),
        services: resolve(root, 'services.html'),
        projects: resolve(root, 'projects.html'),
        contact: resolve(root, 'contact.html'),
        leanlight: resolve(root, 'projects/leanlight.html'),
      },
    },
  },
});
