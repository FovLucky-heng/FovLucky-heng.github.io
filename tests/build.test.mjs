/* =========================================================
   构建产物检查：文件齐全、无残留占位符、内部链接全部可达
   用法：node tests/build.test.mjs
   ========================================================= */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import site from "../scripts/site.config.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const SRC = join(ROOT, "src");

let pass = 0;
const failures = [];

function check(name, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`PASS  ${name}`);
  } else {
    failures.push(`${name}${detail ? "  → " + detail : ""}`);
    console.log(`FAIL  ${name}${detail ? "  → " + detail : ""}`);
  }
}

/* ---------- 1. 构建 ---------- */
const build = spawnSync(process.execPath, [join(ROOT, "scripts/build.mjs")], {
  encoding: "utf8"
});
check("构建成功退出", build.status === 0, (build.stderr || "").slice(0, 300));

if (!existsSync(DIST)) {
  console.error("dist 不存在，构建立即失败");
  process.exit(1);
}

/* ---------- 2. 收集产物 ---------- */
const files = [];
(function walk(dir, prefix = "") {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) walk(join(dir, entry.name), `${prefix}${entry.name}/`);
    else files.push(`${prefix}${entry.name}`);
  }
})(DIST);

const htmlFiles = files.filter((f) => f.endsWith(".html"));
const pageOf = (f) => readFileSync(join(DIST, f), "utf8");

/* ---------- 3. 页面齐全 ---------- */
const basePages = ["index.html", "tools.html", "checkin.html", "me.html", "about.html", "404.html"];
const channels = ["eat", "wear", "mind", "move", "money"];

check("6 个基础页面存在", basePages.every((p) => htmlFiles.includes(p)));

const missingChannels = channels.filter((c) => !htmlFiles.includes(`${c}.html`));
check("5 个栏目页存在", missingChannels.length === 0, missingChannels.join(","));

const articlePages = htmlFiles.filter((f) => f.startsWith("article/"));
check("预渲染文章页 40 篇", articlePages.length === 40, `实际 ${articlePages.length}`);

/* ---------- 4. 无残留占位符 ---------- */
const leftover = htmlFiles.filter((f) => /\{\{\w+\}\}/.test(pageOf(f)));
check("没有未解析的模板占位符", leftover.length === 0, leftover.join(","));

/* ---------- 5. 每页必备的 head ---------- */
function headOf(html) {
  const m = html.match(/<head>([\s\S]*?)<\/head>/);
  return m ? m[1] : "";
}
const badHead = htmlFiles.filter((f) => {
  const head = headOf(pageOf(f));
  return !/<title>[^<]+<\/title>/.test(head) ||
    !/name="description" content="[^"]+"/.test(head) ||
    !/rel="canonical" href="https?:\/\//.test(head) ||
    !/name="viewport"/.test(head);
});
check("每页都有 title / description / canonical / viewport", badHead.length === 0, badHead.slice(0, 5).join(","));

