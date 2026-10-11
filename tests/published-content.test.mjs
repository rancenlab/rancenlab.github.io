import test from 'node:test';
import assert from 'node:assert/strict';
import { readContent } from '../scripts/content-files.mjs';

const chapterSlugs = [
  'electricity-market-guide',
  'power-grid-basics',
  'electricity-market-economics',
  'china-electricity-reform',
  'electricity-marketization',
  'electricity-market-structure',
  'electricity-market-participants',
  'electricity-price-components',
];
const removedSlugs = ['start-with-markdown', 'organize-a-series', 'images-and-publishing', 'write-a-useful-note', 'draft-example', 'build-a-learning-blog'];

test('电力交易基础八篇顺序完整，示例内容和旧链接已移除', async () => {
  const { posts, series } = await readContent();
  assert.ok(series.some((item) => item.data.slug === 'electricity-trading' && item.data.title === '电力交易'));
  const chapters = posts.filter((post) => post.data.series === 'electricity-trading').sort((first, second) => first.data.order - second.data.order);
  assert.deepEqual(chapters.slice(0, 8).map((post) => post.data.slug), chapterSlugs);
  assert.deepEqual(chapters.slice(0, 8).map((post) => post.data.order), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.ok(chapters.slice(0, 8).every((post) => post.data.draft === false));
  for (const entry of [...posts, ...series]) {
    assert.ok(!removedSlugs.includes(entry.data.slug));
    for (const slug of removedSlugs) assert.ok(!entry.body.includes(slug), `${entry.data.slug} 引用了旧内容 ${slug}`);
    assert.doesNotMatch(entry.body, /\[\[|\[TOC\]|```mermaid|file:\/\/|\/Users\//);
  }
});
