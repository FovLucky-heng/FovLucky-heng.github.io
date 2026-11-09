/* tools/index.js —— 工具注册表 + 工具库面板 */
(function () {
  "use strict";
  const L5 = window.L5;
  const { $, esc, channelOf } = L5;

  const registry = {};
  L5.tools.registry = registry;
  L5.tools.register = function (tools) {
    Object.assign(registry, tools);
  };

  function openPanel(id, wrap) {
    const tool = registry[id];
    if (!tool) return;
    const channel = channelOf(tool.channel);

    wrap.innerHTML = `<section class="tool-panel" id="toolPanel">
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

    tool.render($("#toolBody"));
    wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    $("#toolClose").addEventListener("click", () => {
      wrap.innerHTML = "";
      try {
        history.replaceState(null, "", location.pathname);
      } catch (e) {}
    });
    try {
      history.replaceState(null, "", location.pathname + "?tool=" + id);
    } catch (e) {}
  }

  function run() {
    const wrap = $("#toolPanelWrap");
    if (!wrap) return;

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tool]");
      if (!btn) return;
      openPanel(btn.dataset.tool, wrap);
    });

    const initial = new URLSearchParams(location.search).get("tool");
    if (initial && registry[initial]) openPanel(initial, wrap);
  }

  Object.assign(L5.pages, { tools: run });
})();
