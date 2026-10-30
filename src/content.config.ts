import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { CATEGORY_NAMES } from './lib/site';

/**
 * 文章内容集合。
 * 所有文章在构建时被读取并生成静态 HTML；浏览器端不会请求内容 API。
 */
const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(10).max(220),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug 只能包含小写字母、数字与连字符'),
    date: z.coerce.date(),
    author: z.string().min(1),
    tags: z.array(z.string().min(1)).min(1).max(6),
    category: z.enum(CATEGORY_NAMES),
    readingTime: z.number().int().positive().max(120),
    cover: z.string().startsWith('/'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
