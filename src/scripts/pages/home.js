/* pages/home.js —— 首页：今天先做这一件 / 今日一条 / 数字滚动 */
(function () {
  "use strict";
  const L5 = window.L5;
  const {
    $,
    CHANNELS,
    DAILY,
    channelOf,
    allArticles,
    isDone,
    toggleDaily,
    streak,
    totalCheckinDays,
    initReveal,
    initCounters
  } = L5;

  const pad = (n) => String(n).padStart(2, "0");

  /* ---------- 顶部日期 ---------- */
  function paintDate() {
    const el = $("#todayDate");
    if (!el) return;
    const d = new Date();
    const week = "日一二三四五六"[d.getDay()];
    el.textContent = `${d.getMonth() + 1} 月 ${d.getDate()} 日 · 周${week}`;
  }

  /* ---------- 今天先做这一件 ---------- */
  function bindSuggestion() {
    const btn = $("#suggestDo");
    const textEl = $("#suggestText");
    if (!btn || !textEl) return;

    /* 按本地日期挑一件，保证同一天刷新看到的是同一条 */
    const today = L5.ymd();
    const seed = Number(today.replace(/-/g, ""));
    const item = DAILY[seed % DAILY.length];
    const channel = channelOf(item.channel);
    textEl.textContent = item.text;
    const card = textEl.closest(".today-card");
    if (card) card.style.setProperty("--ch", channel.color);

    const paint = () => {
      const on = isDone(item.id);
      btn.setAttribute("aria-pressed", String(on));
      btn.textContent = on ? "已完成 ✓" : "我做了";
    };
    paint();

    btn.addEventListener("click", () => {
      toggleDaily(item.id);
      paint();
      refreshStats();
    });
  }

  /* ---------- 统计数字 ---------- */
  function refreshStats() {
    const s = $("#streakNum");
    const t = $("#totalNum");
    if (s) s.dataset.count = String(streak());
    if (t) t.dataset.count = String(totalCheckinDays());
    initCounters(document);
  }

  /* ---------- 今日一条 ---------- */
  function bindFeature() {
    const titleEl = $("#featureTitle");
    const excerptEl = $("#featureExcerpt");
    const channelEl = $("#featureChannel");
    const linkEl = $("#featureLink");
    const box = $("#feature");
    if (!titleEl || !box) return;

    const items = allArticles();
    if (!items.length) return;

    const today = L5.ymd();
    let index = Number(today.replace(/-/g, "")) % items.length;

    const paint = () => {
      const a = items[index % items.length];
      const ch = channelOf(a.channel);
      titleEl.textContent = a.title;
      if (excerptEl) excerptEl.textContent = a.excerpt;
      if (channelEl) channelEl.textContent = ch.name;
      if (linkEl) linkEl.href = `article/${a.slug}.html`;
      box.style.setProperty("--ch", ch.color);
      box.style.setProperty("--chd", ch.deep);
    };

    paint();

    const next = $("#featureNext");
    if (next) {
      next.addEventListener("click", () => {
        index = (index + 1) % items.length;
        paint();
        box.animate(
          [
            { opacity: 0.35, transform: "translateY(6px)" },
            { opacity: 1, transform: "none" }
          ],
          { duration: 320, easing: "ease-out" }
        );
      });
    }
  }

  function run() {
    paintDate();
    bindSuggestion();
    refreshStats();
    bindFeature();
    initReveal();
  }

  Object.assign(L5.pages, { home: run });
})();
