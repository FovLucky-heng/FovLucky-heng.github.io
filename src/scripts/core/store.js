/* core/store.js */
(function () {
  "use strict";
  const L5 = window.L5;

  const KEY = {
    favs: "l5.favs",
    daily: "l5.daily",
    moods: "l5.moods",
    ledger: "l5.ledger",
    budget: "l5.budget",
    challenge: "l5.challenge",
    checks: "l5.checks",
    recipe: "l5.recipe"
  };

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        /* 存储不可用时静默降级 */
      }
      return value;
    }
  };

  Object.assign(L5, { KEY, store });
})();
