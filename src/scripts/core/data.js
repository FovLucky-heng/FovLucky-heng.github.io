/* core/data.js */
(function () {
  "use strict";
  const L5 = window.L5;

  const { BRAND, CHANNELS, DAILY, MOODS } = window.APP_DATA;

  Object.assign(L5, { BRAND, CHANNELS, DAILY, MOODS });
})();
