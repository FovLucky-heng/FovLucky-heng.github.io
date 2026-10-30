// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// 部署时通过 SITE_URL 环境变量注入真实域名；本地保留可用的占位域名。
// 注意：SITE_URL 不是密钥，仅用于 canonical、OG、sitemap 与 RSS 的绝对链接。
const site = process.env.SITE_URL ?? 'https://hengyuan-research.example.com';

export default defineConfig({
  site,
  output: 'static',
  // 采用目录式静态路由：/research/、/research/example/。
  // 开启 always 让 canonical 与实际静态文件路径保持一致。
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