const noindex = pageOf("404.html");
check("404 标记 noindex", /name="robots" content="noindex/.test(noindex));

const dupTitles = (() => {
  const seen = new Map();
  for (const f of htmlFiles) {
    const t = (pageOf(f).match(/<title>([^<]+)<\/title>/) || [])[1];
    if (seen.has(t)) return `${seen.get(t)} 与 ${f} 标题相同`;
    seen.set(t, f);
  }
  return null;
})();
check("页面标题不重复", dupTitles === null, dupTitles || "");

/* ---------- 6. 内部链接全部可达 ---------- */
const linkProblems = [];
for (const file of htmlFiles) {
  const html = pageOf(file);
  const attrs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const raw of attrs) {
    if (/^(https?:|mailto:|tel:|data:|#)/.test(raw)) continue;
    const target = raw.split("#")[0].split("?")[0];
    if (!target) continue;

    /* 404 页用站点根路径（含部署前缀），先剥掉前缀再当本地路径解析 */
    const normalized =
      target.startsWith(site.base) && site.base !== "/"
        ? "/" + target.slice(site.base.length)
        : target;

    const resolved = normalized.startsWith("/")
      ? join(DIST, normalized.slice(1))
      : resolve(join(DIST, dirname(file)), normalized);

    const candidates = [resolved, join(resolved, "index.html")];
    if (!candidates.some((c) => existsSync(c) && !c.endsWith("/"))) {
      linkProblems.push(`${file} → ${raw}`);
    }
  }
}
check("内部链接 / 资源全部存在", linkProblems.length === 0, linkProblems.slice(0, 5).join(" | "));

/* 站内链接必须是相对路径，否则部署到 GitHub Pages 子路径会 404（404 页除外） */
const absoluteLinks = htmlFiles
  .filter((f) => f !== "404.html")
  .map((f) => [f, (pageOf(f).match(/(?:href|src)="\/[^"]*"/g) || []).length])
  .filter(([, n]) => n > 0);
check(
  "站内链接是相对路径（可在任意子路径部署）",
  absoluteLinks.length === 0,
  absoluteLinks.slice(0, 3).map(([f, n]) => `${f}:${n}`).join(" ")
);

const notFound = pageOf("404.html");
check(
  "404 用站点根路径（任意深度可访问）",
  notFound.includes(`href="${site.base}assets/css/style.css"`)
);

/* ---------- 7. 资源产物 ---------- */
const bundles = ["data.js", "core.js", "main.js", "home.js", "channel.js", "article.js", "tools.js", "checkin.js", "me.js"];
const missingBundles = bundles.filter((b) => !files.includes(`assets/js/${b}`));
check("9 个脚本 bundle 存在", missingBundles.length === 0, missingBundles.join(","));

const emptyBundles = bundles.filter(
  (b) => readFileSync(join(DIST, "assets/js", b), "utf8").trim().length < 50
);
check("脚本 bundle 非空", emptyBundles.length === 0, emptyBundles.join(","));

const css = readFileSync(join(DIST, "assets/css/style.css"), "utf8");
check(
  "CSS 分层声明完整",
  /@layer tokens, base, layout, components, pages, utilities;/.test(css) &&
    ["tokens", "base", "layout", "components", "pages", "utilities"].every((l) =>
      css.includes(`@layer ${l} {`)
    )
);
check("CSS 含 [hidden] 兜底", /\[hidden\]\s*\{\s*display:\s*none !important/.test(css));
check("存在 favicon", files.includes("assets/favicon.svg"));

/* ---------- 8. SEO 产物 ---------- */
const sitemap = readFileSync(join(DIST, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check("sitemap 收录 77 个 URL", sitemapUrls.length === 77, `实际 ${sitemapUrls.length}`);
check("sitemap 不含 404", !sitemapUrls.some((u) => u.endsWith("/404.html")));

const robots = readFileSync(join(DIST, "robots.txt"), "utf8");
check("robots.txt 指向 sitemap", /Sitemap: https?:\/\/.+\/sitemap\.xml/.test(robots));

const ldArticles = articlePages.filter((f) =>
  /application\/ld\+json/.test(pageOf(f))
);
check("文章页都有 JSON-LD", ldArticles.length === articlePages.length, `${ldArticles.length}/${articlePages.length}`);

/* ---------- 9. 页面壳只写了一份 ---------- */
const navCount = htmlFiles.filter((f) => pageOf(f).includes('class="nav__inner"')).length;
check("导航在每页只出现一次", navCount === htmlFiles.length, `${navCount}/${htmlFiles.length}`);

const srcChrome = ["src/partials/nav.html", "src/partials/footer.html", "src/partials/tabbar.html"];
check("共用外壳只保留在 partials 里", srcChrome.every((p) => existsSync(join(ROOT, p))));

/* ---------- 10. 模块依赖自洽（防"用了没解构"这类运行时崩溃） ---------- */
const API = [
  "BRAND", "CHANNELS", "DAILY", "MOODS", "KEY", "store",
  "pad", "ymd", "ymdPad", "WEEK_CN", "lastNDays",
  "$", "$$", "esc",
  "channelOf", "allArticles", "findArticle",
  "favs", "favButton", "articleCard",
  "dailyMap", "isDone", "toggleDaily", "todayCount", "streak", "totalCheckinDays",
  "moods", "initReveal", "initNav",
  "hydrateDaily", "dailyItemsHTML",
  "checksStore", "isChecked", "toggleCheck", "checklistHTML", "bindChecklist",
  "renderCheckin", "renderMe"
];

const moduleDirs = ["tools", "pages", "ui", "core"];
const unresolved = [];

/* 去掉注释与普通字符串，避免把 "l5.favs" 这类文本当成引用 */
const stripNoise = (s) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''");

for (const dir of moduleDirs) {
  const abs = join(SRC, "scripts", dir);
  if (!existsSync(abs)) continue;
  for (const file of readdirSync(abs).filter((f) => f.endsWith(".js"))) {
    const text = readFileSync(join(abs, file), "utf8");
    const m = text.match(/const \{([^}]*)\} = L5;/);
    const declared = m ? m[1].split(",").map((s) => s.trim()).filter(Boolean) : [];
    const body = stripNoise(m ? text.replace(m[0], "") : text);

    const defined = new Set();
    for (const re of [/function\s+([\w$]+)/g, /const\s+([\w$]+)\s*=/g, /let\s+([\w$]+)\s*=/g]) {
      for (const mm of body.matchAll(re)) defined.add(mm[1]);
    }
    const exported = body.match(/Object\.assign\(L5, \{([^}]*)\}\)/);
    if (exported) {
      exported[1].split(",").forEach((pair) => {
        const [from, to] = pair.split(":").map((s) => s.trim());
        defined.add(from); // ymdPad: pad → 导出名和来源名都算已定义
        if (to) defined.add(to);
      });
    }

    for (const name of API) {
      if (defined.has(name) || declared.includes(name)) continue;
      const escaped = name.replace(/[$.]/g, (c) => "\\" + c);
      /* $ / $$ 只在被调用时算使用；对象字面量的 key（name:）不算使用 */
      const re = /^\$+$/.test(name)
        ? new RegExp(`(?<![\\w$.])${escaped}\\(`)
        : new RegExp(`(?<![\\w$.])${escaped}(?![\\w$])(?!\\s*:)`);
      if (re.test(body)) unresolved.push(`${dir}/${file} 用到了未解构的 ${name}`);
    }
  }
}
check("模块引用的 L5 API 都已解构", unresolved.length === 0, unresolved.slice(0, 4).join(" | "));


/* ---------- 11. 首页不要重复刷同一批栏目名 ---------- */
const homeHtml = pageOf("index.html");
const homeText = homeHtml
  .replace(/<script[\s\S]*?<\/script>/g, " ")
  .replace(/<style[\s\S]*?<\/style>/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ");
const channelNames = ["健康吃", "随心穿", "不蕉绿", "开心练", "智慧投"];
const repeats = channelNames.map((n) => [n, (homeText.match(new RegExp(n, "g")) || []).length]);
const worst = repeats.reduce((a, b) => (b[1] > a[1] ? b : a));
check(
  "首页栏目名重复不超过 4 次（导航/线路图/筛选/页脚）",
  worst[1] <= 4,
  repeats.map(([n, c]) => `${n}:${c}`).join(" ")
);
/* ---------- 汇总 ---------- */
console.log(`\n构建检查：通过 ${pass}，失败 ${failures.length}`);
if (failures.length) {
  failures.forEach((f) => console.log("  ✗ " + f));
  process.exit(1);
}
