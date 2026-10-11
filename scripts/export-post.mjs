import { mkdir, copyFile, writeFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { loadEnv } from 'vite';
import { projectRoot, readContent } from './content-files.mjs';

const [slug, ...options] = process.argv.slice(2);
if (!slug) throw new Error('用法：npm run export:post -- article-slug [--allow-draft]');
if (options.some((option) => option !== '--allow-draft')) throw new Error('未知选项');
const { posts } = await readContent();
const post = posts.find((entry) => entry.data.slug === slug);
if (!post) throw new Error(`未找到文章：${slug}`);
if (post.data.draft && !options.includes('--allow-draft')) throw new Error('拒绝导出草稿；确需预览时添加 --allow-draft');
const environment = { ...loadEnv('production', projectRoot, ''), ...process.env };
const origin = new URL(environment.SITE_URL || 'http://localhost:4321');
const base = `/${(environment.BASE_PATH || '').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
const canonical = new URL(`${base}/posts/${slug}/`, origin).href;
const parser = unified().use(remarkParse).use(remarkGfm);
const tree = parser.parse(post.body);
const output = path.join(projectRoot, 'exports', slug);
const directory = await realpath(path.dirname(post.file));
const images = [];
const warnings = [];
const referencedImages = new Set();
visit(tree, 'imageReference', (node) => referencedImages.add(node.identifier));
const operations = [];
visit(tree, (node) => {
  const isImage = node.type === 'image' || (node.type === 'definition' && referencedImages.has(node.identifier));
  if (isImage) {
    operations.push(async () => {
      if (/^https?:\/\//.test(node.url)) {
        images.push({ original: node.url, exported: node.url, remote: true });
        warnings.push('外部图片仍需下载并转存到目标平台。');
        return;
      }
      if (/^[a-z]+:/i.test(node.url) || node.url.startsWith('/')) throw new Error(`不支持的图片路径：${node.url}`);
      const original = node.url;
      const source = await realpath(path.resolve(directory, decodeURIComponent(original.split(/[?#]/)[0])));
      if (!source.startsWith(`${directory}${path.sep}`)) throw new Error(`图片超出文章目录：${original}`);
      const name = `${createHash('sha256').update(original).digest('hex').slice(0, 8)}-${path.basename(source)}`;
      const target = `images/${name}`;
      await copyFile(source, path.join(output, target));
      node.url = `./${target}`;
      images.push({ original, exported: node.url, remote: false });
      if (source.endsWith('.svg')) warnings.push('SVG 图片在部分平台需转为 PNG 后上传。');
    });
  } else if (node.type === 'link' || node.type === 'definition') {
    if (/^https?:\/\//.test(node.url) || /^(mailto:|tel:)/.test(node.url)) return;
    if (/^[a-z]+:/i.test(node.url)) throw new Error(`不支持的链接协议：${node.url}`);
    if (/\.md(?:#.*)?$/.test(node.url)) throw new Error(`请先把 Markdown 文件链接改成站点路径：${node.url}`);
    node.url = node.url.startsWith('/') ? new URL(`${base}${node.url}`, origin).href : new URL(node.url, canonical).href;
  }
});
await mkdir(path.join(output, 'images'), { recursive: true });
for (const operation of operations) await operation();
const markdown = unified().use(remarkStringify).use(remarkGfm).stringify(tree);
const htmlProcessor = unified().use(remarkRehype).use(rehypeStringify);
const html = htmlProcessor.stringify(await htmlProcessor.run(tree));
let sourceCommit = null;
try {
  const repositoryRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  if (path.resolve(repositoryRoot) === path.resolve(projectRoot)) sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
} catch {}
if (origin.hostname === 'localhost' || origin.hostname === '127.0.0.1') warnings.push('尚未配置正式 SITE_URL，链接仍指向本地，正式分发前请重新导出。');
const manifest = {
  postSlug: slug,
  title: post.data.title,
  description: post.data.description,
  series: post.data.series || null,
  order: post.data.order || null,
  draft: post.data.draft,
  canonical,
  exportedAt: new Date().toISOString(),
  sourceCommit,
  sourceHash: createHash('sha256').update(post.source).digest('hex'),
  images,
  warnings: [...new Set(warnings)],
  nextStep: '上传图片，替换图片链接，检查排版；本工具不向平台发送任何内容。',
};
await Promise.all([
  writeFile(path.join(output, 'article.md'), markdown),
  writeFile(path.join(output, 'article.html'), html),
  writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n'),
]);
console.log(`已导出：exports/${slug}/（${images.length} 张图片）`);
for (const warning of manifest.warnings) console.log(`提示：${warning}`);
