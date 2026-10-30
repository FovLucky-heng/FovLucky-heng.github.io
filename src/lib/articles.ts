import { getCollection, type CollectionEntry } from 'astro:content';
import type { CategoryName } from './site';
import { formatDate, formatDateShort } from './format';

export type ArticleEntry = CollectionEntry<'articles'>;

/** 传给 React 岛的轻量文章数据，不包含 Markdown 正文。 */
export interface ResearchItem {
  slug: string;
  title: string;
  description: string;
  date: string;
  dateLabel: string;
  dateShort: string;
  author: string;
  tags: string[];
  category: CategoryName;
  readingTime: number;
  cover: string;
}

export async function getPublishedArticles(): Promise<ArticleEntry[]> {
  const articles = await getCollection('articles', ({ data }) => data.draft !== true);
  return articles.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function toResearchItem(article: ArticleEntry): ResearchItem {
  return {
    slug: article.data.slug,
    title: article.data.title,
    description: article.data.description,
    date: article.data.date.toISOString(),
    dateLabel: formatDate(article.data.date),
    dateShort: formatDateShort(article.data.date),
    author: article.data.author,
    tags: article.data.tags,
    category: article.data.category,
    readingTime: article.data.readingTime,
    cover: article.data.cover,
  };
}

export function articleHref(slug: string): string {
  return `/research/${slug}/`;
}

/** 先按主题命中，再按共享标签数量排序；不足三篇时用最新文章补齐。 */
export function getRelatedArticles(
  current: ArticleEntry,
  all: ArticleEntry[],
  limit = 3,
): ArticleEntry[] {
  const scored = all
    .filter((article) => article.data.slug !== current.data.slug)
    .map((article) => {
      const sharedTags = article.data.tags.filter((tag) => current.data.tags.includes(tag)).length;
      const sameCategory = article.data.category === current.data.category ? 3 : 0;
      return { article, score: sharedTags + sameCategory };
    })
    .sort(
      (a, b) =>
        b.score - a.score || b.article.data.date.valueOf() - a.article.data.date.valueOf(),
    );

  return scored.slice(0, limit).map((item) => item.article);
}
