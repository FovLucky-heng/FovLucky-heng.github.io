/* core/reveal.js —— 滚动入场、阅读进度、数字滚动 */
(function () {
  "use strict";
  const L5 = window.L5;

  const { $, $$ } = L5;

  let io = null;

  const reduced = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initReveal() {
    const items = $$(".reveal:not(.is-in)");
    if (!items.length) return;
    if (!("IntersectionObserver" in window) || reduced()) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    if (!io) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("is-in");
              io.unobserve(en.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
    }
    items.forEach((el) => io.observe(el));
  }

  /* ---------- 顶部阅读进度条 ---------- */
  function initScrollProgress() {
    if (document.querySelector(".scroll-progress")) return;
    if (reduced()) return;

    const bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    let ticking = false;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const ratio = max > 0 ? Math.min(doc.scrollTop / max, 1) : 0;
      bar.style.transform = `scaleX(${ratio})`;
      ticking = false;
    };
    update();
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", update, { passive: true });
  }

  /* ---------- 数字滚动（0 → 目标值） ---------- */
  function countUp(el, target, duration = 900) {
    if (!el) return;
    const end = Number(target) || 0;
    if (reduced() || end === 0) {
      el.textContent = String(end);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(end * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* 页面上所有带 data-count 的元素：进入视口时跑一次 */
  function initCounters(root = document) {
    const nodes = Array.from(root.querySelectorAll("[data-count]"));
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window) || reduced()) {
      nodes.forEach((el) => (el.textContent = el.dataset.count));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          countUp(en.target, en.target.dataset.count);
          obs.unobserve(en.target);
        });
      },
      { threshold: 0.4 }
    );
    nodes.forEach((el) => obs.observe(el));
  }

  Object.assign(L5, { initReveal, initScrollProgress, initCounters, countUp });
})();
