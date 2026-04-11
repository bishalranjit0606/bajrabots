// Lightweight scroll-in animation (replaces Framer Motion at runtime)
(() => {
  const pad2 = (n) => String(n).padStart(2, "0");

  const startCountdowns = () => {
    const roots = Array.from(document.querySelectorAll("[data-countdown]"));
    if (!roots.length) return;

    // Static marketing tactic: always start from 2 days on each page load.
    const startMs = 2 * 24 * 60 * 60 * 1000;
    const startAt = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startAt;
      let left = startMs - elapsed;
      if (left <= 0) {
        // loop back to keep the "2 days left" urgency evergreen
        left = startMs;
      }

      const d = Math.floor(left / (24 * 60 * 60 * 1000));
      const h = Math.floor((left % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const m = Math.floor((left % (60 * 60 * 1000)) / (60 * 1000));
      const s = Math.floor((left % (60 * 1000)) / 1000);

      for (const root of roots) {
        const elD = root.querySelector("[data-countdown-part='d']");
        const elH = root.querySelector("[data-countdown-part='h']");
        const elM = root.querySelector("[data-countdown-part='m']");
        const elS = root.querySelector("[data-countdown-part='s']");
        if (elD) elD.textContent = pad2(d);
        if (elH) elH.textContent = pad2(h);
        if (elM) elM.textContent = pad2(m);
        if (elS) elS.textContent = pad2(s);
      }
    };

    tick();
    window.setInterval(tick, 1000);
  };

  const initPromoBar = () => {
    const bar = document.querySelector("[data-promo-bar]");
    if (!bar) return;
    const close = bar.querySelector("[data-promo-close]");
    const key = "bajra_promo_dismissed_v1";

    try {
      if (window.localStorage.getItem(key) === "1") {
        bar.style.display = "none";
        return;
      }
    } catch {
      // ignore storage failures; banner will show
    }

    if (!close) return;
    close.addEventListener("click", () => {
      bar.style.display = "none";
      try {
        window.localStorage.setItem(key, "1");
      } catch {
        // ignore
      }
    });
  };

  const initPricing = () => {
    const toggle = document.querySelector("[data-billing-toggle]");
    const root = document.querySelector("[data-pricing-root]");
    if (!toggle || !root) return;

    const WA = "https://wa.me/9779812241818";

    const durations = {
      "1m": { label: "1 Month", months: 1 },
      "3m": { label: "3 Months", months: 3 },
      "6m": { label: "6 Months", months: 6 },
      "1y": { label: "1 Year", months: 12 },
    };

    // Pricing matrix from your spec (monthly + total billed)
    const matrix = {
      starter: {
        "1m": { monthly: 999, compare: 1299, billed: 999, note: null },
        "3m": { monthly: 899, compare: null, billed: 2697, note: "Save 10%" },
        "6m": { monthly: 833, compare: null, billed: 4999, note: "Save 16%" },
        "1y": { monthly: 749, compare: null, billed: 8999, note: "Save 25%" },
      },
      growth: {
        "1m": { monthly: 1499, compare: 1949, billed: 1499, note: null },
        "3m": { monthly: 1399, compare: null, billed: 4197, note: "Save 7%" },
        "6m": { monthly: 1249, compare: null, billed: 7499, note: "Save 16%" },
        "1y": { monthly: 1083, compare: null, billed: 12999, note: "Save 28%" },
      },
      scale: {
        "1m": { monthly: 1999, compare: 2599, billed: 1999, note: null },
        "3m": { monthly: 1849, compare: null, billed: 5547, note: "Save 8%" },
        "6m": { monthly: 1666, compare: null, billed: 9999, note: "Save 16%" },
        "1y": { monthly: 1499, compare: null, billed: 17999, note: "Save 25%" },
      },
    };

    const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    const applyAnim = (el) => {
      if (!el) return;
      el.classList.remove("price-change");
      // Force reflow to restart animation
      el.offsetHeight;
      el.classList.add("price-change");
    };

    const setDuration = (key) => {
      const btns = Array.from(toggle.querySelectorAll("[data-duration]"));
      for (const b of btns) {
        const active = b.getAttribute("data-duration") === key;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      }

      /** @type {Array<"starter"|"growth"|"scale">} */
      const plans = ["starter", "growth", "scale"];
      for (const plan of plans) {
        const cfg = matrix[plan][key];
        const priceEl = root.querySelector(`[data-price="${plan}"]`);
        const compareEl = root.querySelector(`[data-compare="${plan}"]`);
        const billedEl = root.querySelector(`[data-billed="${plan}"]`);
        const waEl = root.querySelector(`[data-wa-link="${plan}"]`);

        if (priceEl) {
          priceEl.textContent = fmt(cfg.monthly);
          applyAnim(priceEl);
        }

        if (compareEl) {
          if (cfg.compare != null) {
            compareEl.style.display = "";
            compareEl.textContent = fmt(cfg.compare);
          } else if (cfg.note) {
            compareEl.style.display = "";
            compareEl.textContent = cfg.note;
          } else {
            compareEl.style.display = "none";
          }
          compareEl.classList.toggle("is-save", cfg.compare == null && Boolean(cfg.note));
          compareEl.classList.toggle("is-best", key === "1y" && cfg.compare == null && Boolean(cfg.note));
          // Ensure compare is struck only when it's a compare price (1m)
          compareEl.style.textDecoration = cfg.compare != null ? "line-through" : "none";
          applyAnim(compareEl);
        }

        if (billedEl) {
          billedEl.textContent = `Billed as ${fmt(cfg.billed)} NPR`;
          applyAnim(billedEl);
        }

        if (waEl) {
          const d = durations[key];
          const msg =
            `Hi Bajra Bots, I want the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.\n` +
            `Duration: ${d.label}\n` +
            `Effective monthly: ${fmt(cfg.monthly)} NPR/mo\n` +
            `Total billed: ${fmt(cfg.billed)} NPR\n` +
            `My business is: [type]`;
          waEl.setAttribute("href", `${WA}?text=${encodeURIComponent(msg)}`);
        }
      }
    };

    toggle.addEventListener("click", (e) => {
      const t = e.target instanceof Element ? e.target.closest("[data-duration]") : null;
      if (!t) return;
      const key = t.getAttribute("data-duration");
      if (!key || !(key in durations)) return;
      setDuration(key);
    });

    // default
    setDuration("1m");
  };

  const reveal = (el) => {
    el.classList.add("is-visible");
  };

  const initTypewriter = () => {
    const el = document.querySelector("[data-typewriter]");
    if (!el) return;

    const reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let words = [];
    try {
      words = JSON.parse(el.getAttribute("data-words") || "[]");
    } catch {
      words = [];
    }
    if (!Array.isArray(words) || words.length === 0) return;

    const typingMs = 62;
    const deletingMs = 34;
    const holdMs = 1350;
    const betweenWordsMs = 420;

    let w = 0;
    let i = 0;
    let dir = 1; // 1 typing, -1 deleting

    const tick = () => {
      const word = String(words[w] ?? "");

      i += dir;
      if (i < 0) i = 0;
      el.textContent = word.slice(0, i);

      // finished typing
      if (dir === 1 && i >= word.length) {
        dir = -1;
        window.setTimeout(tick, holdMs);
        return;
      }

      // finished deleting
      if (dir === -1 && i === 0) {
        dir = 1;
        w = (w + 1) % words.length;
        window.setTimeout(tick, betweenWordsMs);
        return;
      }

      window.setTimeout(tick, dir === 1 ? typingMs : deletingMs);
    };

    // start after initial paint
    window.setTimeout(tick, 450);
  };

  const init = () => {
    const els = Array.from(document.querySelectorAll("[data-animate='fade-up']"));
    if (!("IntersectionObserver" in window)) {
      els.forEach(reveal);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target;
          reveal(el);
          io.unobserve(el);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    els.forEach((el) => io.observe(el));

    startCountdowns();
    initPromoBar();
    initPricing();
    initTypewriter();

    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

