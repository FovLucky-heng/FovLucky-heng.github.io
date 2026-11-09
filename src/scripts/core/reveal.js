/* core/reveal.js */
(function () {
  "use strict";
  const L5 = window.L5;

  const { $$ } = L5;

  let io = null;

  function initReveal() {
    const items = $$(".reveal:not(.is-in)");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
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

  Object.assign(L5, { initReveal });
})();
