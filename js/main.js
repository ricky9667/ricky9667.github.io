(() => {
  "use strict";

  const LONG_PRESS_MS = 450;
  const SCRAMBLE_TICK_MS = 35;
  const TICKS_PER_MOVE = 2;
  const FACES = ["U", "D", "R", "L", "F", "B"]; // pairs share an axis: U/D, R/L, F/B
  const MODIFIERS = ["", "'", "2"];

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrowScreen = window.matchMedia("(max-width: 600px)");

  const randomInt = (max) => Math.floor(Math.random() * max);

  /** Fade elements in as they enter the viewport. */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    const show = (el) => el.classList.add("is-visible");

    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(show);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        show(entry.target);
        observer.unobserve(entry.target);
      }
    });
    items.forEach((el) => observer.observe(el));
  }

  /**
   * Header brand. With a mouse or keyboard, CSS expands it on hover/focus and a
   * click follows the link. On touch there is no hover, so a long press expands
   * it and only a tap on the expanded brand follows the link.
   */
  function initBrand() {
    const brand = document.querySelector(".brand");
    if (!brand) return;

    let pressTimer = 0;
    let isTouch = false;
    let openedByThisPress = false;

    const isOpen = () => brand.classList.contains("is-open");
    const cancelPress = () => clearTimeout(pressTimer);

    brand.addEventListener("pointerdown", (event) => {
      isTouch = event.pointerType !== "mouse";
      openedByThisPress = false;
      if (!isTouch || isOpen()) return;

      pressTimer = setTimeout(() => {
        brand.classList.add("is-open");
        openedByThisPress = true;
      }, LONG_PRESS_MS);
    });

    for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
      brand.addEventListener(type, cancelPress);
    }

    // A long press would otherwise open the browser's link menu.
    brand.addEventListener("contextmenu", (event) => {
      if (isTouch) event.preventDefault();
    });

    brand.addEventListener("click", (event) => {
      if (isTouch && (openedByThisPress || !isOpen())) event.preventDefault();
      openedByThisPress = false;
    });

    document.addEventListener("pointerdown", (event) => {
      if (!brand.contains(event.target)) brand.classList.remove("is-open");
    });
  }

  /** Expose the pointer position to each card so CSS can centre its glow there. */
  function initCardGlow() {
    for (const card of document.querySelectorAll(".card")) {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        card.style.setProperty("--my", `${event.clientY - rect.top}px`);
      });
    }
  }

  /**
   * Random 3x3 scramble. Never turns the same face twice in a row, and never
   * makes three consecutive turns on one axis (e.g. U D U).
   */
  function generateScramble(length) {
    const axisOf = (face) => face >> 1;
    const moves = [];
    let last = -1;
    let beforeLast = -1;

    while (moves.length < length) {
      const face = randomInt(FACES.length);
      if (face === last) continue;
      if (beforeLast !== -1 && axisOf(face) === axisOf(last) && axisOf(face) === axisOf(beforeLast)) continue;

      moves.push(FACES[face] + MODIFIERS[randomInt(MODIFIERS.length)]);
      beforeLast = last;
      last = face;
    }
    return moves;
  }

  /** Show a scramble in the hero and re-roll it on demand. */
  function initScramble() {
    const output = document.getElementById("scramble");
    const button = document.getElementById("rescramble");
    if (!output || !button) return;

    let timer = 0;

    const roll = () => {
      const length = narrowScreen.matches ? 10 : 20;
      const target = generateScramble(length);
      clearInterval(timer);

      if (reducedMotion) {
        output.textContent = target.join(" ");
        return;
      }

      // Settle move by move from the left while the rest keeps shuffling.
      let ticks = 0;
      timer = setInterval(() => {
        ticks += 1;
        const settled = Math.floor(ticks / TICKS_PER_MOVE);
        const noise = generateScramble(length);
        output.textContent = target.map((move, i) => (i < settled ? move : noise[i])).join(" ");
        if (settled >= length) clearInterval(timer);
      }, SCRAMBLE_TICK_MS);
    };

    button.addEventListener("click", roll);
    roll();
  }

  function initFooterYear() {
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  initReveal();
  initBrand();
  initCardGlow();
  initScramble();
  initFooterYear();
})();
