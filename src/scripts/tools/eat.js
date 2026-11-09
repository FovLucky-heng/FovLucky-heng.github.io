/* tools/eat.js —— eat 栏目的工具 */
(function () {
  "use strict";
  const L5 = window.L5;
  const { KEY, store, $, esc, checksStore, checklistHTML, bindChecklist } = L5;

  const RECIPES = {
    breakfast: [
      "全麦面包 + 煎蛋 + 一杯牛奶",
      "燕麦粥 + 香蕉 + 一小把坚果",
      "豆浆 + 菜包 + 一个白煮蛋",
      "酸奶 + 蓝莓 + 全麦脆片",
      "小米粥 + 凉拌黄瓜 + 鸡蛋"
    ],
    lunch: [
      "番茄鸡胸意面 + 一份绿叶菜",
      "杂粮饭 + 清蒸鱼 + 西兰花",
      "牛肉荞麦面 + 一份小油菜",
      "鸡肉沙拉（酱汁单独）+ 全麦卷",
      "虾仁炒饭 + 紫菜蛋花汤"
    ],
    dinner: [
      "豆腐白菜煲 + 半碗米饭",
      "烤鸡腿 + 烤南瓜 + 生菜沙拉",
      "三文鱼 + 藜麦 + 芦笋",
      "鸡蛋羹 + 清炒时蔬 + 小份米饭",
      "菌菇汤面 + 一份凉拌菠菜"
    ]
  };
  const DAY_NAMES = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function defaultRecipe() {
    return DAY_NAMES.map((d) => ({
      day: d,
      breakfast: pick(RECIPES.breakfast),
      lunch: pick(RECIPES.lunch),
      dinner: pick(RECIPES.dinner)
    }));
  }

  L5.tools.register({
/* -------- 一周食谱 -------- */
    recipe: {
      channel: "eat",
      name: "一周食谱生成器",
      desc: "解决“今天吃什么”，21 顿直接排好。",
      render(root) {
        let plan = store.get(KEY.recipe, null);
        if (!Array.isArray(plan) || plan.length !== 7) {
          plan = defaultRecipe();
          store.set(KEY.recipe, plan);
        }
        const paint = () => {
          root.querySelector("#recipeGrid").innerHTML = plan
            .map(
              (d, i) => `<div class="day-card">
                <div class="day-card__name">
                  <span>${esc(d.day)}</span>
                  <button class="reroll" data-reroll="${i}">换一组</button>
                </div>
                <div class="meal"><b>早</b><span>${esc(d.breakfast)}</span></div>
                <div class="meal"><b>午</b><span>${esc(d.lunch)}</span></div>
                <div class="meal"><b>晚</b><span>${esc(d.dinner)}</span></div>
              </div>`
            )
            .join("");
        };
        root.innerHTML = `
          <div class="row" style="justify-content:space-between">
            <p class="hint">每顿都凑齐「蔬菜 + 蛋白质 + 主食」，就已经达标。</p>
            <div class="row">
              <button class="btn btn--ghost btn--sm" id="recipeRerollAll">全部重排</button>
              <a class="btn btn--ghost btn--sm" href="eat.html">看看健康吃</a>
            </div>
          </div>
          <div class="grid-2 mt-16" id="recipeGrid" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))"></div>
        `;
        paint();
        root.addEventListener("click", (e) => {
          const single = e.target.closest("[data-reroll]");
          if (single) {
            const i = Number(single.dataset.reroll);
            plan[i] = {
              day: plan[i].day,
              breakfast: pick(RECIPES.breakfast),
              lunch: pick(RECIPES.lunch),
              dinner: pick(RECIPES.dinner)
            };
            store.set(KEY.recipe, plan);
            paint();
            return;
          }
          if (e.target.id === "recipeRerollAll") {
            plan = defaultRecipe();
            store.set(KEY.recipe, plan);
            paint();
          }
        });
      }
    },

    /* -------- 外卖自检 -------- */
    takeout: {
      channel: "eat",
      name: "外卖选择清单",
      desc: "点单前 5 秒自检，比算热量有用。",
      render(root) {
        const items = [
          "这一单里有真正的蔬菜吗？",
          "有蛋白质吗（蛋 / 肉 / 豆腐）？",
          "主食能不能减半？",
          "饮料换成无糖的？",
          "不做“纯度挑战”（炒饭 + 奶茶这类组合）？"
        ];
        root.innerHTML = `
          <p class="hint">点单前逐条过一遍，过 3 条以上这顿就及格。</p>
          <div class="mt-16">${checklistHTML("takeout", items)}</div>
          <p class="hint mt-16">达标 <span data-progress="takeout">0 / 5</span></p>
        `;
        bindChecklist(root, "takeout");
      }
    },

    /* -------- 采购清单 -------- */
    shopping: {
      channel: "eat",
      name: "一周采购清单",
      desc: "四类结构照着买，不用想。",
      render(root) {
        const groups = {
          "蛋白质": ["鸡蛋一盒", "鸡胸 / 鸡腿 2 份", "豆腐或豆干", "冷冻虾仁或鱼"],
          "蔬菜": ["耐放：西兰花、胡萝卜、洋葱", "快熟：菠菜、生菜、小青菜", "可生吃：黄瓜、圣女果"],
          "主食": ["米 / 杂粮米", "全麦面包或馒头", "冷冻面食（应急）"],
          "调味与兜底": ["生抽、醋、蒜、姜", "即食鸡胸或金枪鱼罐头", "无糖酸奶一盒"]
        };
        const items = [];
        let html = "";
        Object.keys(groups).forEach((g) => {
          html += `<h3 class="card__title mt-24" style="font-size:15px">${esc(g)}</h3>`;
          html += `<div class="mt-8">${checklistHTML(
            "shop-" + g,
            groups[g]
          )}</div>`;
          groups[g].forEach((x) => items.push(x));
        });
        root.innerHTML = `
          <p class="hint">共 ${items.length} 样，买完勾掉。清单每周只改两三个字。</p>
          ${html}
          <div class="row mt-24"><button class="btn btn--ghost btn--sm" id="shopReset">全部清空</button></div>
        `;
        Object.keys(groups).forEach((g) => bindChecklist(root, "shop-" + g));
        const reset = root.querySelector("#shopReset");
        reset.addEventListener("click", () => {
          const all = checksStore();
          Object.keys(all).forEach((k) => {
            if (k.indexOf("shop-") === 0) delete all[k];
          });
          store.set(KEY.checks, all);
          TOOLS.shopping.render(root);
        });
      }
    }
  });
})();
