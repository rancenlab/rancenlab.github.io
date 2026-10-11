import { getCollection, type CollectionEntry } from 'astro:content';
import { validateRelations } from './content-schema.mjs';

export type Post = CollectionEntry<'posts'>;
export type Series = CollectionEntry<'series'>;

export async function getContent() {
  const [allPosts, allSeries] = await Promise.all([getCollection('posts'), getCollection('series')]);
  validateRelations(allPosts.map((post) => post.data), allSeries.map((series) => series.data));
  const posts = allPosts.filter((post) => import.meta.env.DEV || !post.data.draft)
    .sort((first, second) => second.data.publishedAt.getTime() - first.data.publishedAt.getTime() || first.data.slug.localeCompare(second.data.slug));
  const series = allSeries.filter((item) => posts.some((post) => post.data.series === item.data.slug));
  return { posts, series };
}

export function chapters(posts: Post[], slug: string) {
  return posts.filter((post) => post.data.series === slug).sort((first, second) => first.data.order! - second.data.order!);
}

export function href(path = '') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

export function postHref(post: Post) { return href(`posts/${post.data.slug}/`); }
export function seriesHref(series: Series) { return href(`series/${series.data.slug}/`); }
export function tagHref(tag: string) { return href(`tags/${encodeURIComponent(tag)}/`); }
export function dateLabel(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(date).replaceAll('/', '.');
}
export function readingTime(body = '') { return Math.max(1, Math.ceil(body.length / 450)); }
export const statusLabels = { ongoing: '连载中', completed: '已完结', paused: '暂停更新' };
