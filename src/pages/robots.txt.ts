import type { APIRoute } from 'astro';

const FALLBACK_SITE = 'https://hengyuan-research.example.com';

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(process.env.SITE_URL ?? FALLBACK_SITE);
  const sitemap = new URL('/sitemap.xml', base).toString();

  return new Response(
    `User-agent: *
Allow: /
Disallow: /favorites/

Sitemap: ${sitemap}
`,
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
};
