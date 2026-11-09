/* pages/me.js */
(function () {
  "use strict";
  const L5 = window.L5;
  const { MOODS, KEY, $, esc, findArticle, favs, articleCard, streak, totalCheckinDays, moods, initReveal } = L5;

  function renderMe() {
    const root = $("#meRoot");
    if (!root) return;

    const favSlugs = favs.list();
    const favItems = favSlugs.map(findArticle).filter(Boolean);

    const moodMap = moods.all();
    const moodDays = Object.keys(moodMap).sort().reverse().slice(0, 7);
    const moodHtml = moodDays.length
      ? moodDays
          .map((k) => {
            const m = MOODS.find((x) => x.id === moodMap[k]);
            return `<div class="ledger-row">
              <span class="ledger-row__cat">${k.slice(5)}</span>
              <span class="ledger-row__note">心情天气</span>
              <span>${m ? m.icon + " " + m.label : ""}</span>
            </div>`;
          })
          .join("")
      : `<p class="muted small">还没有记录。去<a href="checkin.html">今日打卡</a>选一个心情天气。</p>`;

    root.innerHTML = `
      <div class="wrap section">
        <div class="section-head">
          <span class="eyebrow">我的</span>
          <h1 class="h-section">你留下的痕迹</h1>
          <p class="sub-section">所有数据只存在这台设备上，不会上传到任何服务器。</p>
        </div>

        <div class="grid-3">
          <div class="card">
            <div class="stat">${streak()}</div>
            <div class="stat-label">连续打卡天数</div>
          </div>
          <div class="card">
            <div class="stat">${totalCheckinDays()}</div>
            <div class="stat-label">累计打卡天数</div>
          </div>
          <div class="card">
            <div class="stat">${favItems.length}</div>
            <div class="stat-label">收藏的文章</div>
          </div>
        </div>

        <div class="section-head mt-32">
          <h2 class="h-sub">我的收藏</h2>
        </div>
        <div class="grid-3" id="favGrid"></div>

        <div class="grid-2 mt-32">
          <div class="card">
            <h2 class="card__title">最近的心情天气</h2>
            <div class="ledger-list">${moodHtml}</div>
          </div>
          <div class="card">
            <h2 class="card__title">数据</h2>
            <p class="card__desc">清除后，打卡、收藏、心情和记账记录都会消失，无法恢复。</p>
            <div class="card__foot">
              <button class="btn btn--ghost btn--sm" id="clearAll">清除本机数据</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const favGrid = $("#favGrid");
    if (favGrid) {
      favGrid.innerHTML = favItems.length
        ? favItems.map(articleCard).join("")
        : `<p class="muted small">还没有收藏。在文章里点「♡ 收藏」，就会出现在这里。</p>`;
    }

    const clearBtn = $("#clearAll");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (!confirm("确定清除本机所有数据？此操作不可恢复。")) return;
        Object.values(KEY).forEach((k) => {
          try {
            localStorage.removeItem(k);
          } catch (e) {}
        });
        location.reload();
      });
    }
    initReveal();
  }

  Object.assign(L5, { renderMe });
})();
