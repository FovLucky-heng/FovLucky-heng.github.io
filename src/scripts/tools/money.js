/* tools/money.js —— money 栏目的工具 */
(function () {
  "use strict";
  const L5 = window.L5;
  const { KEY, store, ymd, $, esc, checklistHTML, bindChecklist } = L5;

  L5.tools.register({
/* -------- 月度预算 -------- */
    budget: {
      channel: "money",
      name: "月度预算模板",
      desc: "三类分账：先分，再花。",
      render(root) {
        const saved = store.get(KEY.budget, { income: 8000, fixed: 50, life: 30, future: 20 });

        const paint = () => {
          const income = Number(root.querySelector("#bIncome").value) || 0;
          let fixed = Number(root.querySelector("#bFixed").value) || 0;
          let life = Number(root.querySelector("#bLife").value) || 0;
          let future = Number(root.querySelector("#bFuture").value) || 0;
          const sum = fixed + life + future;
          const warn = sum === 100 ? "" : `注意：三类合计 ${sum}%，需要等于 100%。`;
          const amt = (p) => Math.round((income * p) / 100);

          root.querySelector("#bOut").innerHTML = `
            <div class="grid-3">
              <div><div class="stat">¥${amt(fixed).toLocaleString()}</div><div class="stat-label">固定支出 ${fixed}%</div></div>
              <div><div class="stat">¥${amt(life).toLocaleString()}</div><div class="stat-label">生活质量 ${life}%</div></div>
              <div><div class="stat">¥${amt(future).toLocaleString()}</div><div class="stat-label">未来储备 ${future}%</div></div>
            </div>
            <div class="split-bar mt-16">
              <i style="width:${fixed}%;background:#7591ac"></i>
              <i style="width:${life}%;background:#d9803f"></i>
              <i style="width:${future}%;background:#7c9a76"></i>
            </div>
            <div class="legend">
              <span><i style="background:#7591ac"></i>固定支出</span>
              <span><i style="background:#d9803f"></i>生活质量</span>
              <span><i style="background:#7c9a76"></i>未来储备</span>
            </div>
            <p class="hint mt-16">可支配（扣掉固定与储备后）：<b>¥${amt(life).toLocaleString()}</b></p>
            ${warn ? `<p class="hint" style="color:#d70015">${warn}</p>` : ""}
          `;
          store.set(KEY.budget, { income, fixed, life, future });
        };

        root.innerHTML = `
          <div class="grid-2">
            <label class="field">
              <span class="field__label">月收入（税后）</span>
              <input class="input" id="bIncome" type="number" min="0" step="100" value="${saved.income}" />
            </label>
            <label class="field">
              <span class="field__label">固定支出 %（房租/通勤/还款）</span>
              <input class="input" id="bFixed" type="number" min="0" max="100" value="${saved.fixed}" />
            </label>
            <label class="field">
              <span class="field__label">生活质量 %（吃饭/社交/衣服）</span>
              <input class="input" id="bLife" type="number" min="0" max="100" value="${saved.life}" />
            </label>
            <label class="field">
              <span class="field__label">未来储备 %（应急金/储蓄）</span>
              <input class="input" id="bFuture" type="number" min="0" max="100" value="${saved.future}" />
            </label>
          </div>
          <div id="bOut" class="mt-16"></div>
          <p class="hint mt-16">工资到账当天，先把「未来储备」转走，剩下的才是可花的。</p>
        `;
        paint();
        ["bIncome", "bFixed", "bLife", "bFuture"].forEach((id) => {
          root.querySelector("#" + id).addEventListener("input", paint);
        });
      }
    },

    /* -------- 记账 -------- */
    ledger: {
      channel: "money",
      name: "记账 & 结余计算",
      desc: "记一笔，知道钱去哪了。",
      render(root) {
        const cats = ["餐饮", "交通", "居住", "购物", "娱乐", "其他"];

        const paint = () => {
          const list = store.get(KEY.ledger, []);
          const month = ymd().slice(0, 7);
          const monthItems = list.filter((x) => x.date.slice(0, 7) === month);
          const total = monthItems.reduce((s, x) => s + Number(x.amount || 0), 0);
          const byCat = {};
          monthItems.forEach((x) => {
            byCat[x.cat] = (byCat[x.cat] || 0) + Number(x.amount || 0);
          });

          root.querySelector("#lgTotal").textContent = `¥${total.toLocaleString()}`;
          root.querySelector("#lgCount").textContent = `${monthItems.length} 笔`;
          root.querySelector("#lgCats").innerHTML = Object.keys(byCat).length
            ? Object.keys(byCat)
                .sort((a, b) => byCat[b] - byCat[a])
                .map(
                  (c) =>
                    `<div class="ledger-row"><span class="ledger-row__cat">${esc(
                      c
                    )}</span><span class="ledger-row__note"></span><span class="ledger-row__amt">¥${byCat[
                      c
                    ].toLocaleString()}</span></div>`
                )
                .join("")
            : `<p class="muted small">本月还没有记录。</p>`;

          root.querySelector("#lgList").innerHTML = monthItems.length
            ? monthItems
                .slice()
                .reverse()
                .slice(0, 12)
                .map(
                  (x) => `<div class="ledger-row">
                    <span class="ledger-row__cat">${esc(x.date.slice(5))}</span>
                    <span class="ledger-row__cat">${esc(x.cat)}</span>
                    <span class="ledger-row__note">${esc(x.note || "")}</span>
                    <span class="ledger-row__amt">¥${Number(x.amount).toLocaleString()}</span>
                    <button class="ledger-row__del" data-del="${x.id}">删除</button>
                  </div>`
                )
                .join("")
            : `<p class="muted small">还没有记录，从上面记第一笔。</p>`;
        };

        root.innerHTML = `
          <div class="grid-2">
            <label class="field">
              <span class="field__label">金额</span>
              <input class="input" id="lgAmt" type="number" min="0" step="0.01" placeholder="0.00" />
            </label>
            <label class="field">
              <span class="field__label">分类</span>
              <select class="select" id="lgCat">
                ${cats.map((c) => `<option>${c}</option>`).join("")}
              </select>
            </label>
          </div>
          <label class="field">
            <span class="field__label">备注（可选）</span>
            <input class="input" id="lgNote" placeholder="例：午饭" maxlength="30" />
          </label>
          <div class="row"><button class="btn btn--accent btn--sm" id="lgAdd">记一笔</button></div>

          <div class="grid-2 mt-32">
            <div class="card card--flat">
              <div class="eyebrow">本月支出</div>
              <div class="stat" id="lgTotal">¥0</div>
              <div class="stat-label" id="lgCount">0 笔</div>
            </div>
            <div class="card card--flat">
              <div class="eyebrow">分类合计</div>
              <div class="ledger-list" id="lgCats"></div>
            </div>
          </div>
          <h3 class="card__title mt-32" style="font-size:16px">最近记录</h3>
          <div class="ledger-list" id="lgList"></div>
        `;
        paint();

        root.querySelector("#lgAdd").addEventListener("click", () => {
          const amt = Number(root.querySelector("#lgAmt").value);
          if (!amt || amt <= 0) return;
          const list = store.get(KEY.ledger, []);
          list.push({
            id: "l" + Date.now() + Math.random().toString(36).slice(2, 6),
            date: ymd(),
            amount: amt,
            cat: root.querySelector("#lgCat").value,
            note: root.querySelector("#lgNote").value.trim()
          });
          store.set(KEY.ledger, list);
          root.querySelector("#lgAmt").value = "";
          root.querySelector("#lgNote").value = "";
          paint();
        });

        root.querySelector("#lgList").addEventListener("click", (e) => {
          const d = e.target.closest("[data-del]");
          if (!d) return;
          const list = store.get(KEY.ledger, []).filter((x) => x.id !== d.dataset.del);
          store.set(KEY.ledger, list);
          paint();
        });
      }
    },

    /* -------- 反诈清单 -------- */
    scam: {
      channel: "money",
      name: "反诈清单",
      desc: "这几种话术，见到就走。",
      render(root) {
        const items = [
          "承诺“保本 + 年化 10% 以上”",
          "让你下载陌生 App、进“内部群”",
          "要求先交保证金 / 解冻费",
          "限时名额，“今天不买就没了”",
          "让你把钱转到个人账户",
          "自称“老师 / 内部消息 / 稳赚”",
          "让你别告诉家人、别问别人"
        ];
        root.innerHTML = `
          <p class="hint">中任意一条，就停止转账。</p>
          <div class="mt-16">${checklistHTML("scam", items)}</div>
          <div class="callout mt-24">
            <span class="callout__label">已经被骗</span>
            立刻停止转账，保留聊天记录与转账凭证，拨打 110 或到就近派出所报案。越早，追回可能性越大。
          </div>
        `;
        bindChecklist(root, "scam");
      }
    }
  });
})();
