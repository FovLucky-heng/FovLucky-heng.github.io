/* main.js —— 启动：按 body[data-page] 派发到对应页面模块 */
(function () {
  "use strict";
  const L5 = window.L5;

  function boot() {
    L5.initNav();

    const page = document.body.dataset.page;
    const handler = L5.pages[page];
    if (typeof handler === "function") handler();

    /* 打卡页 / 我的页面自带渲染函数 */
    if (page === "checkin" && L5.renderCheckin) L5.renderCheckin();
    if (page === "me" && L5.renderMe) L5.renderMe();

    L5.initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
