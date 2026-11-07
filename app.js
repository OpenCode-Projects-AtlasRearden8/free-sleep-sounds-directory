// Free Sleep Sounds Directory — rendering + interactions.
// No frameworks, no build step, no network calls (besides user-clicked links).

(function () {
  "use strict";

  const state = {
    category: "all",
    focusOnly: false,
    focusOpen: false,
  };

  const qs = (sel, el) => (el || document).querySelector(sel);
  const qsa = (sel, el) => Array.prototype.slice.call((el || document).querySelectorAll(sel));

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function catLabel(id) {
    const c = window.CATEGORIES.find(function (x) {
      return x.id === id;
    });
    return c ? c.label : id;
  }

  function card(s) {
    const link =
      s.url != null
        ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Open ${esc(s.type)} &#8599;</a>`
        : `<span class="badge badge-local">Built in &mdash; see Sleep Timer panel</span>`;
    const badges = [
      s.focusPick ? '<span class="badge badge-focus" title="recommended in the ADHD focus edition">focus pick</span>' : "",
      s.asmrSafe ? '<span class="badge" title="sounds only, no talking in the source content">asmr-safe</span>' : "",
    ].join("");
    const cats = s.categories.map(function (c) {
      return esc(catLabel(c));
    });
    return (
      `<article class="card${s.focusPick ? " card-focus" : ""}" data-id="${esc(s.id)}">` +
      `<h3>${esc(s.name)}</h3>` +
      `<div class="badges">${badges}<span class="badge">${esc(s.type)}</span>` +
      (s.length ? `<span class="badge">${esc(s.length)}</span>` : "") +
      `</div>` +
      `<p class="notes">${esc(s.notes)}</p>` +
      `<p class="tags">${cats.join(" &middot; ")}</p>` +
      `<div class="card-actions">${link}` +
      `<span class="confirm">no signup &middot; free</span></div>` +
      `</article>`
    );
  }

  function render() {
    const grid = qs("#grid");
    const count = qs("#count");
    const sources = window.SOURCES.filter(function (s) {
      const matchCat = state.category === "all" || s.categories.indexOf(state.category) !== -1;
      const matchFocus = !state.focusOnly || s.focusPick;
      return matchCat && matchFocus;
    });
    grid.innerHTML = sources.map(card).join("");
    count.textContent = `${sources.length} of ${window.SOURCES.length} picks shown`;
  }

  function renderFocusPanel() {
    const picks = window.SOURCES.filter(function (s) {
      return s.focusPick;
    });
    const rows = picks
      .map(function (s) {
        return (
          `<li><strong>${esc(s.name)}</strong> &mdash; ` +
          (s.categories.indexOf("brown-noise") !== -1
            ? "steady low-frequency sound, good for tuning out chatter; "
            : "") +
          `works with the <a href="#timer">25-minute Sleep Timer</a> trick: play it, set the timer, one Pomodoro at a time.</li>`
        );
      })
      .join("");
    qs("#focus-list").innerHTML = rows;
  }

  function bindControls() {
    qsa(".cat-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.category = btn.dataset.cat || "all";
        qsa(".cat-btn").forEach(function (b) {
          b.classList.toggle("active", b === btn);
        });
        render();
      });
    });

    var focusToggle = qs("#focus-toggle");
    focusToggle.addEventListener("click", function () {
      state.focusOnly = !state.focusOnly;
      state.focusOpen = state.focusOnly;
      focusToggle.classList.toggle("active", state.focusOnly);
      focusToggle.setAttribute("aria-pressed", String(state.focusOnly));
      qs("#focus-panel").hidden = !state.focusOpen;
      render();
    });

    var focusClose = qs("#focus-close");
    focusClose.addEventListener("click", function () {
      state.focusOpen = false;
      qs("#focus-panel").hidden = true;
    });
  }

  /* ----------------------------- sleep timer UI ----------------------------- */

  function initPlayer() {
    var Engine = window.NoiseEngine;
    if (!Engine) return;
    var engine = new Engine();
    var startBtn = qs("#play");
    var stopBtn = qs("#stop");
    var mins = qs("#minutes");
    var vol = qs("#volume");
    var status = qs("#timer-status");

    engine.onState = function (st) {
      if (st.running && st.label) {
        status.textContent = `Playing &mdash; auto-stops in ${esc(st.label)}. Fade-out ends silence.`;
        status.innerHTML = status.textContent;
      } else if (st.running) {
        status.textContent = "Playing. No timer set &mdash; use Stop or set minutes.";
      } else {
        status.textContent = "Stopped.";
      }
    };

    startBtn.addEventListener("click", function () {
      var m = parseMinutes(mins.value || 45) || 45;
      mins.value = String(m);
      engine.start(m, Number(vol.value)).catch(function (e) {
        status.textContent = "Audio blocked by the browser — click Play once more.";
      });
    });
    stopBtn.addEventListener("click", function () {
      engine.stop();
    });
    vol.addEventListener("input", function () {
      engine.setVolume(Number(vol.value));
    });
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", function () {
      render();
      renderFocusPanel();
      bindControls();
      if (window.NoiseEngine) initPlayer();
    });
  }

  /* Reveal modules for Node-based smoke tests */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { esc: esc };
  }
})();
