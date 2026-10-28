// Each index covers one more query pattern (popular ones first, so coverage = 1 − 0.5^i) but every write must update it too.
(function (T) {
  var NPAT = 8, SCAN = 100, WIDX = 10, MAXI = 8;
  var cov = function (i) { return 1 - Math.pow(0.5, i); };
  var readCost = function (i) { return cov(i) * 1 + (1 - cov(i)) * SCAN; };
  var writeCost = function (i) { return 1 + WIDX * i; };
  var MIX = { reads: 0.9, writes: 0.5 };
  var total = function (i, m) { return MIX[m] * readCost(i) + (1 - MIX[m]) * writeCost(i); };
  var best = function (m) { var bi = 0, bc = Infinity; for (var i = 0; i <= MAXI; i += 0.05) { var c = total(i, m); if (c < bc) { bc = c; bi = i; } } return bi; };
  var BEST = { reads: best("reads"), writes: best("writes") };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Eight query patterns that become fast as indexes are added, the places one write must update, and curves of read cost, write cost and their weighted total against the number of indexes.",
    vars: [
      { key: "i", label: "Number of indexes", min: 0, max: MAXI, step: 1, value: 0, color: "var(--s1)", fmt: function (v) { return Math.round(v); } },
      { key: "m", label: "What does the workload do?", type: "choice", value: "reads",
        options: [{ value: "reads", label: "Mostly reads (90%)" }, { value: "writes", label: "Half writes (50%)" }] }
    ],
    scenario: [
      { caption: "No indexes: every query scans the whole table, so reads are slow. Writes are as cheap as they can be.", set: { i: 0, m: "reads" }, hold: 3600 },
      { caption: "The first few indexes cover the most common queries, so reads improve dramatically.", set: { i: 4 }, dur: 2200, hold: 3600 },
      { caption: "Beyond about six, the extra indexes serve rare queries only, yet every write still updates them. Gains flatten, costs don't.", set: { i: 8 }, dur: 2400, hold: 3800 },
      { caption: "Make half the traffic writes and the same eight indexes now cost far more than they save.", set: { m: "writes" }, hold: 3800 },
      { caption: "Three indexes are about right for this workload. The best number moves left as writes grow.", set: { i: 3 }, dur: 2400, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, cs = 36;
      el("text", { x: x0, y: 36, "class": "t-label", text: "Query patterns, most common first" }, svg);
      var chips = [];
      for (var p = 0; p < NPAT; p++) chips.push(el("rect", { x: x0 + p * cs - (p ? 0 : 0), y: 46, width: cs - 6, height: 22, rx: 5 }, svg));
      el("text", { x: x0, y: 86, "class": "t-small", text: "blue = answered by an index · grey = scans the table" }, svg);
      el("text", { x: x0, y: 124, "class": "t-label", text: "One write must update" }, svg);
      var blocks = [];
      for (var b = 0; b <= MAXI; b++) blocks.push(el("rect", { x: x0 + b * cs, y: 134, width: cs - 6, height: 22, rx: 5 }, svg));
      el("text", { x: x0, y: 174, "class": "t-small", text: "the table, plus one block per index" }, svg);

      var big = el("text", { x: x0, y: 218, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 242, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 276, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, MAXI], yDomain: [0, 100], xLabel: "number of indexes →", yLabel: "cost per operation" });
      var pR = el("path", { d: C.path(readCost, 0, MAXI, 80), fill: "none", stroke: "var(--s1)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pW = el("path", { d: C.path(writeCost, 0, MAXI, 2), fill: "none", stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pT = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var bestLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      el("text", { x: C.px(0.3), y: C.py(97), "class": "t-small", fill: "var(--s1)", text: "reads" }, C.g);
      el("text", { x: C.px(5.6), y: C.py(55), "class": "t-small", fill: "var(--s2)", text: "writes" }, C.g);

      return function (s) {
        var i = Math.round(s.i), m = s.m, t = total(s.i, m), b = BEST[m], tb = total(b, m);
        chips.forEach(function (c, p) { T.set(c, { fill: p < i ? "var(--s1)" : "var(--line)" }); });
        blocks.forEach(function (c, k) { T.set(c, { fill: k === 0 ? "var(--ink)" : "var(--s2)", opacity: k <= i ? 1 : 0.12 }); });
        T.set(pT, { d: C.path(function (x) { return total(x, m); }, 0, MAXI, 80) });
        T.set(bestLine, { x1: C.px(b), x2: C.px(b) });
        T.set(mk, { cx: C.px(s.i), cy: C.py(t) });
        T.set(big, { text: "Average cost " + t.toFixed(1) + " per operation" });
        T.set(sub, { text: "read " + readCost(s.i).toFixed(1) + " (" + Math.round(cov(s.i) * 100) + "% of queries use an index) · write " + writeCost(s.i).toFixed(0) });
        T.set(verdict, { text: t > tb * 1.6 ? "Far from the best (about " + Math.round(b) + " indexes)" : t > tb * 1.15 ? "Close to the best (about " + Math.round(b) + " indexes)" : "Near the lowest total cost", fill: t > tb * 1.6 ? "var(--bad)" : t > tb * 1.15 ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
