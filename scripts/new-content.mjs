import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter, stringifyFrontmatter } from './frontmatter.mjs';
import { projectRoot, readContent } from './content-files.mjs';
import { slugSchema } from '../src/lib/content-schema.mjs';

const [kind, slug, title] = process.argv.slice(2);
if (!['post', 'series'].includes(kind) || !slug || !title) {
  console.error('用法：npm run new:post -- my-slug "文章标题" 或 npm run new:series -- my-series "系列标题"');
  process.exit(1);
}
slugSchema.parse(slug);
const content = await readContent();
const entries = kind === 'post' ? content.posts : content.series;
if (entries.some((entry) => entry.data.slug === slug)) throw new Error(`标识已存在：${slug}`);
const template = parseFrontmatter(await readFile(path.join(projectRoot, 'templates', `${kind}.md`), 'utf8'));
template.data.slug = slug;
template.data.title = title;
if (kind === 'post') template.data.publishedAt = new Date().toISOString().slice(0, 10);
const directory = path.join(projectRoot, 'src/content', kind === 'post' ? `posts/${slug}` : 'series');
await mkdir(directory, { recursive: true });
const file = path.join(directory, kind === 'post' ? 'index.md' : `${slug}.md`);
await writeFile(file, stringifyFrontmatter(template.content, template.data), { flag: 'wx' });
if (kind === 'post') await mkdir(path.join(directory, 'images'), { recursive: true });
console.log(`已创建 ${path.relative(projectRoot, file)}${kind === 'post' ? '（默认草稿）' : ''}`);
