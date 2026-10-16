import { defineConfig } from 'vite';

// Social previews need absolute image URLs. Netlify sets URL at build time;
// set VITE_SITE_URL yourself to override (e.g. a custom domain).
process.env.VITE_SITE_URL ??= process.env.URL ?? '';

export default defineConfig({});
