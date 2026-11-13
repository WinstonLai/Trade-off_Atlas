// Costs in thousands. Buying: a one-off integration, a yearly licence, and yearly workarounds for the share of needs the product doesn't fit.
// Building: a one-off cost (times the overrun) plus yearly upkeep.
(function (T) {
  var BUILD = 300, INTEG = 40, LICENSE = 60, WORK = 150, UPKEEP = 60, MAXY = 1300, MAXT = 8, W = 330, SC = W / MAXY;
  var buyRate = function (f) { return LICENSE + (1 - f) * WORK; };
  var buyCost = function (t, f) { return INTEG + t * buyRate(f); };
  var buildCost = function (t, o) { return BUILD * o + UPKEEP * t; };
  var cross = function (f, o) { var d = buyRate(f) - UPKEEP; return d > 0 ? (BUILD * o - INTEG) / d : Infinity; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Stacked bars of the cumulative cost of buying and of building after a chosen number of years, and curves of both costs over time that cross at a break-even year.",
    vars: [
      { key: "t", label: "Years in service", min: 0, max: MAXT, step: 0.1, value: 0, color: "var(--s1)", fmt: function (v) { return v.toFixed(1) + " years"; } },
      { key: "f", label: "How much of your need the product fits", min: 0.4, max: 1, step: 0.05, value: 0.9, color: "var(--s2)", fmt: function (v) { return Math.round(v * 100) + "%"; } },
      { key: "o", label: "Build cost vs. your estimate", min: 1, max: 2, step: 0.1, value: 1, color: "var(--s3)", fmt: function (v) { return "×" + v.toFixed(1); } }
    ],
    scenario: [
      { caption: "Day one: buying costs 40 to integrate. Building costs 300 before anything works.", set: { t: 0, f: 0.9, o: 1 }, hold: 3600 },
      { caption: "Eight years on, a product that fits well is still cheaper: licences and a few workarounds cost less than building and maintaining.", set: { t: 8 }, dur: 3000, hold: 4000 },
      { caption: "If it only half-fits, workarounds add up to 75 a year. The lines cross around year 3.5 and building wins from then on.", set: { f: 0.5 }, dur: 2200, hold: 4400 },
      { caption: "But builds tend to cost more than planned. At twice the estimate the break-even slides out to year 7.5.", set: { o: 2 }, dur: 2400, hold: 4400 },
      { caption: "A more realistic overrun of 30% puts break-even near year 5. Whether that's worth it depends on how central the capability is to what makes you different.", set: { o: 1.3 }, dur: 2200, hold: 4800 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30;
      var rowBuy = 64, rowBuild = 134, h = 30;
      el("text", { x: x0, y: rowBuy - 10, "class": "t-label", text: "Buy" }, svg);
      el("text", { x: x0, y: rowBuild - 10, "class": "t-label", text: "Build" }, svg);
      var totBuy = el("text", { x: x0 + W, y: rowBuy - 10, "text-anchor": "end", "class": "t-label" }, svg);
      var totBuild = el("text", { x: x0 + W, y: rowBuild - 10, "text-anchor": "end", "class": "t-label" }, svg);
      var seg = function (y, fill, op) { return el("rect", { y: y, height: h, fill: fill, opacity: op, stroke: "var(--surface)", "stroke-width": 1.5 }, svg); };
      var b1 = seg(rowBuy, "var(--s1)", 1), b2 = seg(rowBuy, "var(--s2)", 0.55), b3 = seg(rowBuy, "var(--bad)", 0.45);
      var c1 = seg(rowBuild, "var(--s1)", 1), c2 = seg(rowBuild, "var(--s2)", 0.55);
      var lg = [["var(--s1)", 1, "one-off cost"], ["var(--s2)", 0.55, "licences / upkeep"], ["var(--bad)", 0.45, "workarounds"]];
      lg.forEach(function (l, i) {
        el("rect", { x: x0 + i * 116, y: 190, width: 10, height: 10, rx: 2, fill: l[0], opacity: l[1] }, svg);
        el("text", { x: x0 + i * 116 + 15, y: 199, "class": "t-small", text: l[2] }, svg);
      });

      var big = el("text", { x: x0, y: 244, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 266, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 298, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, MAXT], yDomain: [0, MAXY], xLabel: "years →", yLabel: "cumulative cost" });
      var pBuy = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2.5 }, C.g);
      var pBuild = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, C.g);
      var nowLine = el("line", { y1: 0, y2: C.h, stroke: "var(--muted)", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, C.g);
      var ring = el("circle", { r: 7, fill: "none", stroke: "var(--ink)", "stroke-width": 2.5 }, C.g);
      var mBuy = el("circle", { r: 5.5, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      var mBuild = el("circle", { r: 5.5, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      el("text", { x: C.px(0.2), y: C.py(buyCost(0, 0.9)) - 22, "class": "t-small", fill: "var(--s2)", text: "buy" }, C.g);
      el("text", { x: C.px(0.2), y: C.py(BUILD) - 8, "class": "t-small", fill: "var(--s1)", text: "build" }, C.g);

      return function (s) {
        var t = s.t, f = s.f, o = s.o, cb = buyCost(t, f), cd = buildCost(t, o), x = cross(f, o);
        var wB = (t * LICENSE) * SC, wW = (t * (1 - f) * WORK) * SC;
        T.set(b1, { x: x0, width: INTEG * SC });
        T.set(b2, { x: x0 + INTEG * SC, width: wB });
        T.set(b3, { x: x0 + INTEG * SC + wB, width: wW });
        T.set(c1, { x: x0, width: BUILD * o * SC });
        T.set(c2, { x: x0 + BUILD * o * SC, width: UPKEEP * t * SC });
        T.set(totBuy, { text: Math.round(cb) });
        T.set(totBuild, { text: Math.round(cd) });
        T.set(pBuy, { d: C.path(function (k) { return buyCost(k, f); }, 0, MAXT, 2) });
        T.set(pBuild, { d: C.path(function (k) { return buildCost(k, o); }, 0, MAXT, 2) });
        T.set(nowLine, { x1: C.px(t), x2: C.px(t) });
        T.set(mBuy, { cx: C.px(t), cy: C.py(cb) });
        T.set(mBuild, { cx: C.px(t), cy: C.py(cd) });
        T.set(ring, { cx: C.px(Math.min(x, MAXT)), cy: C.py(buyCost(Math.min(x, MAXT), f)), opacity: x <= MAXT ? 1 : 0 });
        T.set(big, { text: (cb < cd ? "Buying is cheaper by " : "Building is cheaper by ") + Math.round(Math.abs(cd - cb)) });
        T.set(sub, { text: x <= MAXT ? "Break-even at year " + x.toFixed(1) + ": building costs less after that" : x === Infinity ? "Building never catches up: the product fits well enough" : "Break-even beyond " + MAXT + " years" });
        T.set(verdict, { text: cb < cd ? "Buy, at this horizon" : "Build, at this horizon", fill: cb < cd ? "var(--s2)" : "var(--s1)" });
      };
    }
  });
})(window.Tradeoff);
