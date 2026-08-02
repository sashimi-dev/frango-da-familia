// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Saída 100% estática (sem runtime de servidor) — ideal para Cloudflare Pages.
  output: 'static',

  // IMPORTANTE p/ SEO: troque pelo domínio final quando tiver um.
  // Usado para gerar URLs absolutas no canonical e Open Graph.
  site: 'https://frango-da-familia.pages.dev',

  build: {
    format: 'directory',
  },
});
