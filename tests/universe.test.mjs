import test from 'node:test';
import assert from 'node:assert/strict';
import { slicePage, filterStars, INDEPENDENT_PREVIEW_SIZE } from '../src/lib/universe.mjs';

test('大星系按六篇分页，所有文章均可访问且页码有边界', () => {
  const stars = Array.from({ length: 103 }, (_, index) => ({ title: `文章 ${index}`, tags: ['技术'] }));
  const pages = Array.from({ length: slicePage(stars).totalPages }, (_, index) => slicePage(stars, index));
  assert.ok(pages.every((page) => page.items.length <= 6));
  assert.deepEqual(pages.flatMap((page) => page.items), stars);
  assert.equal(slicePage(stars, -1).page, 0);
  assert.equal(slicePage(stars, 100).page, 17);
  assert.equal(slicePage([], 10).totalPages, 1);
  assert.equal(INDEPENDENT_PREVIEW_SIZE, 2);
});

test('星系筛选支持中文标题、标签与大小写无关的多关键词', () => {
  const stars = [{ title: 'Markdown 图片管理', tags: ['工程实践'] }, { title: '设计思考', tags: ['知识管理'] }];
  assert.deepEqual(filterStars(stars, 'MARKDOWN 工程'), [stars[0]]);
  assert.deepEqual(filterStars(stars, '知识管理'), [stars[1]]);
  assert.deepEqual(filterStars(stars, '  '), stars);
  assert.deepEqual(filterStars(stars, '不存在'), []);
});
