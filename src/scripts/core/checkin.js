/* core/checkin.js */
(function () {
  "use strict";
  const L5 = window.L5;

  const { store, KEY, ymd, DAILY } = L5;

  function dailyMap() {
    return store.get(KEY.daily, {});
  }

  function isDone(id) {
    return !!(dailyMap()[ymd()] || {})[id];
  }

  function toggleDaily(id) {
    const map = dailyMap();
    const today = Object.assign({}, map[ymd()] || {});
    today[id] = !today[id];
    if (!today[id]) delete today[id];
    map[ymd()] = today;
    store.set(KEY.daily, map);
    return !!today[id];
  }

  function todayCount() {
    return DAILY.filter((d) => isDone(d.id)).length;
  }

  function streak() {
    const map = dailyMap();
    let n = 0;
    for (let i = 0; i < 400; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = ymd(d);
      const rec = map[k] || {};
      const done = Object.keys(rec).some((x) => rec[x]);
      if (done) n++;
      else if (i > 0) break;
    }
    return n;
  }

  function totalCheckinDays() {
    const map = dailyMap();
    return Object.keys(map).filter((k) =>
      Object.keys(map[k] || {}).some((x) => map[k][x])
    ).length;
  }

  Object.assign(L5, { dailyMap, isDone, toggleDaily, todayCount, streak, totalCheckinDays });
})();
