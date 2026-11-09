/* tools/shared.js —— 工具共用的清单持久化 */
(function () {
  "use strict";
  const L5 = window.L5;
  const { KEY, store, $, esc } = L5;

/* ---------- 通用：持久化清单 ---------- */
  function checksStore() {
    return store.get(KEY.checks, {});
  }
  function isChecked(listId, idx) {
    return !!(checksStore()[listId] || {})[idx];
  }
  function toggleCheck(listId, idx) {
    const all = checksStore();
    const cur = Object.assign({}, all[listId] || {});
    if (cur[idx]) delete cur[idx];
    else cur[idx] = true;
    all[listId] = cur;
    store.set(KEY.checks, all);
    return !!cur[idx];
  }

  function checklistHTML(listId, items) {
    return `<div class="check-list" data-list="${esc(listId)}">
      ${items
        .map(
          (t, i) => `<button class="check-item" data-idx="${i}" aria-pressed="${isChecked(
            listId,
            i
          )}">
            <span class="check-item__box" aria-hidden="true">✓</span>
            <span>${esc(t)}</span>
          </button>`
        )
        .join("")}
    </div>`;
  }

  function bindChecklist(root, listId, opts) {
    const list = root.querySelector(`[data-list="${listId}"]`);
    if (!list) return;
    const paint = () => {
      const total = list.querySelectorAll("[data-idx]").length;
      const done = list.querySelectorAll('[aria-pressed="true"]').length;
      const out = root.querySelector(`[data-progress="${listId}"]`);
      if (out) out.textContent = `${done} / ${total}`;
    };
    list.addEventListener("click", (e) => {
      const b = e.target.closest("[data-idx]");
      if (!b) return;
      const on = toggleCheck(listId, b.dataset.idx);
      b.setAttribute("aria-pressed", String(on));
      paint();
      if (opts && opts.onChange) opts.onChange();
    });
    paint();
  }

  Object.assign(L5, { checksStore, isChecked, toggleCheck, checklistHTML, bindChecklist });
})();
