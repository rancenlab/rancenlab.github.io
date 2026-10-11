import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const environment = { ...loadEnv(process.env.NODE_ENV || 'production', process.cwd(), ''), ...process.env };

export default defineConfig({
  site: environment.SITE_URL || 'http://localhost:4321',
  base: environment.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.endsWith('/404/') })],
  markdown: { shikiConfig: { theme: 'github-dark' } },
});
