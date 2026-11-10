/* =========================================================
   构建期渲染函数
   只在 node 里跑：把数据变成静态 HTML 片段
   ========================================================= */

export const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

/** 极简模板引擎：{{key}} 占位符，缺变量直接报错（避免静默产出坏页面） */
export function render(template, vars, where = "template") {
  const out = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) {
      throw new Error(`${where}: 模板变量 {{${key}}} 没有提供`);
    }
    return vars[key];
  });
  const leftover = out.match(/\{\{\w+\}\}/);
  if (leftover) throw new Error(`${where}: 未解析的占位符 ${leftover[0]}`);
  return out;
}

/* ---------- 卡片 ---------- */

export function channelCard(c, delay = 0) {
  return `<a class="channel-card reveal" href="/${c.id}.html" style="--ch:${c.color};--chd:${c.deep};transition-delay:${delay}ms">
          <span class="channel-card__icon" aria-hidden="true">${esc(c.icon)}</span>
          <span class="channel-card__name">${esc(c.name)}</span>
          <span class="channel-card__claim">${esc(c.claim)}</span>
          <span class="channel-card__meta">${esc(c.card)}</span>
          <span class="channel-card__arrow" aria-hidden="true">›</span>
        </a>`;
}

/** 首页的「线路图」：五个站点串成一条线，是整站最有记忆点的部分 */
export function routeStops(channels) {
  return channels
    .map(
      (c, i) => `<li class="route__stop" style="--ch:${c.color};--chd:${c.deep};--i:${i}">
          <a class="route__link" href="/${c.id}.html">
            <span class="route__dot" aria-hidden="true">${esc(c.icon)}</span>
            <span class="route__body">
              <span class="route__line-no">${esc(c.line)}</span>
              <span class="route__name">${esc(c.name)}</span>
              <span class="route__claim">${esc(c.claim)}</span>
              <span class="route__meta">${esc(c.card)}</span>
            </span>
          </a>
        </li>`
    )
    .join("\n        ");
}

/** 工具库里的紧凑行（手机上比大卡片好扫） */
export function toolRow(ch, tool) {
  return `<button class="tool-row" type="button" data-tool="${tool.id}" style="--ch:${ch.color};--chd:${ch.deep}">
          <span class="tool-row__dot" aria-hidden="true">${esc(ch.icon)}</span>
          <span class="tool-row__text">
            <b>${esc(tool.name)}</b>
            <span>${esc(tool.desc)}</span>
          </span>
          <span class="tool-row__chev" aria-hidden="true">›</span>
        </button>`;
}

/** 首页「刚更新的三条」：纯文字行，和栏目页的卡片网格区分开 */
export function latestRow(a, ch) {
  return `<li class="latest-row" style="--ch:${ch.color};--chd:${ch.deep}">
          <a class="latest-row__link" href="/article/${a.slug}.html">
            <span class="latest-row__tag">${esc(a.tag)}</span>
            <span class="latest-row__title">${esc(a.title)}</span>
            <span class="latest-row__chev" aria-hidden="true">›</span>
          </a>
        </li>`;
}

export function articleCard(a, { channel, attrs = "" } = {}) {
  return `<a class="article-card reveal" href="/article/${a.slug}.html"${attrs} style="--ch:${channel.color};--chd:${channel.deep}">
          <span class="article-card__tag">${esc(a.tag)}</span>
          <span class="article-card__title">${esc(a.title)}</span>
          <span class="article-card__excerpt">${esc(a.excerpt)}</span>
          <span class="article-card__meta">
            <span>${a.minutes} 分钟阅读</span>
          </span>
        </a>`;
}

export function toolCard(ch, tool, { link = true, showChannel = true } = {}) {
  const top = showChannel
    ? `<span class="tool-card__top"><span class="dot" style="background:${ch.color}"></span>${esc(ch.name)}</span>
            `
    : "";
  const inner = `${top}<span class="tool-card__name">${esc(tool.name)}</span>
            <span class="tool-card__desc">${esc(tool.desc)}</span>`;
  return link
    ? `<a class="tool-card reveal" href="/tools.html?tool=${tool.id}" style="--ch:${ch.color};--chd:${ch.deep}">${inner}</a>`
    : `<button class="tool-card" type="button" data-tool="${tool.id}" style="--ch:${ch.color};--chd:${ch.deep}">${inner}</button>`;
}

export function dailyItem(item, channel) {
  /* 栏目名只在 aria-label 里出现，视觉上用色点区分，避免整页重复五个名字 */
  return `<button class="daily__item" type="button" data-daily="${item.id}" aria-pressed="false" aria-label="${esc(
    channel.name
  )}：${esc(item.text)}" style="--ch:${channel.color}">
          <span class="daily__check" aria-hidden="true">✓</span>
          <span class="daily__text"><span class="daily__dot" aria-hidden="true"></span>${esc(item.text)}</span>
        </button>`;
}

export function segmented(items, { pressed = 0, attr = "data-filter" } = {}) {
  return items
    .map(
      (it, i) =>
        `<button class="segmented__btn" type="button" ${attr}="${esc(it.id)}" aria-pressed="${
          i === pressed
        }">${esc(it.name)}</button>`
    )
    .join("\n        ");
}

/* ---------- 文章正文 ---------- */

export function articleBody(blocks) {
  return blocks
    .map((b) => {
      if (b.t === "h2") return `    <h2>${esc(b.c)}</h2>`;
      if (b.t === "p") return `    <p>${esc(b.c)}</p>`;
      if (b.t === "ul")
        return `    <ul>\n${b.c.map((li) => `      <li>${esc(li)}</li>`).join("\n")}\n    </ul>`;
      if (b.t === "tip")
        return `    <div class="callout"><span class="callout__label">小提示</span>${esc(
          b.c
        )}</div>`;
      if (b.t === "quote") return `    <blockquote>${esc(b.c)}</blockquote>`;
      throw new Error(`未知的正文块类型: ${b.t}`);
    })
    .join("\n");
}

/* ---------- 结构化数据 ---------- */

export function articleJsonLd({ article, channel, url, site }) {
  return `<script type="application/ld+json">
${JSON.stringify(
  {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    articleSection: channel.name,
    url,
    isPartOf: { "@type": "WebSite", name: site.name, url: site.url }
  },
  null,
  2
)}
</script>`;
}
