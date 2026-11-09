/* pages/article.js —— 文章页增强：收藏 */
(function () {
  "use strict";
  const L5 = window.L5;
  const { $, $$, favs } = L5;

  function run() {
    const buttons = $$("[data-fav]");
    if (!buttons.length) return;
    buttons.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(favs.has(btn.dataset.fav)));
      btn.innerHTML = `<span aria-hidden="true">${favs.has(btn.dataset.fav) ? "♥" : "♡"}</span> 收藏`;
      btn.addEventListener("click", () => {
        const on = favs.toggle(btn.dataset.fav);
        btn.setAttribute("aria-pressed", String(on));
        btn.innerHTML = `<span aria-hidden="true">${on ? "♥" : "♡"}</span> 收藏`;
      });
    });
  }

  Object.assign(L5.pages, { article: run });
})();
