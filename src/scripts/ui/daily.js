/* ui/daily.js —— 今日五件小事：渲染 + 状态同步 + 点击 */
(function () {
  "use strict";
  const L5 = window.L5;
  const { DAILY, $, esc, channelOf, isDone, toggleDaily, todayCount } = L5;

  function itemsHTML() {
    return DAILY.map((d) => {
      const ch = channelOf(d.channel);
      return `<button class="daily__item" data-daily="${d.id}" aria-pressed="false" style="--ch:${ch.color}">
        <span class="daily__check" aria-hidden="true">✓</span>
        <span class="daily__text">
          <span class="daily__tag">${esc(ch.name)}</span>${esc(d.text)}
        </span>
      </button>`;
    }).join("");
  }

  function paintProgress(el) {
    if (!el) return;
    const n = todayCount();
    el.innerHTML = `<div class="progress"><div class="progress__bar" style="width:${
      (n / DAILY.length) * 100
    }%"></div></div><span>今日 ${n}/${DAILY.length}</span>`;
  }

  /**
   * 把 #dailyList 变成可交互的打卡列表。
   * 页面已经预渲染了按钮时只做状态同步；没有时（如打卡页）先渲染再绑定。
   */
  function hydrateDaily(listEl, progressEl) {
    const list = listEl || $("#dailyList");
    if (!list) return;
    if (!list.children.length) list.innerHTML = itemsHTML();

    list.querySelectorAll("[data-daily]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(isDone(btn.dataset.daily)));
    });
    paintProgress(progressEl || $("#dailyProgress"));

    if (list.dataset.bound === "1") return;
    list.dataset.bound = "1";
    list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-daily]");
      if (!btn) return;
      btn.setAttribute("aria-pressed", String(toggleDaily(btn.dataset.daily)));
      paintProgress(progressEl || $("#dailyProgress"));
      /* 让同页面的其他统计（连续天数、7 天格子）能跟着刷新 */
      list.dispatchEvent(
        new CustomEvent("l5:daily", { bubbles: true, detail: { id: btn.dataset.daily } })
      );
    });
  }

  Object.assign(L5, { hydrateDaily, dailyItemsHTML: itemsHTML });
})();
