import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, mkdir, symlink, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { projectRoot } from '../scripts/content-files.mjs';
import { parseFrontmatter } from '../scripts/frontmatter.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'fieldnotes-test-'));
  await cp(path.join(projectRoot, 'scripts'), path.join(root, 'scripts'), { recursive: true });
  await cp(path.join(projectRoot, 'templates'), path.join(root, 'templates'), { recursive: true });
  await mkdir(path.join(root, 'src/lib'), { recursive: true });
  await cp(path.join(projectRoot, 'src/lib/content-schema.mjs'), path.join(root, 'src/lib/content-schema.mjs'));
  await mkdir(path.join(root, 'src/content/posts'), { recursive: true });
  await mkdir(path.join(root, 'src/content/series'), { recursive: true });
  await symlink(path.join(projectRoot, 'node_modules'), path.join(root, 'node_modules'), 'dir');
  return root;
}

function run(root, script, args) {
  return spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, SITE_URL: 'https://blog.example.com', BASE_PATH: '/journal' },
  });
}

test('新建文章默认草稿，特殊标题可读，已有文件不可覆盖', async () => {
  const root = await fixture();
  try {
    const result = run(root, 'new-content.mjs', ['post', 'first-note', '第一篇："技术笔记"']);
    assert.equal(result.status, 0, result.stderr);
    const file = path.join(root, 'src/content/posts/first-note/index.md');
    const source = await readFile(file, 'utf8');
    const parsed = parseFrontmatter(source);
    assert.equal(parsed.data.title, '第一篇："技术笔记"');
    assert.equal(parsed.data.draft, true);
    assert.notEqual(run(root, 'new-content.mjs', ['post', 'first-note', '不应覆盖']).status, 0);
    assert.equal(await readFile(file, 'utf8'), source);
    assert.notEqual(run(root, 'new-content.mjs', ['post', '../escape', '非法路径']).status, 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('导出拒绝草稿，显式允许后复制图片并转换引用链接', async () => {
  const root = await fixture();
  try {
    assert.equal(run(root, 'new-content.mjs', ['post', 'export-note', '导出测试']).status, 0);
    const directory = path.join(root, 'src/content/posts/export-note');
    const source = '---\ntitle: 导出测试\nslug: export-note\ndescription: 测试\npublishedAt: 2026-10-09\ndraft: true\n---\n\n![图][diagram]\n\n[diagram]: ./images/sample.svg\n\n[下一篇](../next-note/)\n';
    await writeFile(path.join(directory, 'index.md'), source);
    await writeFile(path.join(directory, 'images/sample.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>');
    assert.notEqual(run(root, 'export-post.mjs', ['export-note']).status, 0);
    const exported = run(root, 'export-post.mjs', ['export-note', '--allow-draft']);
    assert.equal(exported.status, 0, exported.stderr);
    const output = path.join(root, 'exports/export-note');
    const manifest = JSON.parse(await readFile(path.join(output, 'manifest.json'), 'utf8'));
    const markdown = await readFile(path.join(output, 'article.md'), 'utf8');
    const html = await readFile(path.join(output, 'article.html'), 'utf8');
    assert.equal(manifest.images.length, 1);
    assert.equal(manifest.sourceHash.length, 64);
    assert.match(markdown, /https:\/\/blog.example.com\/journal\/posts\/next-note\//);
    assert.doesNotMatch(markdown, /publishedAt:/);
    assert.match(html, /<img/);
    assert.ok(await readFile(path.join(output, manifest.images[0].exported), 'utf8'));
  } finally { await rm(root, { recursive: true, force: true }); }
});
