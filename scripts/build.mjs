/* =========================================================
   构建：src/ → dist/
   零依赖（只用 node 内置模块），产物是纯静态站点
   ========================================================= */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  copyFileSync,
  readdirSync,
  existsSync
} from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import site from "./site.config.mjs";
import {
  esc,
  render,
  channelCard,
  articleCard,
  toolCard,
  dailyItem,
  segmented,
  articleBody,
  articleJsonLd
} from "./lib/render.mjs";

/* 相对脚本位置解析，Windows / macOS / Linux CI 都能跑 */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");

const readSrc = (rel) => readFileSync(join(SRC, rel), "utf8").replace(/\r\n/g, "\n");

function write(rel, content) {
  const file = join(DIST, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, String(content).replace(/\r\n/g, "\n"), "utf8");
  return file;
}

/* ---------------------------------------------------------
   1. 读取内容数据（在 vm 里执行，拿到同一份真实数据）
   --------------------------------------------------------- */
function loadData() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  const run = (rel) =>
    vm.runInContext(readSrc(rel), sandbox, { filename: rel });

  run("data/site.js");
  run("data/channels.js");
  const dir = join(SRC, "data", "articles");
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".js"))) {
    run(`data/articles/${f}`);
  }

  const { L5_SITE, L5_CHANNELS, L5_ARTICLES } = sandbox.window;
  const channels = L5_CHANNELS.map((c) => ({
    ...c,
    articles: L5_ARTICLES[c.id] || []
  }));

  return {
    brand: L5_SITE.BRAND,
    daily: L5_SITE.DAILY,
    moods: L5_SITE.MOODS,
    channels,
    allArticles: channels.flatMap((c) =>
      c.articles.map((a) => ({ ...a, channel: c }))
    )
  };
}

const data = loadData();
const channelById = Object.fromEntries(data.channels.map((c) => [c.id, c]));

/* ---------------------------------------------------------
   2. 样式：分层的多个文件 → 单个 style.css
   --------------------------------------------------------- */
const LAYERS = ["tokens", "base", "layout", "components", "pages", "utilities"];

function buildCss() {
  const parts = LAYERS.map((layer) => {
    const css = readSrc(`styles/${layer}.css`).trim();
    return `@layer ${layer} {\n${css}\n}`;
  });
  return `/* 由 src/styles/*.css 构建生成，请勿直接修改 */\n@layer ${LAYERS.join(
    ", "
  )};\n\n${parts.join("\n\n")}\n`;
}

/* ---------------------------------------------------------
   3. 脚本：按依赖顺序拼接成少量 bundle
   --------------------------------------------------------- */
const BUNDLES = {
  "core.js": [
    "core/namespace.js",
    "core/data.js",
    "core/store.js",
    "core/dates.js",
    "core/dom.js",
    "core/catalog.js",
    "core/favorites.js",
    "core/checkin.js",
    "core/moods.js",
    "core/reveal.js",
    "ui/nav.js",
    "ui/cards.js",
    "ui/daily.js"
  ],
  "home.js": ["pages/home.js"],
  "channel.js": ["pages/channel.js"],
  "article.js": ["pages/article.js"],
  "checkin.js": ["pages/checkin.js"],
  "me.js": ["pages/me.js"],
  "tools.js": [
    "tools/shared.js",
    "tools/index.js",
    "tools/eat.js",
    "tools/wear.js",
    "tools/mind.js",
    "tools/move.js",
    "tools/money.js"
  ],
  "main.js": ["main.js"]
};

function buildScripts() {
  const out = {};
  for (const [bundle, files] of Object.entries(BUNDLES)) {
    const body = files
      .map((f) => `/* ---- ${f} ---- */\n${readSrc(`scripts/${f}`).trim()}`)
      .join("\n\n");
    out[bundle] = `/* 由 src/scripts 构建生成，请勿直接修改 */\n${body}\n`;
  }

  /* 运行时数据：只保留栏目元信息和文章摘要，正文已在 HTML 里 */
  const runtime = {
    BRAND: data.brand,
    DAILY: data.daily,
    MOODS: data.moods,
    CHANNELS: data.channels.map((c) => ({
      ...c,
      articles: c.articles.map(({ blocks, ...meta }) => meta)
    }))
  };
  out["data.js"] = `/* 构建生成：页面运行时数据 */\nwindow.APP_DATA = ${JSON.stringify(
    runtime,
    null,
    2
  )};\n`;
  return out;
}

/* ---------------------------------------------------------
   4. 页面
   --------------------------------------------------------- */
const partial = (name) => readSrc(`partials/${name}`);
const template = (name) => readSrc(`pages/${name}`);

const PAGES = []; // 供 sitemap / 测试使用

