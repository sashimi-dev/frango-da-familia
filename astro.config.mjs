// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Produz saída 100% estática (sem runtime de servidor) — ideal para Cloudflare Pages.
  output: 'static',

  // Troque pelo domínio final quando tiver um (usado para sitemap/URLs absolutas).
  site: 'https://frango-da-familia.pages.dev',

  build: {
    // Gera /sobre/index.html em vez de /sobre.html — URLs mais limpas.
    format: 'directory',
  },
});
