/* tools/index.js —— 工具注册表 + 工具库面板（手机上是底部抽屉） */
(function () {
  "use strict";
  const L5 = window.L5;
  const { $, esc, channelOf } = L5;

  const registry = {};
  L5.tools.registry = registry;
  L5.tools.register = function (tools) {
    Object.assign(registry, tools);
  };

  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

  function openPanel(id, wrap) {
    const tool = registry[id];
    if (!tool) return;
    const channel = channelOf(tool.channel);

    wrap.innerHTML = `<section class="tool-panel" id="toolPanel" role="dialog" aria-modal="true" aria-label="${esc(
      tool.name
    )}">
      <div class="tool-panel__head">
        <div>
          <div class="eyebrow" style="margin-bottom:6px;color:${channel.deep}">${esc(
      channel.name
    )} · 工具</div>
          <h2 class="tool-panel__title">${esc(tool.name)}</h2>
        </div>
        <button class="tool-panel__close" id="toolClose" type="button">关闭 ✕</button>
      </div>
      <div id="toolBody"></div>
    </section>`;

    wrap.classList.add("is-open");
    tool.render($("#toolBody"));

    /* 手机：底部抽屉，锁住背景滚动；桌面：滚动到面板 */
    if (isMobile()) {
      document.body.style.overflow = "hidden";
      $("#toolPanel").focus?.();
    } else {
      wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    try {
      history.replaceState(null, "", location.pathname + "?tool=" + id);
    } catch (e) {}
  }

  function closePanel(wrap) {
    wrap.classList.remove("is-open");
    wrap.innerHTML = "";
    document.body.style.overflow = "";
    try {
      history.replaceState(null, "", location.pathname);
    } catch (e) {}
  }

  function run() {
    const wrap = $("#toolPanelWrap");
    if (!wrap) return;

    document.addEventListener("click", (e) => {
      /* 点遮罩关闭（手机） */
      if (e.target === wrap && wrap.classList.contains("is-open")) {
        closePanel(wrap);
        return;
      }
      if (e.target.closest("#toolClose")) {
        closePanel(wrap);
        return;
      }
      const btn = e.target.closest("[data-tool]");
      if (!btn) return;
      openPanel(btn.dataset.tool, wrap);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && wrap.classList.contains("is-open")) closePanel(wrap);
    });

    const initial = new URLSearchParams(location.search).get("tool");
    if (initial && registry[initial]) openPanel(initial, wrap);
  }

  Object.assign(L5.pages, { tools: run });
})();
