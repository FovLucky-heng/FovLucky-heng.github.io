import type { APIRoute } from 'astro';
import { getPublishedArticles } from '../lib/articles';
import { SITE } from '../lib/site';
import { escapeXml } from '../lib/xml';

const FALLBACK_SITE = 'https://hengyuan-research.example.com';

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL(process.env.SITE_URL ?? FALLBACK_SITE);
  const articles = await getPublishedArticles();
  const feedUrl = new URL('/rss.xml', base).toString();

  const items = articles
    .map((article) => {
      const articleUrl = new URL(`/research/${article.data.slug}/`, base).toString();
      const categories = article.data.tags
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join('\n');

      return `    <item>
      <title>${escapeXml(article.data.title)}</title>
      <link>${escapeXml(articleUrl)}</link>
      <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>
      <pubDate>${article.data.date.toUTCString()}</pubDate>
      <description>${escapeXml(article.data.description)}</description>
      <author>${escapeXml(SITE.demoEmail)} (${escapeXml(article.data.author)})</author>
${categories}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.name)}</title>
    <link>${escapeXml(base.toString())}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  });
};
