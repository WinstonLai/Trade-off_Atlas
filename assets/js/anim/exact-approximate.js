// Sampling error shrinks with √n while compute grows with n.
(function (T) {
  var N = 1e6, P = 0.4, MINF = 0.002;
  var frac = function (x) { return MINF * Math.pow(1 / MINF, x); };
  var xOf = function (f) { return Math.log(f / MINF) / Math.log(1 / MINF); };
  var err = function (f) { return 1.96 * Math.sqrt(P * (1 - P) / (f * N)) * Math.sqrt(Math.max(0, 1 - f)); };
  var secs = function (f) { return 0.4 + 90 * f; };
  var pct = function (f) { return f >= 0.1 ? Math.round(f * 100) + "%" : (f * 100).toFixed(f < 0.01 ? 1 : 0) + "%"; };

  // fixed pseudo-random order so sampled dots scatter across the grid
  var COLS = 24, ROWS = 10, ORDER = [];
  for (var i = 0; i < COLS * ROWS; i++) ORDER.push(i);
  var seed = 7;
  for (var j = ORDER.length - 1; j > 0; j--) { seed = (seed * 9301 + 49297) % 233280; var k = Math.floor(seed / 233280 * (j + 1)); var tmp = ORDER[j]; ORDER[j] = ORDER[k]; ORDER[k] = tmp; }
  var RANK = [];
  ORDER.forEach(function (cell, r) { RANK[cell] = r; });

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A grid of data rows with a sample highlighted, an estimate with its error band, and a chart of error against compute.",
    vars: [
      { key: "x", label: "Sample size (of 1 million rows)", min: 0, max: 1, step: 0.005, value: 0, color: "var(--s1)", fmt: function (v) { return pct(frac(v)); } }
    ],
    scenario: [
      { caption: "Sample 0.2% of rows: an answer in under a second, within about ±2 points.", set: { x: 0 }, hold: 3200 },
      { caption: "5× the data: the error roughly halves.", set: { x: xOf(0.01) }, dur: 1800, hold: 3000 },
      { caption: "10× more again: only about 3× more precise. Diminishing returns.", set: { x: xOf(0.1) }, dur: 1800, hold: 3200 },
      { caption: "The exact answer costs 500× the compute of the first sample, for a decision that might not change.", set: { x: 1 }, dur: 1800, hold: 3800 }
    ],
    setup: function (svg) {
      var el = T.el, gx = 30, gy = 46, sp = 11;
      el("text", { x: gx, y: 30, "class": "t-label", text: "Rows in the table" }, svg);
      var dots = [];
      for (var i = 0; i < COLS * ROWS; i++) dots.push(el("circle", { cx: gx + 5 + (i % COLS) * sp, cy: gy + Math.floor(i / COLS) * sp, r: 3.5 }, svg));
      var nTxt = el("text", { x: gx, y: gy + ROWS * sp + 10, "class": "t-small" }, svg);

      // estimate line
      var lx = 30, lw = 260, ly = 220, lo = 0.35, hi = 0.45;
      var sx = function (v) { return lx + (T.clamp(v, lo, hi) - lo) / (hi - lo) * lw; };
      el("text", { x: lx, y: 186, "class": "t-label", text: "Estimated conversion rate" }, svg);
      el("line", { x1: lx, x2: lx + lw, y1: ly, y2: ly, stroke: "var(--line)", "stroke-width": 2 }, svg);
      [0.35, 0.4, 0.45].forEach(function (v) { el("text", { x: sx(v), y: ly + 20, "text-anchor": "middle", "class": "t-small", text: Math.round(v * 100) + "%" }, svg); });
      var band = el("rect", { y: ly - 10, height: 20, rx: 6, fill: "var(--s1)", "fill-opacity": 0.2 }, svg);
      el("line", { x1: sx(P), x2: sx(P), y1: ly - 16, y2: ly + 8, stroke: "var(--ink)", "stroke-width": 1.5, "stroke-dasharray": "3 2" }, svg);
      var est = el("circle", { cy: ly, r: 6, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2 }, svg);
      var estT = el("text", { x: lx, y: 270, "class": "t-mid" }, svg);
      var timeT = el("text", { x: lx, y: 292, "class": "t-small" }, svg);

      var c = T.chart(svg, { x: 360, y: 46, w: 250, h: 210, xDomain: [0, 1], yDomain: [0, 0.025], xLabel: "compute (rows scanned) →", yLabel: "error (±)" });
      el("path", { d: c.path(function (f) { return err(Math.max(f, MINF)); }, MINF, 1, 160), fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, c.g);
      var cost = el("rect", { y: c.h, height: 6, fill: "var(--s2)" }, c.g);
      var mk = el("circle", { r: 7, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, c.g);
      var mkT = el("text", { "class": "t-small t-mono" }, c.g);

      var noise = 0, lastDraw = -1;
      return function (s, t) {
        var f = frac(s.x), e = err(f), n = Math.round(f * N);
        var shown = Math.max(1, Math.round(f * COLS * ROWS));
        for (var i = 0; i < dots.length; i++) {
          var on = RANK[i] < shown;
          T.set(dots[i], { fill: on ? "var(--s1)" : "var(--line)", r: on ? 4 : 3 });
        }
        T.set(nTxt, { text: "Each dot ≈ 4,000 rows · sampling " + n.toLocaleString() + " rows (" + pct(f) + ")" });
        var tick = Math.floor(t / 900);
        if (tick !== lastDraw) { lastDraw = tick; noise = Math.sin(tick * 12.9898) * 0.75; }
        var v = P + noise * e;
        T.set(band, { x: sx(P - e), width: Math.max(2, sx(P + e) - sx(P - e)) });
        T.set(est, { cx: sx(v) });
        T.set(estT, { text: e < 0.0005 ? "40.0% (exact)" : (v * 100).toFixed(1) + "% ± " + (e * 100).toFixed(1) + " pts" });
        T.set(timeT, { text: "Query time ≈ " + (secs(f) < 10 ? secs(f).toFixed(1) : Math.round(secs(f))) + " s · " + Math.round(f / MINF) + "× the smallest sample's compute" });
        T.set(cost, { x: 0, width: c.px(f) });
        T.set(mk, { cx: c.px(f), cy: c.py(e) });
        T.set(mkT, { x: c.px(f) + (f > 0.7 ? -10 : 10), y: c.py(e) - 10, "text-anchor": f > 0.7 ? "end" : "start", text: "±" + (e * 100).toFixed(2) + " pts" });
      };
    }
  });
})(window.Tradeoff);
