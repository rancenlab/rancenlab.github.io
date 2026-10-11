import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { postSchema, seriesSchema } from './lib/content-schema.mjs';

const posts = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/posts' }),
  schema: postSchema,
});
const series = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/series' }),
  schema: seriesSchema,
});
export const collections = { posts, series };
