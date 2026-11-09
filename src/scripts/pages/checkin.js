/* pages/checkin.js */
(function () {
  "use strict";
  const L5 = window.L5;
  const { MOODS, ymd, WEEK_CN, lastNDays, $, $$, esc, dailyMap, streak, totalCheckinDays, moods, initReveal, hydrateDaily } = L5;

  function renderCheckin() {
    const root = $("#checkinRoot");
    if (!root) return;

    const days = lastNDays(7);
    const weekHtml = days
      .map((d) => {
        const k = ymd(d);
        const rec = dailyMap()[k] || {};
        const n = Object.keys(rec).filter((x) => rec[x]).length;
        const isToday = k === ymd();
        return `<div class="week__day ${isToday ? "is-today" : ""} ${
          n ? "is-done" : ""
        }">
          ${WEEK_CN[d.getDay()]}<span class="week__dot">${n || ""}</span>
        </div>`;
      })
      .join("");

    const todayMood = moods.get();

    root.innerHTML = `
      <div class="checkin-hero wrap">
        <span class="streak" id="checkinStreak">连续打卡 <b>${streak()}</b> 天 · 累计 <b>${totalCheckinDays()}</b> 天</span>
        <h1 class="h-section" style="margin-top:22px">今天，做了几件小事？</h1>
        <p class="sub-section" style="margin:12px auto 0">不用全做，挑一件也算今天没白过。</p>
      </div>

      <div class="wrap">
        <div class="section-head" style="margin-bottom:16px">
          <h2 class="card__title">今日五件小事</h2>
        </div>
        <div class="daily" id="dailyList"></div>
        <div class="daily__progress" id="dailyProgress"></div>

        <div class="card mt-32 reveal">
          <h2 class="card__title">今天的心情天气</h2>
          <p class="card__desc">不用写字，选一个就好。</p>
          <div class="mood-row mt-16" id="moodRow">
            ${MOODS.map(
              (m) =>
                `<button class="mood-btn" data-mood="${m.id}" aria-pressed="${
                  todayMood === m.id
                }"><span aria-hidden="true">${m.icon}</span>${m.label}</button>`
            ).join("")}
          </div>
        </div>

        <div class="card mt-16 reveal">
          <h2 class="card__title">最近 7 天</h2>
          <div class="week">${weekHtml}</div>
        </div>

        <div class="row mt-24" style="gap:12px">
          <a class="btn btn--ghost" href="tools.html">顺手用个工具</a>
          <a class="btn btn--quiet" href="me.html">查看我的记录 ›</a>
        </div>
      </div>
    `;

    hydrateDaily($("#dailyList"), $("#dailyProgress"));

    /* 勾选后同步刷新"连续打卡 / 累计"和今天的格子 */
    const refreshStats = () => {
      const el = $("#checkinStreak");
      if (el) {
        el.innerHTML = `连续打卡 <b>${streak()}</b> 天 · 累计 <b>${totalCheckinDays()}</b> 天`;
      }
      const cell = document.querySelector(".week__day.is-today");
      if (cell) {
        const rec = dailyMap()[ymd()] || {};
        const n = Object.keys(rec).filter((x) => rec[x]).length;
        cell.classList.toggle("is-done", n > 0);
        const dot = cell.querySelector(".week__dot");
        if (dot) dot.textContent = n || "";
      }
    };
    $("#dailyList").addEventListener("l5:daily", refreshStats);

    $("#moodRow").addEventListener("click", (e) => {
      const b = e.target.closest("[data-mood]");
      if (!b) return;
      const set = moods.set(b.dataset.mood);
      $$("[data-mood]").forEach((x) =>
        x.setAttribute("aria-pressed", String(x.dataset.mood === set))
      );
    });

    initReveal();
  }

  Object.assign(L5, { renderCheckin });
})();
