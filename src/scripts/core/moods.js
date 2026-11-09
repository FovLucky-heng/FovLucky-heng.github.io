/* core/moods.js */
(function () {
  "use strict";
  const L5 = window.L5;

  const { store, KEY, ymd } = L5;

  const moods = {
    all: () => store.get(KEY.moods, {}),
    get(day = ymd()) {
      return moods.all()[day] || null;
    },
    set(id, day = ymd()) {
      const map = moods.all();
      if (map[day] === id) delete map[day];
      else map[day] = id;
      store.set(KEY.moods, map);
      return map[day] || null;
    }
  };

  Object.assign(L5, { moods });
})();
