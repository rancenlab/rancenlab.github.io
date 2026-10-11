import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot, readContent } from './content-files.mjs';

const output = path.join(projectRoot, 'dist');
const { posts } = await readContent();
const draftSlugs = posts.filter((post) => post.data.draft).map((post) => post.data.slug);
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}
const files = await walk(output);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const homepage = await readFile(path.join(output, 'index.html'), 'utf8');
const canonical = homepage.match(/rel="canonical" href="([^"]+)"/);
if (!canonical) throw new Error('缺少 canonical');
const siteUrl = new URL(canonical[1]);
const base = siteUrl.pathname.replace(/\/$/, '');
for (const file of htmlFiles) {
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = match[1];
    if (target.startsWith('#') || /^(mailto:|tel:|data:)/.test(target)) continue;
    const relativePage = path.relative(output, file).replace(/index\.html$/, '');
    const resolved = new URL(target, new URL(`${base}/${relativePage}`, siteUrl.origin));
    if (resolved.origin !== siteUrl.origin) continue;
    const pathname = decodeURIComponent(resolved.pathname);
    if (base && pathname !== base && !pathname.startsWith(`${base}/`)) throw new Error(`链接未包含 base：${target}`);
    const localPath = pathname.slice(base.length).replace(/^\//, '');
    const candidate = path.join(output, localPath.endsWith('/') || !localPath ? `${localPath}index.html` : localPath);
    try { await access(candidate); } catch { throw new Error(`失效链接：${path.relative(output, file)} → ${target}`); }
  }
}
for (const file of files.filter((entry) => /\.(html|xml|json)$/.test(entry))) {
  const text = await readFile(file, 'utf8');
  if (text.includes('DRAFT_SENTINEL_DO_NOT_PUBLISH') || text.includes('UNPUBLISHEDCANARYXQZ')) throw new Error(`草稿正文泄露：${file}`);
  for (const slug of draftSlugs) {
    if (text.includes(`/posts/${slug}/`)) throw new Error(`草稿链接泄露：${file}`);
  }
}
for (const slug of draftSlugs) {
  if (files.includes(path.join(output, 'posts', slug, 'index.html'))) throw new Error(`草稿页面被生成：${slug}`);
}
await access(path.join(output, 'pagefind/pagefind.js'));
await access(path.join(output, 'rss.xml'));
await access(path.join(output, 'sitemap-index.xml'));
console.log(`产物验收通过：${htmlFiles.length} 个页面，站内链接和资源有效，${draftSlugs.length} 篇草稿未发布。`);
