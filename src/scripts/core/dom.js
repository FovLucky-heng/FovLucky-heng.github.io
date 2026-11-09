/* core/dom.js */
(function () {
  "use strict";
  const L5 = window.L5;

  const $ = (s, r = document) => r.querySelector(s);

  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));

  Object.assign(L5, { $, $$, esc });
})();
