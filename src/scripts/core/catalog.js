/* core/catalog.js */
(function () {
  "use strict";
  const L5 = window.L5;

  const { CHANNELS } = L5;

  const channelOf = (id) => CHANNELS.find((c) => c.id === id);

  function allArticles() {
    return CHANNELS.flatMap((c) =>
      c.articles.map((a) => Object.assign({}, a, { channel: c.id, chName: c.name }))
    );
  }

  const findArticle = (slug) => allArticles().find((a) => a.slug === slug);

  Object.assign(L5, { channelOf, allArticles, findArticle });
})();
