// Cost per committed transaction. Pessimistic: always pay a lock, and wait when someone else holds it.
// Optimistic: no lock, but a conflict (probability p) throws the work away and retries, so expected attempts = 1 / (1 − p).
(function (T) {
  var WORK = 10, LOCK = 1, WAIT = 5, PMAX = 0.85, SC = 3.6;
  var pess = function (p) { return { work: WORK, lock: LOCK, wait: p * WAIT, waste: 0 }; };
  var opt = function (p) { return { work: WORK, lock: 0, wait: 0, waste: WORK * p / (1 - p) }; };
  var sum = function (c) { return c.work + c.lock + c.wait + c.waste; };
  var pc = function (p) { return Math.round(p * 100) + "%"; };
  // crossover where WORK / (1 − p) = WORK + LOCK + p·WAIT
  var CROSS = (function () { for (var p = 0; p < PMAX; p += 0.001) if (sum(opt(p)) > sum(pess(p))) return p; return PMAX; })();

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Stacked bars showing where time goes for a locking strategy and an optimistic retry strategy, and curves of cost against how often transactions collide.",
    vars: [
      { key: "p", label: "How often two transactions collide", min: 0, max: PMAX, step: 0.01, value: 0.02, color: "var(--s1)", fmt: pc }
    ],
    scenario: [
      { caption: "Collisions are rare (2%). Locking taxes every transaction for protection it almost never needs, so optimistic is cheaper.", set: { p: 0.02 }, hold: 3800 },
      { caption: "At around 15% the two cost the same. This is the crossover, and it moves with the cost of a lock and of redoing work.", set: { p: CROSS }, dur: 2400, hold: 3800 },
      { caption: "At 50%, half of the optimistic attempts are thrown away. Waiting your turn is now cheaper than redoing the work.", set: { p: 0.5 }, dur: 2200, hold: 4000 },
      { caption: "At 85% retries pile up and the optimistic approach spends most of its time repeating itself.", set: { p: 0.85 }, dur: 2200, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30;
      var COLORS = { work: "var(--s1)", lock: "var(--muted)", wait: "var(--s2)", waste: "var(--bad)" };
      var bars = {};
      [["pess", "Pessimistic: lock first", 60], ["opt", "Optimistic: check at commit, retry on conflict", 140]].forEach(function (b) {
        el("text", { x: x0, y: b[2] - 8, "class": "t-label", text: b[1] }, svg);
        bars[b[0]] = { y: b[2], segs: {}, total: el("text", { y: b[2] + 48, "class": "t-small" }, svg) };
        ["work", "lock", "wait", "waste"].forEach(function (k) { bars[b[0]].segs[k] = el("rect", { y: b[2], height: 30, fill: COLORS[k], stroke: "var(--surface)", "stroke-width": 1.5 }, svg); });
      });
      [["work", "useful work", 0], ["lock", "lock overhead", 88], ["wait", "waiting for lock", 196], ["waste", "wasted retries", 300]].forEach(function (l) {
        el("rect", { x: x0 + l[2], y: 208, width: 10, height: 10, rx: 2, fill: COLORS[l[0]] }, svg);
        el("text", { x: x0 + l[2] + 15, y: 217, "class": "t-small", text: l[1] }, svg);
      });
      var big = el("text", { x: x0, y: 258, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 282, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 400, y: 48, w: 210, h: 190, xDomain: [0, PMAX], yDomain: [0, 60], xLabel: "collision rate →", yLabel: "time per committed transaction" });
      el("path", { d: C.path(function (p) { return sum(pess(p)); }, 0, PMAX, 50), fill: "none", stroke: "var(--s2)", "stroke-width": 2.5 }, C.g);
      el("path", { d: C.path(function (p) { return sum(opt(p)); }, 0, PMAX, 80), fill: "none", stroke: "var(--bad)", "stroke-width": 2.5, "stroke-dasharray": "6 5" }, C.g);
      el("line", { x1: C.px(CROSS), x2: C.px(CROSS), y1: 0, y2: C.h, stroke: "var(--line)", "stroke-dasharray": "3 3" }, C.g);
      el("text", { x: C.px(0.02), y: C.py(55), "class": "t-small", fill: "var(--bad)", text: "optimistic" }, C.g);
      el("text", { x: C.px(0.45), y: C.py(24), "class": "t-small", fill: "var(--s2)", text: "pessimistic" }, C.g);
      var mP = el("circle", { r: 6, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      var mO = el("circle", { r: 6, fill: "var(--bad)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);

      return function (s) {
        var p = s.p, cp = pess(p), co = opt(p), tp = sum(cp), to = sum(co);
        [["pess", cp, tp], ["opt", co, to]].forEach(function (b) {
          var x = x0;
          ["work", "lock", "wait", "waste"].forEach(function (k) { var w = b[1][k] * SC; T.set(bars[b[0]].segs[k], { x: x, width: w }); x += w; });
          T.set(bars[b[0]].total, { x: x0, text: b[2].toFixed(1) + " units per transaction" });
        });
        T.set(mP, { cx: C.px(p), cy: C.py(tp) });
        T.set(mO, { cx: C.px(p), cy: C.py(to) });
        var opt_ = to < tp;
        var gap = Math.round(Math.abs(to - tp) / Math.max(to, tp) * 100);
        T.set(big, { text: gap < 3 ? "About the same cost" : (opt_ ? "Optimistic" : "Pessimistic") + " is cheaper" });
        T.set(sub, { text: gap < 3 ? "the crossover, at " + pc(p) + " collisions" : "by " + gap + "% at " + pc(p) + " collisions", fill: "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
