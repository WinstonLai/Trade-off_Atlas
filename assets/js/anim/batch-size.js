// Economic order quantity: total cost = setup × (D / Q) + holding × Q / 2, minimised at Q* = sqrt(2·S·D / h).
(function (T) {
  var D = 100, H = 2, SETUP = { cheap: 8, costly: 72 };
  var setupCost = function (q, c) { return SETUP[c] * D / q; };
  var holdCost = function (q) { return H * q / 2; };
  var total = function (q, c) { return setupCost(q, c) + holdCost(q); };
  var qStar = function (c) { return Math.sqrt(2 * SETUP[c] * D / H); };
  var YMAX = 340;

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A sawtooth of finished work waiting for release, and curves of setup cost, waiting cost and their total against batch size.",
    vars: [
      { key: "q", label: "Batch size (items per release)", min: 2, max: 100, step: 1, value: 100, color: "var(--s1)", fmt: function (v) { return Math.round(v); } },
      { key: "c", label: "What does each release cost?", type: "choice", value: "cheap",
        options: [{ value: "cheap", label: "Cheap (automated)" }, { value: "costly", label: "Costly (manual, heavy)" }] }
    ],
    scenario: [
      { caption: "One big release a month. Releases are cheap, but finished work sits waiting for most of the month.", set: { q: 100, c: "cheap" }, hold: 3600 },
      { caption: "Shrink the batch to 4: waiting nearly vanishes, but you now pay the release cost 25 times.", set: { q: 4 }, dur: 2400, hold: 3600 },
      { caption: "Somewhere in between the two costs balance. The total is lowest and the curve is flat around it.", set: { q: 28 }, dur: 2200, hold: 3800 },
      { caption: "Make each release costly (manual steps, sign-offs) and the same batch size is now too small.", set: { c: "costly" }, hold: 3600 },
      { caption: "The best batch grows to about 85. Cutting the cost per release is what makes small batches affordable.", set: { q: 85 }, dur: 2400, hold: 3800 }
    ],
    setup: function (svg) {
      var el = T.el;
      var L = T.chart(svg, { x: 30, y: 48, w: 290, h: 150, xDomain: [0, 1], yDomain: [0, 100], xLabel: "one month →", yLabel: "finished work waiting" });
      var area = el("path", { fill: "var(--s1)", "fill-opacity": 0.3, stroke: "var(--s1)", "stroke-width": 1.5 }, L.g);

      var R = T.chart(svg, { x: 392, y: 48, w: 218, h: 150, xDomain: [0, 100], yDomain: [0, YMAX], xLabel: "batch size →", yLabel: "cost per month" });
      var pSetup = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "5 4" }, R.g);
      var pHold = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2, "stroke-dasharray": "5 4", d: R.path(holdCost, 2, 100, 60) }, R.g);
      var pTot = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, R.g);
      var bestLine = el("line", { y1: 0, y2: R.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, R.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, R.g);
      el("text", { x: R.px(60), y: R.py(150), "class": "t-small", fill: "var(--s1)", text: "waiting" }, R.g);
      var setupLbl = el("text", { x: R.px(27), y: R.py(YMAX) + 12, "class": "t-small", fill: "var(--s2)", text: "release cost" }, R.g);

      var big = el("text", { x: 30, y: 246, "class": "t-big" }, svg);
      var sub = el("text", { x: 30, y: 268, "class": "t-small" }, svg);
      var verdict = el("text", { x: 30, y: 296, "class": "t-mid" }, svg);

      return function (s) {
        var q = Math.max(2, Math.round(s.q)), c = s.c, n = D / q, qs = qStar(c);
        var d = "M0 " + L.py(0);
        for (var k = 0; k < n; k++) {
          var x0 = k / n, x1 = Math.min(1, (k + 1) / n);
          d += "L" + L.px(x0).toFixed(1) + " " + L.py(0) + "L" + L.px(x1).toFixed(1) + " " + L.py(q * (x1 - x0) * n).toFixed(1);
          if (x1 < 1) d += "L" + L.px(x1).toFixed(1) + " " + L.py(0);
        }
        T.set(area, { d: d + "L" + L.px(1) + " " + L.py(0) + "Z" });
        T.set(pSetup, { d: R.path(function (x) { return setupCost(x, c); }, 2, 100, 80) });
        T.set(pTot, { d: R.path(function (x) { return total(x, c); }, 2, 100, 80) });
        T.set(bestLine, { x1: R.px(qs), x2: R.px(qs) });
        T.set(mk, { cx: R.px(q), cy: R.py(Math.min(YMAX, total(q, c))) });
        var t = total(q, c), tb = total(qs, c);
        T.set(big, { text: "Total cost " + Math.round(t) + " / month" });
        T.set(sub, { text: Math.round(n * 10) / 10 + (n === 1 ? " release × " : " releases × ") + SETUP[c] + " = " + Math.round(setupCost(q, c)) + " release cost · " + Math.round(holdCost(q)) + " waiting cost" });
        T.set(verdict, { text: t > tb * 1.5 ? "Far from the cheapest batch (about " + Math.round(qs) + ")" : t > tb * 1.1 ? "Close to the optimum of about " + Math.round(qs) : "Near the lowest total cost", fill: t > tb * 1.5 ? "var(--bad)" : t > tb * 1.1 ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
