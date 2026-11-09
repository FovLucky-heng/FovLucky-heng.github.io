/* tools/move.js —— move 栏目的工具 */
(function () {
  "use strict";
  const L5 = window.L5;
  const { KEY, store, ymd, $, esc, checklistHTML, bindChecklist } = L5;

  L5.tools.register({
/* -------- 7 天挑战 -------- */
    challenge: {
      channel: "move",
      name: "7 天运动挑战",
      desc: "每天 10 分钟，先动起来。",
      render(root) {
        const tasks = [
          ["Day 1", "5 分钟：深蹲 10×2、靠墙俯卧撑 10×2"],
          ["Day 2", "8 分钟：臀桥 12×2、站姿提踵 15×2"],
          ["Day 3", "10 分钟快走"],
          ["Day 4", "10 分钟：深蹲 12×2、平板支撑 20 秒×3"],
          ["Day 5", "10 分钟拉伸（髋、腿后侧、胸椎）"],
          ["Day 6", "12 分钟快走 + 5 分钟拉伸"],
          ["Day 7", "自由安排，动一动就算赢"]
        ];
        let state = store.get(KEY.challenge, null);
        if (!state || !state.start) {
          state = { start: ymd(), done: {} };
          store.set(KEY.challenge, state);
        }

        const paint = () => {
          const doneN = Object.keys(state.done).length;
          root.querySelector("#chGrid").innerHTML = tasks
            .map(
              (t, i) => `<button class="day-card" data-day="${i}" aria-pressed="${!!state.done[i]}" style="text-align:left;width:100%;cursor:pointer">
                <div class="day-card__name"><span>${esc(t[0])}</span><span>${state.done[i] ? "✓" : ""}</span></div>
                <div class="meal"><span>${esc(t[1])}</span></div>
              </button>`
            )
            .join("");
          root.querySelector("#chBar").style.width = `${(doneN / 7) * 100}%`;
          root.querySelector("#chCount").textContent = `${doneN} / 7`;
        };

        root.innerHTML = `
          <p class="hint">从 ${esc(state.start)} 开始。完成后点一下当天卡片。</p>
          <div class="row mt-16" style="justify-content:space-between">
            <div class="progress" style="max-width:280px"><div class="progress__bar" id="chBar" style="width:0"></div></div>
            <span class="hint"><span id="chCount">0 / 7</span> 天</span>
          </div>
          <div class="grid-2 mt-16" id="chGrid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))"></div>
          <div class="row mt-24"><button class="btn btn--ghost btn--sm" id="chReset">重新开始</button></div>
        `;
        paint();

        root.querySelector("#chGrid").addEventListener("click", (e) => {
          const b = e.target.closest("[data-day]");
          if (!b) return;
          const i = Number(b.dataset.day);
          if (state.done[i]) delete state.done[i];
          else state.done[i] = true;
          store.set(KEY.challenge, state);
          paint();
        });
        root.querySelector("#chReset").addEventListener("click", () => {
          state = { start: ymd(), done: {} };
          store.set(KEY.challenge, state);
          paint();
        });
      }
    },

    /* -------- 办公室拉伸 -------- */
    stretch: {
      channel: "move",
      name: "办公室拉伸卡",
      desc: "久坐 60 分钟就做一次，8 分钟。",
      render(root) {
        const items = [
          "髋前侧：弓步压髋，左右各 40 秒",
          "大腿后侧：坐姿前屈，60 秒",
          "臀部：鸽子式简化版，左右各 40 秒",
          "胸椎：跪姿转体，左右各 30 秒",
          "颈肩：侧屈 + 绕肩，各 30 秒"
        ];
        root.innerHTML = `
          <p class="hint">拉到“紧但不痛”，配合呼气放松，不要弹震。</p>
          <div class="mt-16">${checklistHTML("stretch", items)}</div>
          <p class="hint mt-16">完成 <span data-progress="stretch">0 / 5</span> 组</p>
        `;
        bindChecklist(root, "stretch");
      }
    },

    /* -------- 运动后恢复 -------- */
    rest: {
      channel: "move",
      name: "运动后放松流程",
      desc: "第二天不酸痛的顺序。",
      render(root) {
        const items = [
          "先降心率：慢走 5 分钟",
          "补水 300—500ml",
          "补一份蛋白质（一掌心）",
          "拉伸最紧的两个部位，各 30 秒",
          "睡前 7 小时以上睡眠"
        ];
        root.innerHTML = `
          <p class="hint">酸痛不是练得好的证明，恢复才是。</p>
          <div class="mt-16">${checklistHTML("rest", items)}</div>
          <div class="callout mt-24">
            <span class="callout__label">注意</span>
            酸痛超过一周不缓解，或伴随肿胀发热、关节刺痛，请就医。
          </div>
          <p class="hint mt-16">完成 <span data-progress="rest">0 / 5</span> 项</p>
        `;
        bindChecklist(root, "rest");
      }
    }
  });
})();
