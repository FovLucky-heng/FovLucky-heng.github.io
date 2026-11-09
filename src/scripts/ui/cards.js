/* ui/cards.js */
(function () {
  "use strict";
  const L5 = window.L5;
  const { $, esc, channelOf, favs } = L5;

  const favButton = (slug) =>
    `<button class="icon-btn" data-fav="${esc(slug)}" aria-pressed="${favs.has(slug)}">
       <span aria-hidden="true">${favs.has(slug) ? "♥" : "♡"}</span> 收藏
     </button>`;

  function articleCard(a) {
    const ch = channelOf(a.channel);
    return `<a class="article-card reveal" href="article.html?a=${encodeURIComponent(a.slug)}" style="--ch:${ch.color};--chd:${ch.deep}">
      <span class="article-card__tag">${esc(a.tag)}</span>
      <span class="article-card__title">${esc(a.title)}</span>
      <span class="article-card__excerpt">${esc(a.excerpt)}</span>
      <span class="article-card__meta">
        <span>${esc(ch.name)}</span><span>·</span><span>${a.minutes} 分钟阅读</span>
      </span>
    </a>`;
  }

  Object.assign(L5, { favButton, articleCard });
})();
