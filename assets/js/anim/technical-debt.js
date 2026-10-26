// Velocity starts higher with shortcuts but decays as debt accrues "interest".
// Refactoring time costs speed now and slows the decay.
(function (T) {
  var W = 52;
  var params = function (s, r) { return { a: (1 + 0.5 * s) * (1 - r), k: 0.045 * s * Math.max(0, 1 - 2.2 * r) }; };
  var vel = function (p, t) { return p.a * Math.exp(-p.k * t); };
  var cum = function (p, t) { return p.k < 1e-6 ? p.a * t : p.a * (1 - Math.exp(-p.k * t)) / p.k; };
  var CLEAN = { a: 1, k: 0 };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Cumulative features delivered over a year by a team taking shortcuts compared with a clean team.",
    vars: [
      { key: "s", label: "Shortcuts taken", min: 0, max: 1, step: 0.01, value: 0.8, color: "var(--s2)", fmt: function (v) { return v < 0.05 ? "none" : v < 0.4 ? "some" : v < 0.75 ? "many" : "lots"; } },
      { key: "r", label: "Time spent paying debt down", min: 0, max: 0.4, step: 0.01, value: 0, color: "var(--s3)", fmt: function (v) { return Math.round(v * 100) + "%"; } },
      { key: "h", label: "Time horizon", min: 2, max: W, step: 1, value: 6, color: "var(--s1)", fmt: function (v) { return Math.round(v) + " weeks"; } }
    ],
    scenario: [
      { caption: "Shortcuts make the first weeks faster. You're ahead of the clean team.", set: { s: 0.8, r: 0, h: 8 }, dur: 1800 },
      { caption: "But every shortcut adds friction. Speed drops as the debt piles up.", set: { h: 22 }, dur: 2600 },
      { caption: "After a year, the clean team has shipped far more.", set: { h: 52 }, dur: 2600, hold: 3200 },
      { caption: "Pay a little interest each sprint (refactoring) and speed holds up.", set: { r: 0.3 }, dur: 2000, hold: 3400 },
      { caption: "A deliberate shortcut can still be worth it when the horizon is short, like a prototype or a deadline.", set: { r: 0, h: 10 }, dur: 2000, hold: 3600 }
    ],
    setup: function (svg) {
      var el = T.el;
      var c = T.chart(svg, { x: 40, y: 40, w: 320, h: 230, xDomain: [0, W], yDomain: [0, 60], xLabel: "weeks →", yLabel: "features shipped (total)" });
      var clean = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, c.g);
      var debt = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 3 }, c.g);
      var ghost = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 1.5, "stroke-dasharray": "4 5", opacity: 0.35 }, c.g);
      var cur = el("line", { y1: 0, y2: c.h, stroke: "var(--muted)", "stroke-dasharray": "3 3" }, c.g);
      var dC = el("circle", { r: 5, fill: "var(--s1)" }, c.g);
      var dD = el("circle", { r: 6, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2 }, c.g);
      var lC = el("text", { "class": "t-small", text: "clean", fill: "var(--s1)" }, c.g);
      var lD = el("text", { "class": "t-small", text: "with shortcuts", fill: "var(--s2)" }, c.g);

      // right panel: debt pile and current speed
      var px = 490;
      el("text", { x: px, y: 50, "class": "t-label", text: "Debt pile" }, svg);
      var blocks = [];
      for (var i = 0; i < 10; i++) blocks.push(el("rect", { x: px + (i % 2) * 36 + (Math.floor(i / 2) % 2) * 10, y: 190 - Math.floor(i / 2) * 26, width: 32, height: 22, rx: 4, fill: "var(--s2)" }, svg));
      el("line", { x1: px - 6, x2: px + 96, y1: 214, y2: 214, stroke: "var(--line)", "stroke-width": 2 }, svg);
      el("text", { x: px, y: 246, "class": "t-label", text: "Speed now" }, svg);
      var speed = el("text", { x: px, y: 274, "class": "t-big" }, svg);
      var speed2 = el("text", { x: px, y: 294, "class": "t-small" }, svg);
      var lead = el("text", { x: 56, y: 62, "class": "t-mid" }, svg);
      var lead2 = el("text", { x: 56, y: 80, "class": "t-small" }, svg);

      return function (s) {
        var p = params(s.s, s.r), h = s.h;
        T.set(clean, { d: c.path(function (t) { return cum(CLEAN, t); }, 0, h) });
        T.set(debt, { d: c.path(function (t) { return cum(p, t); }, 0, h) });
        T.set(ghost, { d: c.path(function (t) { return cum(p, t); }, h, W) });
        var yc = cum(CLEAN, h), yd = cum(p, h);
        T.set(cur, { x1: c.px(h), x2: c.px(h) });
        T.set(dC, { cx: c.px(h), cy: c.py(Math.min(yc, 60)) });
        T.set(dD, { cx: c.px(h), cy: c.py(Math.min(yd, 60)) });
        var up = yd > yc;
        T.set(lC, { x: c.px(h) + 8, y: c.py(Math.min(yc, 60)) + (up ? 14 : -6) });
        T.set(lD, { x: c.px(h) + 8, y: c.py(Math.min(yd, 60)) + (up ? -6 : 14) });
        var pile = Math.round(T.clamp(s.s * (1 - 2.2 * s.r) * h / 5, 0, 10));
        blocks.forEach(function (b, i) { b.style.display = i < pile ? "" : "none"; });
        var v = vel(p, h);
        T.set(speed, { text: Math.round(v * 100) + "%", fill: v < 0.7 ? "var(--bad)" : v < 0.95 ? "var(--warn)" : "var(--ink)" });
        T.set(speed2, { text: "of the clean team's pace" });
        var diff = yd - yc;
        T.set(lead, { text: (diff >= 0 ? "+" : "−") + Math.abs(diff).toFixed(0) + " features", fill: diff >= 0 ? "var(--good)" : "var(--bad)" });
        T.set(lead2, { text: diff >= 0 ? "ahead of clean" : "behind clean" });
      };
    }
  });
})(window.Tradeoff);
