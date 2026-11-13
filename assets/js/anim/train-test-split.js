// N labelled rows are split into training and test sets. The model's true error falls with more training rows (a learning curve),
// and the test score's 95% margin falls with more test rows. "Error you could defend" is the true error plus that margin.
(function (T) {
  var NS = { s: 200, m: 2000, l: 100000 };
  var err = function (n) { return 0.08 + 1.2 / Math.sqrt(n); };
  var modelErr = function (t, d) { return err(NS[d] * (1 - t)); };
  var margin = function (t, d) { var e = modelErr(t, d), nt = NS[d] * t; return 1.96 * Math.sqrt(e * (1 - e) / nt); };
  var bound = function (t, d) { return modelErr(t, d) + margin(t, d); };
  var best = function (d) { var bt = 0.05, bb = Infinity; for (var t = 0.05; t <= 0.6001; t += 0.005) { var b = bound(t, d); if (b < bb) { bb = b; bt = t; } } return bt; };
  var BEST = { s: best("s"), m: best("m"), l: best("l") };
  var pct = function (x) { return (x * 100).toFixed(1) + "%"; };
  var commas = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A grid of one hundred squares split between training and test data, the model's error and the margin of its test score, and curves of both against the share of data held back for testing.",
    vars: [
      { key: "t", label: "Share held back for testing", min: 0.05, max: 0.6, step: 0.01, value: 0.05, color: "var(--s2)", fmt: function (v) { return Math.round(v * 100) + "%"; } },
      { key: "d", label: "How much labelled data?", type: "choice", value: "m",
        options: [{ value: "s", label: "200 rows" }, { value: "m", label: "2,000 rows" }, { value: "l", label: "100,000 rows" }] }
    ],
    scenario: [
      { caption: "Hold back only 5% and nearly all the data trains the model, but 100 test rows can't measure it: the score could be off by about six points.", set: { t: 0.05, d: "m" }, hold: 4400 },
      { caption: "The familiar 80/20 split. The model has plenty to learn from and the score is reasonably steady.", set: { t: 0.2 }, dur: 2400, hold: 3800 },
      { caption: "Hold back 60%: the score is precise, but it describes a weaker model. Anywhere from about 20% to 60% the overall picture barely changes. It's the extremes that hurt.", set: { t: 0.6 }, dur: 2600, hold: 4800 },
      { caption: "With only 200 rows every split hurts: either a noisy score or a starved model. A single split is the wrong tool here; use cross-validation.", set: { d: "s", t: 0.3 }, dur: 2200, hold: 4800 },
      { caption: "With 100,000 rows both curves are nearly flat. The split barely matters, so don't agonise over it.", set: { d: "l", t: 0.2 }, dur: 2200, hold: 4200 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, CELL = 15, GAP = 2;
      el("text", { x: x0, y: 30, "class": "t-label", text: "Your labelled data (each square is 1%)" }, svg);
      var cells = [];
      for (var i = 0; i < 100; i++) {
        var c = Math.floor(i / 5), r = i % 5;
        cells.push(el("rect", { x: x0 + c * (CELL + GAP), y: 42 + r * (CELL + GAP), width: CELL, height: CELL, rx: 3 }, svg));
      }
      el("text", { x: x0, y: 142, "class": "t-small", text: "blue = trains the model · orange = held back to test it" }, svg);

      var rows = el("text", { x: x0, y: 182, "class": "t-mid" }, svg);
      var tModel = el("text", { x: x0, y: 206, "class": "t-small", fill: "var(--s1)" }, svg);
      var tTest = el("text", { x: x0, y: 226, "class": "t-small", fill: "var(--s2)" }, svg);
      var big = el("text", { x: x0, y: 264, "class": "t-big" }, svg);
      var verdict = el("text", { x: x0, y: 294, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 160, xDomain: [0.05, 0.6], yDomain: [0, 0.4], xLabel: "share held back for testing →", yLabel: "error" });
      var pM = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pG = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pB = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var bestLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      [["var(--s1)", "model's true error", 0, 0], ["var(--s2)", "test margin (±)", 1, 0], ["var(--ink)", "error you could defend", 0, 1]].forEach(function (l) {
        var lx = 392 + l[2] * 124, ly = 252 + l[3] * 20;
        el("path", { d: "M" + lx + " " + ly + "h14", stroke: l[0], "stroke-width": l[0] === "var(--ink)" ? 3 : 2, "stroke-linecap": "round" }, svg);
        el("text", { x: lx + 20, y: ly + 4, "class": "t-small", text: l[1] }, svg);
      });

      return function (s) {
        var t = s.t, d = s.d, N = NS[d], nTest = Math.round(N * t), b = bound(t, d), bb = bound(BEST[d], d);
        var testCells = Math.round(t * 100);
        cells.forEach(function (c, i) { T.set(c, { fill: i >= 100 - testCells ? "var(--s2)" : "var(--s1)" }); });
        T.set(rows, { text: "Train " + commas(N - nTest) + " rows · Test " + commas(nTest) + " rows" });
        T.set(tModel, { text: "Model's true error: " + pct(modelErr(t, d)) });
        T.set(tTest, { text: "What the test will show: " + pct(modelErr(t, d)) + " ± " + (margin(t, d) * 100).toFixed(1) + " points" });
        T.set(pM, { d: C.path(function (x) { return modelErr(x, d); }, 0.05, 0.6, 50) });
        T.set(pG, { d: C.path(function (x) { return margin(x, d); }, 0.05, 0.6, 50) });
        T.set(pB, { d: C.path(function (x) { return bound(x, d); }, 0.05, 0.6, 50) });
        T.set(bestLine, { x1: C.px(BEST[d]), x2: C.px(BEST[d]) });
        T.set(mk, { cx: C.px(t), cy: C.py(Math.min(b, 0.4)) });
        T.set(big, { text: "Defensible error: " + (b > 0.4 ? "over 40%" : pct(b)) });
        T.set(verdict, { text: b > bb * 1.15 ? "Far from the best (about " + Math.round(BEST[d] * 100) + "% test)" : b > bb * 1.03 ? "Close to the best (about " + Math.round(BEST[d] * 100) + "% test)" : "In the flat part of the curve", fill: b > bb * 1.15 ? "var(--bad)" : b > bb * 1.03 ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
