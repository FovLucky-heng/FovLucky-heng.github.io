/* pages/search.js —— 站内搜索（纯前端，标题/摘要/标签三段匹配） */
(function () {
  "use strict";
  const L5 = window.L5;
  const { $, esc, channelOf, articleCard, initReveal } = L5;

  function normalize(s) {
    return String(s || "").toLowerCase();
  }

  function score(item, q) {
    const title = normalize(item.t);
    const tag = normalize(item.g);
    const excerpt = normalize(item.e);
    let n = 0;
    if (title.includes(q)) n += 10;
    if (tag.includes(q)) n += 6;
    if (excerpt.includes(q)) n += 3;
    return n;
  }

  function run() {
    const input = $("#searchInput");
    const results = $("#searchResults");
    const hint = $("#searchHint");
    if (!input || !results) return;

    const index = window.L5_SEARCH_INDEX || [];

    const paint = (q) => {
      const query = normalize(q).trim();

      if (query.length < 2) {
        results.innerHTML = "";
        if (hint) hint.textContent = "输入两个字以上开始搜索。";
        return;
      }

      const hits = index
        .map((item) => ({ item, s: score(item, query) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 12);

      if (!hits.length) {
        results.innerHTML = "";
        if (hint) hint.textContent = `没有找到「${q}」相关的内容，换个词试试。`;
        return;
      }

      if (hint) hint.textContent = `找到 ${hits.length} 条结果。`;
      results.innerHTML = hits
        .map(({ item }) => {
          const ch = channelOf(item.ci);
          return articleCard(
            { slug: item.s, title: item.t, tag: item.g, excerpt: item.e, minutes: 4, channel: ch.id },
            { channel: ch }
          );
        })
        .join("");
      initReveal();
    };

    input.addEventListener("input", () => paint(input.value));

    /* 点击建议词 */
    document.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-q]");
      if (!chip) return;
      input.value = chip.dataset.q;
      paint(chip.dataset.q);
      input.focus();
    });

    /* 支持 ?q=xxx 直接带词进来 */
    const initial = new URLSearchParams(location.search).get("q");
    if (initial) {
      input.value = initial;
      paint(initial);
      input.focus();
    } else {
      input.focus();
    }
  }

  Object.assign(L5.pages, { search: run });
})();
