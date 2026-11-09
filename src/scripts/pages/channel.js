/* pages/channel.js —— 栏目页增强：今日小行动 + 分类筛选 */
(function () {
  "use strict";
  const L5 = window.L5;
  const { $, $$, channelOf, isDone, toggleDaily } = L5;

  function bindAction(channelId) {
    const channel = channelOf(channelId);
    if (!channel) return;
    const buttons = $$("[data-action]");
    const paint = (on) => {
      buttons.forEach((b) => {
        b.setAttribute("aria-pressed", String(on));
        if (b.dataset.label !== undefined) b.textContent = on ? "已完成 ✓" : channel.actionBtn;
      });
    };
    paint(isDone(channelId));

    buttons.forEach((b) => {
      b.addEventListener("click", () => {
        const on = toggleDaily(channelId);
        paint(on);
        if (on) {
          b.animate(
            [{ transform: "scale(1)" }, { transform: "scale(0.97)" }, { transform: "scale(1)" }],
            { duration: 260, easing: "ease-out" }
          );
        }
      });
    });
  }

  function bindTagFilter() {
    const tags = $("#channelTags");
    const grid = $("#channelArticles");
    if (!tags || !grid) return;
    const cards = $$("[data-tag]", grid);
    tags.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tag]");
      if (!btn) return;
      $$("[data-tag]", tags).forEach((b) =>
        b.setAttribute("aria-pressed", String(b === btn))
      );
      const filter = btn.dataset.tag;
      cards.forEach((card) => {
        const match = filter === "all" || card.dataset.tag === filter;
        card.hidden = !match;
        if (match) card.classList.add("is-in");
      });
    });
  }

  function run() {
    const channelId = document.body.dataset.channel;
    bindAction(channelId);
    bindTagFilter();
  }

  Object.assign(L5.pages, { channel: run });
})();
