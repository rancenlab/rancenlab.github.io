import { parse, stringify } from 'yaml';

export function parseFrontmatter(source) {
  const normalized = source.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) throw new Error('Markdown 文件必须以 YAML 元数据块开头');
  const data = parse(match[1], { maxAliasCount: 50 });
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('元数据必须是 YAML 对象');
  return { data, content: normalized.slice(match[0].length) };
}

export function stringifyFrontmatter(content, data) {
  return `---\n${stringify(data).trimEnd()}\n---\n${content.startsWith('\n') ? '' : '\n'}${content}`;
}
