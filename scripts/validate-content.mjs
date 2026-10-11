import { access } from 'node:fs/promises';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import { readContent } from './content-files.mjs';

const { posts, series } = await readContent();
for (const post of posts) {
  if (/!?\[\[[^\]]+\]\]/.test(post.body)) throw new Error(`${post.data.slug} 含有未转换的双链语法`);
  const tree = unified().use(remarkParse).parse(post.body);
  const references = new Map();
  visit(tree, 'definition', (node) => references.set(node.identifier, node.url));
  const images = [];
  visit(tree, (node) => {
    if (node.type === 'image') images.push(node.url);
    if (node.type === 'imageReference') {
      const target = references.get(node.identifier);
      if (!target) throw new Error(`${post.data.slug} 缺失图片引用定义`);
      images.push(target);
    }
  });
  for (const image of images) {
    if (/^(https?:|data:)/.test(image)) continue;
    if (image.startsWith('/')) throw new Error(`${post.data.slug} 的图片请使用文章同目录相对路径：${image}`);
    await access(path.resolve(path.dirname(post.file), decodeURIComponent(image.split(/[?#]/)[0])));
  }
}
console.log(`内容校验通过：${posts.length} 篇文章，${series.length} 个系列，${posts.filter((post) => post.data.draft).length} 篇草稿。`);
