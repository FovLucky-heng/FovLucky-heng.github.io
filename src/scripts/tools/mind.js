/* tools/mind.js —— mind 栏目的工具 */
(function () {
  "use strict";
  const L5 = window.L5;
  const { store, ymd, $, $$, esc, moods, checklistHTML, bindChecklist } = L5;

  L5.tools.register({
/* -------- 呼吸练习 -------- */
    breath: {
      channel: "mind",
      name: "3 分钟呼吸练习",
      desc: "吸气 4 秒，呼气 6 秒，跟着圆圈。",
      render(root) {
        let running = false;
        let tickTimer = null;
        let phaseTimer = null;
        let remaining = 180;
        let cycles = 0;

        root.innerHTML = `
          <p class="hint">关键不是吸得深，而是呼气比吸气长。坐着、躺着都可以。</p>
          <div class="breath-stage">
            <div class="breath-circle" id="bCircle"><span id="bLabel">准备好就开始</span></div>
          </div>
          <div class="breath-count">
            <div style="font-size:26px;font-weight:600;color:var(--ink)" id="bTime">03:00</div>
            <div class="mt-8">已完成 <span id="bCycles">0</span> 个呼吸</div>
          </div>
          <div class="row mt-24" style="justify-content:center">
            <button class="btn btn--accent btn--sm" id="bGo">开始</button>
            <button class="btn btn--ghost btn--sm" id="bReset">重置</button>
          </div>
        `;

        const circle = root.querySelector("#bCircle");
        const label = root.querySelector("#bLabel");
        const timeEl = root.querySelector("#bTime");
        const cycEl = root.querySelector("#bCycles");

        const fmt = (s) =>
          `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

        const stop = () => {
          running = false;
          clearInterval(tickTimer);
          clearTimeout(phaseTimer);
          circle.style.transitionDuration = "800ms";
          circle.style.transform = "scale(1)";
          label.textContent = "已暂停";
          root.querySelector("#bGo").textContent = "继续";
        };

        const cycle = () => {
          if (!running) return;
          circle.style.transitionDuration = "4000ms";
          circle.style.transform = "scale(1.22)";
          label.textContent = "吸气…";
          phaseTimer = setTimeout(() => {
            if (!running) return;
            circle.style.transitionDuration = "6000ms";
            circle.style.transform = "scale(1)";
            label.textContent = "呼气…";
          }, 4000);
          phaseTimer = setTimeout(() => {
            if (!running) return;
            cycles++;
            cycEl.textContent = cycles;
          }, 9000);
        };

        const start = () => {
          running = true;
          root.querySelector("#bGo").textContent = "暂停";
          circle.style.transitionDuration = "4000ms";
          cycle();
          clearInterval(tickTimer);
          tickTimer = setInterval(() => {
            remaining--;
            timeEl.textContent = fmt(Math.max(remaining, 0));
            if (remaining <= 0) {
              stop();
              label.textContent = "做得好";
              root.querySelector("#bGo").textContent = "再来一次";
              remaining = 180;
            } else if (remaining % 10 === 0) {
              cycle();
            }
          }, 1000);
        };

        root.querySelector("#bGo").addEventListener("click", () => {
          if (running) stop();
          else {
            if (remaining <= 0) remaining = 180;
            start();
          }
        });
        root.querySelector("#bReset").addEventListener("click", () => {
          running = false;
          clearInterval(tickTimer);
          clearTimeout(phaseTimer);
          remaining = 180;
          cycles = 0;
          timeEl.textContent = fmt(remaining);
          cycEl.textContent = "0";
          circle.style.transitionDuration = "600ms";
          circle.style.transform = "scale(1)";
          label.textContent = "准备好就开始";
          root.querySelector("#bGo").textContent = "开始";
        });
      }
    },

    /* -------- 情绪记录 -------- */
    mood: {
      channel: "mind",
      name: "情绪记录表",
      desc: "三行字就够，不写小作文。",
      render(root) {
        const MOODS = window.APP_DATA.MOODS;
        const noteKey = "l5.moodNotes";
        const notes = store.get(noteKey, []);
        const cur = moods.get();

        const list = () =>
          notes.length
            ? notes
                .slice(0, 8)
                .map(
                  (n) => `<div class="ledger-row">
                    <span class="ledger-row__cat">${esc(n.date.slice(5))}</span>
                    <span class="ledger-row__note">${esc(n.mood || "—")} · ${esc(n.scene || "")} · ${esc(n.need || "")}</span>
                  </div>`
                )
                .join("")
            : `<p class="muted small">还没有记录。</p>`;

        root.innerHTML = `
          <div class="field">
            <span class="field__label">今天最强烈的情绪是</span>
            <div class="mood-row" id="tmRow">
              ${MOODS.map(
                (m) =>
                  `<button class="mood-btn" data-mood="${m.id}" aria-pressed="${
                    cur === m.id
                  }"><span aria-hidden="true">${m.icon}</span>${m.label}</button>`
              ).join("")}
            </div>
          </div>
          <div class="grid-2">
            <label class="field">
              <span class="field__label">它出现在什么时候</span>
              <input class="input" id="tmScene" placeholder="例：开完会之后" maxlength="40" />
            </label>
            <label class="field">
              <span class="field__label">当时我需要的是</span>
              <input class="input" id="tmNeed" placeholder="例：休息 / 被理解 / 掌控感" maxlength="40" />
            </label>
          </div>
          <div class="row"><button class="btn btn--accent btn--sm" id="tmSave">记下来</button></div>
          <h3 class="card__title mt-32" style="font-size:16px">最近记录</h3>
          <div class="ledger-list" id="tmList">${list()}</div>
        `;

        let picked = cur;
        root.querySelector("#tmRow").addEventListener("click", (e) => {
          const b = e.target.closest("[data-mood]");
          if (!b) return;
          picked = b.dataset.mood;
          $$("[data-mood]", root).forEach((x) =>
            x.setAttribute("aria-pressed", String(x === b))
          );
          moods.set(picked);
        });

        root.querySelector("#tmSave").addEventListener("click", () => {
          const rec = {
            date: ymd(),
            mood: (MOODS.find((m) => m.id === picked) || {}).label || "",
            scene: root.querySelector("#tmScene").value.trim(),
            need: root.querySelector("#tmNeed").value.trim()
          };
          if (!rec.scene && !rec.need && !rec.mood) return;
          const next = [rec].concat(notes).slice(0, 40);
          store.set(noteKey, next);
          notes.length = 0;
          next.forEach((n) => notes.push(n));
          root.querySelector("#tmList").innerHTML = list();
          root.querySelector("#tmScene").value = "";
          root.querySelector("#tmNeed").value = "";
        });
      }
    },

    /* -------- 焦虑自救 -------- */
    rescue: {
      channel: "mind",
      name: "焦虑自救清单",
      desc: "现在就做点什么，比想明白更快。",
      render(root) {
        const items = [
          "延长呼气：吸 4 秒，呼 6 秒，做 6 次",
          "说出情绪：我现在感到____",
          "感受脚底，数 10 次呼吸",
          "喝一杯温水，离开现在的房间 3 分钟",
          "写下一个最小的下一步动作",
          "如果 10 分钟后仍心跳很快，联系一个人"
        ];
        root.innerHTML = `
          <p class="hint">从上往下做，做到哪条缓过来就停。</p>
          <div class="mt-16">${checklistHTML("rescue", items)}</div>
          <div class="callout mt-24">
            <span class="callout__label">重要</span>
            如果出现持续心悸、手抖、喘不上气，或有伤害自己的念头，请立即就医或拨打心理援助热线（如 12356）。这不是“想开点”能解决的事。
          </div>
          <p class="hint mt-16">已完成 <span data-progress="rescue">0 / 6</span></p>
        `;
        bindChecklist(root, "rescue");
      }
    }
  });
})();
