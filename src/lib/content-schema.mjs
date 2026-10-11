import { z } from 'zod';

export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '标识只能使用小写英文、数字和连字符');
export const postSchema = z.object({
  title: z.string().trim().min(1),
  slug: slugSchema,
  description: z.string().trim().min(1),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  series: slugSchema.optional(),
  order: z.number().int().positive().optional(),
  draft: z.boolean().default(true),
}).superRefine((post, context) => {
  if (Boolean(post.series) !== (post.order !== undefined)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'series 与 order 必须同时填写或同时省略' });
  }
  if (post.updatedAt && post.updatedAt < post.publishedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: '修订日期不能早于发布日期' });
  }
});
export const seriesSchema = z.object({
  title: z.string().trim().min(1),
  slug: slugSchema,
  description: z.string().trim().min(1),
  status: z.enum(['ongoing', 'completed', 'paused']).default('ongoing'),
});

export function validateRelations(posts, series) {
  const seriesSlugs = new Set();
  for (const item of series) {
    if (seriesSlugs.has(item.slug)) throw new Error(`系列标识重复：${item.slug}`);
    seriesSlugs.add(item.slug);
  }
  const postSlugs = new Set();
  const orders = new Set();
  for (const post of posts) {
    if (postSlugs.has(post.slug)) throw new Error(`文章标识重复：${post.slug}`);
    postSlugs.add(post.slug);
    if (post.series) {
      if (!seriesSlugs.has(post.series)) throw new Error(`文章 ${post.slug} 引用了不存在的系列：${post.series}`);
      const key = `${post.series}:${post.order}`;
      if (orders.has(key)) throw new Error(`系列章节顺序重复：${key}`);
      orders.add(key);
    }
  }
}
