/* pages/home.js —— 首页增强：打卡 + 内容筛选 + 展开更多 */
(function () {
  "use strict";
  const L5 = window.L5;
  const { $, $$, initReveal, hydrateDaily } = L5;

  const LIMIT = 8; // 默认展示最新 8 篇

  function bindLatestFilter() {
    const tabs = $("#latestTabs");
    const grid = $("#latestGrid");
    if (!tabs || !grid) return;

    const more = $("#latestMore");
    const cards = $$("[data-channel]", grid);
    let filter = "all";
    let expanded = false;

    const paint = () => {
      cards.forEach((card, i) => {
        const inFilter = filter === "all" || card.dataset.channel === filter;
        const overLimit = filter === "all" && !expanded && i >= LIMIT;
        const match = inFilter && !overLimit;
        card.hidden = !match;
        if (match) card.classList.add("is-in"); // 预渲染卡片不依赖滚动动画
      });

      if (!more) return;
      const hiddenByLimit = filter === "all" && cards.length > LIMIT;
      more.hidden = !hiddenByLimit;
      more.textContent = expanded
        ? "收起"
        : `查看全部 ${cards.length} 篇`;
      more.setAttribute("aria-expanded", String(expanded));
    };

    tabs.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      filter = btn.dataset.filter;
      expanded = false; // 换筛选条件时回到折叠状态
      $$("[data-filter]", tabs).forEach((b) =>
        b.setAttribute("aria-pressed", String(b === btn))
      );
      paint();
    });

    if (more) {
      more.addEventListener("click", () => {
        expanded = !expanded;
        paint();
        if (expanded) {
          /* 展开后第一张"被隐藏的"卡片滚进视野，避免用户以为没反应 */
          const first = cards[LIMIT];
          if (first) first.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    }

    paint();
  }

  function run() {
    hydrateDaily($("#dailyList"), $("#dailyProgress"));
    bindLatestFilter();
    initReveal();
  }

  Object.assign(L5.pages, { home: run });
})();
