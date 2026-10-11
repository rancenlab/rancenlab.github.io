import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getContent, postHref } from '../lib/content';
import { siteConfig } from '../config';

export async function GET(context: APIContext) {
  const { posts } = await getContent();
  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: context.site!,
    items: posts.filter((post) => !post.data.draft).map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: postHref(post),
    })),
    customData: '<language>zh-CN</language>',
  });
}