function shell({ url, out, page, bodyAttrs = "", main, scripts = [], ...meta }) {
  const canonical = `${site.url.replace(/\/$/, "")}${url}`;

  const head = render(
    partial("head.html"),
    {
      title: meta.title,
      description: meta.description,
      canonical,
      robots: meta.robots || "index,follow",
      ogType: meta.ogType || "website",
      siteName: site.name,
      extraHead: meta.extraHead || ""
    },
    `head:${out}`
  );

  const scriptTags = ["data.js", "core.js", ...scripts, "main.js"]
    .map((f) => `<script src="/assets/js/${f}" defer></script>`)
    .join("\n");

  const html = render(
    partial("shell.html"),
    {
      head,
      page,
      bodyAttrs,
      nav: partial("nav.html").trim(),
      main,
      footer: partial("footer.html").trim(),
      tabbar: partial("tabbar.html").trim(),
      scripts: scriptTags
    },
    `shell:${out}`
  );

  /* 站内链接一律转成"相对当前页面"的路径：
     这样无论部署在域名根、GitHub Pages 子路径，还是本地任意目录都能用。
     404 例外——Pages 会用它响应任意深度的地址，只能用站点根路径。 */
  const depth = out.split("/").length - 1;
  const rel = "../".repeat(depth);
  const internal = /((?:href|src)=")\/(?!\/)/g;
  const finalHtml =
    out === "404.html"
      ? html.replace(internal, `$1${site.base || "/"}`)
      : html.replace(internal, `$1${rel}`);

  write(out, finalHtml);
  PAGES.push({ url, out, title: meta.title });
  return finalHtml;
}

/* ---------- 首页 ---------- */
function buildHome() {
  const featured = ["recipe", "wardrobe", "breath", "challenge", "budget"];
  const toolsHTML = featured
    .map((id) => {
      const ch = data.channels.find((c) => c.tools.some((t) => t.id === id));
      const tool = ch.tools.find((t) => t.id === id);
      return toolCard(ch, tool);
    })
    .join("\n        ");

  const latestTabs = segmented(
    [{ id: "all", name: "全部" }, ...data.channels.map((c) => ({ id: c.id, name: c.name }))]
  );

  const latestCards = data.allArticles
    .map((a) => articleCard(a, { channel: a.channel, attrs: ` data-channel="${a.channel.id}"` }))
    .join("\n        ");

  const main = render(
    template("home.html"),
    {
      channels: data.channels.map((c, i) => channelCard(c, i * 40)).join("\n        "),
      dailyItems: data.daily
        .map((d) => dailyItem(d, channelById[d.channel]))
        .join("\n        "),
      tools: toolsHTML,
      latestTabs,
      latestCards,
      totalArticles: String(data.allArticles.length)
    },
    "home"
  );

  shell({
    url: "/",
    out: "index.html",
    page: "home",
    main,
    scripts: ["home.js"],
    title: `${site.name} · 把生活调回喜欢的频道`,
    description:
      "生活五号线：健康吃、随心穿、不蕉绿、开心练、智慧投。每天五个小动作，慢慢把生活握回自己手里。"
  });
}

/* ---------- 五个栏目页 ---------- */
function buildChannels() {
  for (const c of data.channels) {
    const main = render(
      template("channel.html"),
      {
        color: c.color,
        deep: c.deep,
        line: c.line,
        name: c.name,
        claim: c.claim,
        desc: c.desc,
        action: c.action,
        actionBtn: c.actionBtn,
        firstTool: c.tools[0].id,
        tagLine: c.tags.join(" · "),
        notice: c.notice,
        tools: c.tools
          .map((t) => toolCard(c, t, { link: true }))
          .join("\n        "),
        tags: segmented(
          [{ id: "all", name: "全部" }, ...c.tags.map((t) => ({ id: t, name: t }))],
          { attr: "data-tag" }
        ),
        articles: c.articles
          .map((a) =>
            articleCard({ ...a, channel: c }, { channel: c, attrs: ` data-tag="${esc(a.tag)}"` })
          )
          .join("\n        ")
      },
      `channel:${c.id}`
    );

    shell({
      url: `/${c.id}.html`,
      out: `${c.id}.html`,
      page: "channel",
      bodyAttrs: ` data-channel="${c.id}" style="--accent:${c.deep}"`,
      main,
      scripts: ["channel.js"],
      title: `${c.name} · ${site.name}`,
      description: `${c.claim}${c.desc}`
    });
  }
}

/* ---------- 20 个文章页 ---------- */
function buildArticles() {
  for (const a of data.allArticles) {
    const c = a.channel;
    const url = `/article/${a.slug}.html`;

    const related = c.articles
      .filter((x) => x.slug !== a.slug)
      .slice(0, 3)
      .map((x) => articleCard({ ...x, channel: c }, { channel: c }))
      .join("\n        ");

    const main = render(
      template("article.html"),
      {
        title: a.title,
        tag: a.tag,
        channelId: c.id,
        channelName: c.name,
        deep: c.deep,
        minutes: a.minutes,
        slug: a.slug,
        body: articleBody(a.blocks),
        notice: c.notice,
        related
      },
      `article:${a.slug}`
    );

    shell({
      url,
      out: `article/${a.slug}.html`,
      page: "article",
      bodyAttrs: ` style="--accent:${c.deep}"`,
      main,
      scripts: ["article.js"],
      title: `${a.title} · ${site.name}`,
      description: a.excerpt,
      ogType: "article",
      extraHead: articleJsonLd({
        article: a,
        channel: c,
        url: `${site.url.replace(/\/$/, "")}${url}`,
        site: { name: site.name, url: site.url }
      })
    });
  }
}

/* ---------- 工具库 ---------- */
function buildTools() {
  const groups = data.channels
    .map(
      (c) => `  <div class="mt-32">
    <div class="row" style="gap:10px;align-items:center;margin-bottom:14px">
      <span class="badge" style="--ch:${c.color}">${esc(c.icon)}</span>
      <h2 class="card__title" style="font-size:17px;color:${c.deep}">${esc(c.name)}</h2>
    </div>
    <div class="grid-3">
${c.tools.map((t) => toolCard(c, t, { link: false, showChannel: false })).join("\n      ")}
    </div>
  </div>`
    )
    .join("\n");

  const main = render(template("tools.html"), { toolGroups: groups }, "tools");

  shell({
    url: "/tools.html",
    out: "tools.html",
    page: "tools",
    main,
    scripts: ["tools.js"],
    title: `工具库 · ${site.name}`,
    description: "15 个本地运行的小工具：一周食谱、搭配生成、呼吸练习、7 天挑战、月度预算。"
  });
}

/* ---------- 打卡 / 我的 / 关于 / 404 ---------- */
function buildSimplePages() {
  shell({
    url: "/checkin.html",
    out: "checkin.html",
    page: "checkin",
    main: template("checkin.html").trim(),
    scripts: ["checkin.js"],
    title: `今日打卡 · ${site.name}`,
    description: "不用全做，挑一件也算今天没白过。"
  });

  shell({
    url: "/me.html",
    out: "me.html",
    page: "me",
    main: template("me.html").trim(),
    scripts: ["me.js"],
    title: `我的 · ${site.name}`,
    description: "我的收藏、打卡记录、心情天气，全部保存在本机。"
  });

  shell({
    url: "/about.html",
    out: "about.html",
    page: "about",
    main: template("about.html").trim(),
    title: `关于与声明 · ${site.name}`,
    description: "生活五号线的定位、内容原则，以及心理、理财、饮食、运动的免责声明。"
  });

  shell({
    url: "/404.html",
    out: "404.html",
    page: "notfound",
    main: template("404.html").trim(),
    title: `页面不存在 · ${site.name}`,
    description: "你访问的页面不存在。",
    robots: "noindex,follow"
  });
}

/* ---------------------------------------------------------
   5. 其它产物
   --------------------------------------------------------- */
function buildAssets() {
  write("assets/css/style.css", buildCss());

  const scripts = buildScripts();
  for (const [name, code] of Object.entries(scripts)) {
    write(`assets/js/${name}`, code);
  }

  copyFileSync(join(SRC, "assets/favicon.svg"), join(DIST, "assets/favicon.svg"));

  /* GitHub Pages 默认走 Jekyll，加这个空文件让它原样发布 */
  write(".nojekyll", "");
}

function buildSeo() {
  const urls = PAGES.filter((p) => p.out !== "404.html").map((p) => ({
    loc: `${site.url.replace(/\/$/, "")}${p.url}`,
    priority: p.url === "/" ? "1.0" : "0.7"
  }));

  write(
    "sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`
  );

  write(
    "robots.txt",
    `User-agent: *
Allow: /

Sitemap: ${site.url.replace(/\/$/, "")}/sitemap.xml
`
  );
}

/* ---------------------------------------------------------
   6. 执行
   --------------------------------------------------------- */
function build() {
  const started = Date.now();
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });

  buildHome();
  buildChannels();
  buildArticles();
  buildTools();
  buildSimplePages();
  buildAssets();
  buildSeo();

  const files = [];
  const walk = (dir, prefix = "") => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(dir, entry.name), `${prefix}${entry.name}/`);
      else files.push({
        path: `${prefix}${entry.name}`,
        size: readFileSync(join(dir, entry.name)).length
      });
    }
  };
  walk(DIST);

  const total = files.reduce((s, f) => s + f.size, 0);
  const html = files.filter((f) => f.path.endsWith(".html"));

  console.log(`\n构建完成  ${Date.now() - started}ms`);
  console.log(`  页面 ${html.length} 个 · 文件 ${files.length} 个 · 共 ${(total / 1024).toFixed(0)} KB`);

  const js = files.filter((f) => f.path.startsWith("assets/js/"));
  console.log(`  脚本 ${js.length} 个：${js.map((f) => `${basename(f.path)} ${(f.size / 1024).toFixed(1)}K`).join("  ")}`);
  console.log(`  样式 1 个：style.css ${(files.find((f) => f.path.endsWith("style.css")).size / 1024).toFixed(1)}K`);
  console.log(`  文章 ${data.allArticles.length} 篇已预渲染 → dist/article/\n`);
}

build();

export { data, PAGES };
