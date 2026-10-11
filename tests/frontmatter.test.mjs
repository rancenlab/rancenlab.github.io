import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, stringifyFrontmatter } from '../scripts/frontmatter.mjs';

test('解析带 BOM 和 Windows 换行的文章，不把正文分隔线作为元数据', () => {
  const parsed = parseFrontmatter('\uFEFF---\r\ntitle: "测试"\r\n---\r\n正文\r\n---\r\n后续');
  assert.equal(parsed.data.title, '测试');
  assert.equal(parsed.content, '正文\n---\n后续');
});
test('序列化包含冒号和引号的标题后可以还原', () => {
  const data = { title: '说明："开始"', draft: true, tags: ['中文', 'Markdown'] };
  assert.deepEqual(parseFrontmatter(stringifyFrontmatter('正文\n', data)).data, data);
});
test('拒绝缺失、重复键和数组元数据', () => {
  assert.throws(() => parseFrontmatter('普通正文'), /元数据/);
  assert.throws(() => parseFrontmatter('---\n- item\n---\n正文'), /对象/);
  assert.throws(() => parseFrontmatter('---\ntitle: one\ntitle: two\n---\n正文'));
});
