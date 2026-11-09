/* core/dates.js */
(function () {
  "use strict";
  const L5 = window.L5;

  const pad = (n) => String(n).padStart(2, "0");

  const ymd = (d = new Date()) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const WEEK_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  function lastNDays(n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push(d);
    }
    return out;
  }

  Object.assign(L5, { pad, ymd, ymdPad: pad, WEEK_CN, lastNDays });
})();
