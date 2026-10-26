// Expected cost of a change = comprehension + p × predicted-change cost + (1 − p) × other-change cost.
(function (T) {
  var LMAX = 6;
  var understand = function (L) { return 1 + 0.6 * L + 0.1 * L * L; };
  var planned = function (L) { return 8 / (1 + L); };
  var other = function (L) { return 3 + 1.2 * L; };
  var expected = function (L, p) { return understand(L) + p * planned(L) + (1 - p) * other(L); };
  var NAMES = ["Interface", "Adapter", "Factory", "Strategy", "Plugin registry", "Config DSL"];

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A stack of abstraction layers next to a chart of the expected cost of making a change.",
    vars: [
      { key: "L", label: "Layers of abstraction", min: 0, max: LMAX, step: 1, value: 0, color: "var(--s1)", fmt: function (v) { return Math.round(v); } },
      { key: "p", label: "Chance the predicted change happens", min: 0, max: 1, step: 0.01, value: 0.2, color: "var(--s2)", fmt: function (v) { return Math.round(v * 100) + "%"; } }
    ],
    scenario: [
      { caption: "Simple, direct code. Every change costs about the same, and it's easy to follow.", set: { L: 0, p: 0.2 } },
      { caption: "Add layers \"in case we need to swap the database\"… when that's unlikely, every change gets slower.", set: { L: 5 }, dur: 2600, hold: 3200 },
      { caption: "If the change is near-certain, a little abstraction pays for itself…", set: { L: 0, p: 0.9 }, dur: 1600 },
      { caption: "…but only up to a point. Find the bottom of the curve, not the top of the stack.", set: { L: 2 }, dur: 1800, hold: 3200 },
      { caption: "Too much flexibility is its own kind of debt.", set: { L: 6 }, dur: 1800, hold: 3000 }
    ],
    setup: function (svg) {
      var el = T.el, sx = 30, sw = 200;
      el("rect", { x: sx, y: 30, width: sw, height: 26, rx: 6, fill: "var(--ink)" }, svg);
      el("text", { x: sx + sw / 2, y: 48, "text-anchor": "middle", "class": "t-label", text: "Your feature request", fill: "var(--bg)" }, svg);
      var layers = NAMES.map(function (n, i) {
        var g = el("g", {}, svg);
        var r = el("rect", { x: sx + 8, width: sw - 16, height: 24, rx: 6, fill: "var(--s1)", "fill-opacity": 0.14, stroke: "var(--s1)", "stroke-width": 1.5 }, g);
        var t = el("text", { x: sx + sw / 2, "text-anchor": "middle", "class": "t-small", text: n }, g);
        return { g: g, r: r, t: t };
      });
      var logic = el("rect", { x: sx, width: sw, height: 26, rx: 6, fill: "var(--s3)" }, svg);
      var logicT = el("text", { x: sx + sw / 2, "text-anchor": "middle", "class": "t-label", text: "The actual logic", fill: "var(--bg)" }, svg);
      var dot = el("circle", { r: 6, fill: "var(--s2)", cx: sx + sw - 18 }, svg);

      var c = T.chart(svg, { x: 300, y: 40, w: 310, h: 160, xDomain: [0, LMAX], yDomain: [0, 14], xLabel: "layers →", yLabel: "expected days per change" });
      var curve = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, c.g);
      var best = el("circle", { r: 5, fill: "none", stroke: "var(--good)", "stroke-width": 2.5 }, c.g);
      var bestT = el("text", { "class": "t-small", text: "sweet spot", fill: "var(--good)", "text-anchor": "middle" }, c.g);
      var mk = el("circle", { r: 7, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, c.g);

      var rows = [
        { label: "Understanding the code", fn: understand, col: "var(--muted)" },
        { label: "The change you predicted", fn: planned, col: "var(--s3)" },
        { label: "Any other change", fn: other, col: "var(--s2)" }
      ].map(function (r, i) {
        var y = 240 + i * 26;
        el("text", { x: 300, y: y + 11, "class": "t-small", text: r.label }, svg);
        r.bar = el("rect", { x: 450, y: y, height: 14, rx: 3, fill: r.col }, svg);
        r.val = el("text", { y: y + 11, "class": "t-small t-mono" }, svg);
        return r;
      });

      return function (s, t) {
        var L = Math.round(s.L), y = 66;
        layers.forEach(function (ly, i) {
          var on = i < L;
          ly.g.style.display = on ? "" : "none";
          if (on) { T.set(ly.r, { y: y }); T.set(ly.t, { y: y + 16 }); y += 30; }
        });
        T.set(logic, { y: y + 4 }); T.set(logicT, { y: y + 21 });
        var travel = (t % 2400) / 2400;
        T.set(dot, { cy: T.lerp(43, y + 17, T.ease(travel)), opacity: travel > 0.92 ? 0 : 1 });

        T.set(curve, { d: c.path(function (x) { return expected(x, s.p); }) });
        var bl = 0, bv = 1e9;
        for (var i = 0; i <= LMAX; i++) { var v = expected(i, s.p); if (v < bv) { bv = v; bl = i; } }
        T.set(best, { cx: c.px(bl), cy: c.py(bv) });
        T.set(bestT, { x: c.px(bl), y: c.py(bv) + 20 });
        T.set(mk, { cx: c.px(s.L), cy: c.py(expected(s.L, s.p)) });
        rows.forEach(function (r) {
          var v = r.fn(s.L);
          T.set(r.bar, { width: T.clamp(v / 12, 0, 1) * 140 });
          T.set(r.val, { x: 456 + T.clamp(v / 12, 0, 1) * 140, text: v.toFixed(1) + "d" });
        });
      };
    }
  });
})(window.Tradeoff);
