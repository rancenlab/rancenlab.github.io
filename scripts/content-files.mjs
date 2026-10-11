import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './frontmatter.mjs';
import { postSchema, seriesSchema, validateRelations } from '../src/lib/content-schema.mjs';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const location = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(location) : [location];
  }));
  return files.flat();
}

export async function readContent() {
  const postFiles = (await walk(path.join(projectRoot, 'src/content/posts'))).filter((file) => path.basename(file) === 'index.md');
  const seriesFiles = (await walk(path.join(projectRoot, 'src/content/series'))).filter((file) => file.endsWith('.md'));
  async function parse(file, schema) {
    const source = await readFile(file, 'utf8');
    const parsed = parseFrontmatter(source);
    const result = schema.safeParse(parsed.data);
    if (!result.success) throw new Error(`${path.relative(projectRoot, file)}\n${result.error.message}`);
    return { file, source, body: parsed.content, data: result.data };
  }
  const posts = await Promise.all(postFiles.map((file) => parse(file, postSchema)));
  const series = await Promise.all(seriesFiles.map((file) => parse(file, seriesSchema)));
  validateRelations(posts.map((post) => post.data), series.map((item) => item.data));
  return { posts, series };
}
