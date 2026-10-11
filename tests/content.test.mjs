import test from 'node:test';
import assert from 'node:assert/strict';
import { postSchema, seriesSchema, validateRelations } from '../src/lib/content-schema.mjs';

const validPost = { title: '示例', slug: 'example', description: '摘要', publishedAt: '2026-10-01' };
const validSeries = { title: '系列', slug: 'learning', description: '系列介绍' };

test('未指定发布状态的文章默认是草稿', () => {
  const post = postSchema.parse(validPost);
  assert.equal(post.draft, true);
  assert.ok(post.publishedAt instanceof Date);
});
test('系列与顺序必须成对，且顺序是正整数', () => {
  assert.equal(postSchema.safeParse({ ...validPost, series: 'learning' }).success, false);
  assert.equal(postSchema.safeParse({ ...validPost, order: 10 }).success, false);
  assert.equal(postSchema.safeParse({ ...validPost, series: 'learning', order: 0 }).success, false);
});
test('不允许空标题、非法路径与反向修订日期', () => {
  assert.equal(postSchema.safeParse({ ...validPost, title: ' ' }).success, false);
  assert.equal(postSchema.safeParse({ ...validPost, slug: '../escape' }).success, false);
  assert.equal(postSchema.safeParse({ ...validPost, updatedAt: '2020-01-01' }).success, false);
});
test('重复文章和不存在的系列会阻止构建', () => {
  assert.throws(() => validateRelations([validPost, validPost], []), /文章标识重复/);
  assert.throws(() => validateRelations([{ ...validPost, series: 'missing', order: 10 }], []), /不存在的系列/);
});
test('同一系列的重复排序和重复系列标识被拒绝', () => {
  assert.throws(() => validateRelations([], [validSeries, validSeries]), /系列标识重复/);
  assert.throws(() => validateRelations([
    { ...validPost, series: 'learning', order: 10 },
    { ...validPost, slug: 'second', series: 'learning', order: 10 },
  ], [validSeries]), /顺序重复/);
});
test('不同系列可复用排序值，系列状态有明确枚举', () => {
  assert.doesNotThrow(() => validateRelations([
    { ...validPost, series: 'learning', order: 10 },
    { ...validPost, slug: 'second', series: 'practice', order: 10 },
  ], [validSeries, { ...validSeries, slug: 'practice' }]));
  assert.equal(seriesSchema.safeParse({ ...validSeries, status: 'unknown' }).success, false);
});
