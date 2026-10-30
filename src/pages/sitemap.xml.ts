import type { APIRoute } from 'astro';
import { getPublishedArticles } from '../lib/articles';
import { escapeXml, toIsoDate } from '../lib/xml';

const FALLBACK_SITE = 'https://hengyuan-research.example.com';

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL(process.env.SITE_URL ?? FALLBACK_SITE);
  const articles = await getPublishedArticles();
  const today = toIsoDate(new Date());

  const pages = [
    { path: '/', changefreq: 'weekly', priority: '1.0', lastmod: today },
    { path: '/research/', changefreq: 'weekly', priority: '0.9', lastmod: today },
    { path: '/tools/', changefreq: 'monthly', priority: '0.8', lastmod: today },
    { path: '/about/', changefreq: 'monthly', priority: '0.6', lastmod: today },
    { path: '/subscribe/', changefreq: 'monthly', priority: '0.5', lastmod: today },
  ];

  const articleUrls = articles.map((article) => ({
    path: `/research/${article.data.slug}/`,
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: toIsoDate(article.data.date),
  }));

  const urlEntries = [...pages, ...articleUrls]
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(new URL(entry.path, base).toString())}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
