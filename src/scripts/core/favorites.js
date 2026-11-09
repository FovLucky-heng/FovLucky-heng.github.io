/* core/favorites.js */
(function () {
  "use strict";
  const L5 = window.L5;

  const { KEY, store } = L5;

  const favs = {
    list: () => store.get(KEY.favs, []),
    has: (slug) => favs.list().includes(slug),
    toggle(slug) {
      const cur = favs.list();
      const next = cur.includes(slug)
        ? cur.filter((s) => s !== slug)
        : cur.concat(slug);
      store.set(KEY.favs, next);
      return next.includes(slug);
    }
  };

  Object.assign(L5, { favs });
})();
