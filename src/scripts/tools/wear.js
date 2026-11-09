/* tools/wear.js —— wear 栏目的工具 */
(function () {
  "use strict";
  const L5 = window.L5;
  const { $, esc, checklistHTML, bindChecklist } = L5;

  L5.tools.register({
/* -------- 搭配生成器 -------- */
    wardrobe: {
      channel: "wear",
      name: "搭配灵感生成器",
      desc: "选一个底色和一个场景，出三套。",
      render(root) {
        const bases = [
          { id: "warm", name: "燕麦 / 驼色", tops: ["米白针织", "浅驼衬衫", "燕麦开衫"], bottoms: ["深咖直筒裤", "米色半裙", "驼色阔腿裤"], shoes: ["棕色乐福鞋", "米色短靴", "小白鞋"] },
          { id: "cool", name: "雾蓝 / 灰", tops: ["雾蓝衬衫", "浅灰 T 恤", "灰色针织"], bottoms: ["深灰西裤", "蓝灰牛仔裤", "黑色直筒裤"], shoes: ["黑色乐福鞋", "白球鞋", "灰短靴"] },
          { id: "dark", name: "黑 / 深色", tops: ["黑色高领", "深灰 T 恤", "黑色衬衫"], bottoms: ["黑色直筒裤", "深蓝牛仔", "炭灰西裤"], shoes: ["黑短靴", "小白鞋", "黑色乐福鞋"] },
          { id: "light", name: "白 / 米白", tops: ["白衬衫", "米白 T 恤", "白针织"], bottoms: ["浅蓝牛仔", "米色长裤", "白色半裙"], shoes: ["小白鞋", "浅色乐福鞋", "草编鞋"] }
        ];
        const scenes = [
          { id: "work", name: "上班", extra: ["加一件西装外套", "配一只结构感托特包", "配饰：一块表"] },
          { id: "cafe", name: "见朋友", extra: ["加一件开衫", "配帆布包", "配饰：细项链"] },
          { id: "date", name: "约会", extra: ["换一双有跟的鞋", "配一只小包", "配饰：耳饰"] },
          { id: "weekend", name: "周末", extra: ["加一顶帽子", "换成运动鞋", "配饰：墨镜"] }
        ];
        const idx = (arr, n) => arr[n % arr.length];

        const build = (base, scene) => {
          const out = [];
          for (let i = 0; i < 3; i++) {
            out.push({
              top: idx(base.tops, i),
              bottom: idx(base.bottoms, i + 1),
              shoe: idx(base.shoes, i + 2),
              extra: idx(scene.extra, i)
            });
          }
          return out;
        };

        root.innerHTML = `
          <div class="grid-2">
            <label class="field">
              <span class="field__label">底色 / 色系</span>
              <select class="select" id="wBase">
                ${bases.map((b) => `<option value="${b.id}">${esc(b.name)}</option>`).join("")}
              </select>
            </label>
            <label class="field">
              <span class="field__label">场景</span>
              <select class="select" id="wScene">
                ${scenes.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}
              </select>
            </label>
          </div>
          <div class="row"><button class="btn btn--accent btn--sm" id="wGo">生成 3 套</button></div>
          <div class="grid-3 mt-24" id="wOut"></div>
        `;
        const paint = () => {
          const base = bases.find((b) => b.id === root.querySelector("#wBase").value);
          const scene = scenes.find((s) => s.id === root.querySelector("#wScene").value);
          root.querySelector("#wOut").innerHTML = build(base, scene)
            .map(
              (o, i) => `<div class="card card--flat">
                <div class="eyebrow" style="margin-bottom:8px">方案 ${i + 1}</div>
                <div class="meal"><b>上</b><span>${esc(o.top)}</span></div>
                <div class="meal"><b>下</b><span>${esc(o.bottom)}</span></div>
                <div class="meal"><b>鞋</b><span>${esc(o.shoe)}</span></div>
                <div class="meal"><b>加</b><span>${esc(o.extra)}</span></div>
              </div>`
            )
            .join("");
        };
        paint();
        root.querySelector("#wGo").addEventListener("click", paint);
      }
    },

    /* -------- 胶囊衣橱 -------- */
    capsule: {
      channel: "wear",
      name: "胶囊衣橱清单",
      desc: "先留这 10 件，其余围绕它们。",
      render(root) {
        const items = [
          "白衬衫 1 件",
          "合身针织打底 1 件",
          "纯色 T 恤 2 件（白 + 深）",
          "直筒牛仔裤 1 条",
          "深色西裤 1 条",
          "半身裙或宽松长裤 1 条",
          "外套 1 件（西装 / 风衣）",
          "针织开衫 1 件",
          "小白鞋 1 双",
          "乐福鞋或短靴 1 双"
        ];
        root.innerHTML = `
          <p class="hint">缺的那一件，才是你真正该买的。</p>
          <div class="mt-16">${checklistHTML("capsule", items)}</div>
          <p class="hint mt-16">已有 <span data-progress="capsule">0 / 10</span> 件</p>
        `;
        bindChecklist(root, "capsule");
      }
    },

    /* -------- 旧衣新穿 -------- */
    renew: {
      channel: "wear",
      name: "旧衣新穿灵感卡",
      desc: "一张卡，改一个细节就换一种风格。",
      render(root) {
        const cards = [
          ["换鞋", "运动鞋换成乐福鞋，同一套衣服从休闲变通勤。"],
          ["塞衣角", "全塞显利落，前塞一半显随性。"],
          ["叠一层", "T 恤外面加一件敞开的衬衫，立刻有层次。"],
          ["换配色", "把最亮的那件从下装移到上装，重心上移更显高。"],
          ["加腰带", "腰线是比例的开关，一条细腰带就够。"],
          ["卷袖口", "露出手腕，视觉上更轻盈。"],
          ["换包", "大托特换小包，正式感立刻不同。"],
          ["同色系", "上下取同色不同深浅，最省力的高级感。"]
        ];
        const paint = () => {
          const shuffled = cards.slice().sort(() => Math.random() - 0.5).slice(0, 3);
          root.querySelector("#renewOut").innerHTML = shuffled
            .map(
              (c) => `<div class="card card--flat">
                <span class="eyebrow" style="margin-bottom:6px">${esc(c[0])}</span>
                <p class="card__desc" style="margin:0">${esc(c[1])}</p>
              </div>`
            )
            .join("");
        };
        root.innerHTML = `
          <p class="hint">每次抽三张，选一张今天试试。</p>
          <div class="row"><button class="btn btn--accent btn--sm" id="renewGo">抽三张</button></div>
          <div class="grid-3 mt-16" id="renewOut"></div>
        `;
        paint();
        root.querySelector("#renewGo").addEventListener("click", paint);
      }
    }
  });
})();
