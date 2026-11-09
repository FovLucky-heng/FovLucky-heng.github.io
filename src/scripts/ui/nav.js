/* ui/nav.js */
(function () {
  "use strict";
  const L5 = window.L5;
  const { $, $$ } = L5;

  function initNav() {
    const page = document.body.dataset.page || "";
    $$("[data-nav]").forEach((el) => {
      const key = el.dataset.nav;
      const active =
        key === page ||
        (page === "channel" && key === "channels") ||
        (page === "article" && key === "channels");
      if (active) el.setAttribute("aria-current", "page");
    });
  }

  Object.assign(L5, { initNav });
})();
