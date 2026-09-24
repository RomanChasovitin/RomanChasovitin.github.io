// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Served by GitHub Pages from the RomanChasovitin.github.io repository, at the root of the domain.
  site: 'https://romanchasovitin.github.io',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});