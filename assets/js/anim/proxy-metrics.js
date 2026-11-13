// Pressure d on a metric moves the metric one-for-one, while the real outcome is d × (1 − βd). β grows as the metric tracks the goal less well.
// Same shape as the gold-vs-proxy reward curves in Gao et al., "Scaling Laws for Reward Model Overoptimization".
(function (T) {
  var MAXD = 10, LO = -4, HI = 10, W = 330;
  var beta = function (q) { return 0.14 * (1 - q); };
  var real = function (d, q) { return d * (1 - beta(q) * d); };
  var peak = function (q) { var b = beta(q); return b > 0 ? Math.min(MAXD, 1 / (2 * b)) : MAXD; };
  var EX = {
    tickets: { metric: "Tickets closed", real: "Customers actually helped", game: "Agents close tickets early to hit the number." },
    coverage: { metric: "Test coverage", real: "Bugs actually caught", game: "Tests that run the code but assert nothing." },
    views: { metric: "Page views", real: "Readers who got value", game: "Clickbait titles and endless pagination." }
  };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Two bars from a common zero line showing what a metric reports and the real outcome it stands for, and curves of both against the pressure put on the metric.",
    vars: [
      { key: "d", label: "Pressure on the metric", min: 0, max: MAXD, step: 0.1, value: 2, color: "var(--s1)", fmt: function (v) { return v.toFixed(1); } },
      { key: "q", label: "How well the metric tracks the goal", min: 0, max: 1, step: 0.05, value: 0.2, color: "var(--s2)", fmt: function (v) { return Math.round(v * 100) + "%"; } },
      { key: "ex", label: "Example", type: "choice", value: "tickets",
        options: [{ value: "tickets", label: "Support" }, { value: "coverage", label: "Software" }, { value: "views", label: "Content" }] }
    ],
    scenario: [
      { caption: "A little pressure: the metric and the real goal rise together, so the number is a good guide.", set: { d: 2, q: 0.2 }, hold: 3600 },
      { caption: "Push harder: the metric keeps climbing, but the real outcome is flattening as people find cheap ways to move the number.", set: { d: 5 }, dur: 2400, hold: 4000 },
      { caption: "Under heavy pressure the dashboard looks wonderful while the real result is worse than where you started.", set: { d: 10 }, dur: 2600, hold: 4400 },
      { caption: "A metric that closely tracks the goal tolerates far more pressure: the gap stays small even at the maximum.", set: { q: 0.9 }, dur: 2400, hold: 4200 },
      { caption: "With a loose proxy, stop pushing near the peak and watch a second metric that would reveal gaming.", set: { q: 0.2, d: 4.5 }, dur: 2600, hold: 4400 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, sc = W / (HI - LO), zx = x0 - LO * sc;
      var bar = function (y, color) { return el("rect", { y: y, height: 26, rx: 4, fill: color }, svg); };
      var labM = el("text", { x: x0, y: 54, "class": "t-label" }, svg);
      var valM = el("text", { x: x0 + W, y: 54, "text-anchor": "end", "class": "t-label" }, svg);
      var bM = bar(62, "var(--s1)");
      var labR = el("text", { x: x0, y: 124, "class": "t-label" }, svg);
      var valR = el("text", { x: x0 + W, y: 124, "text-anchor": "end", "class": "t-label" }, svg);
      var bR = bar(132, "var(--s2)");
      el("path", { d: "M" + zx + " 58V92M" + zx + " 128V162", stroke: "var(--ink)", "stroke-width": 2, "stroke-dasharray": "3 3" }, svg);
      el("text", { x: zx, y: 182, "text-anchor": "middle", "class": "t-small", text: "where you started" }, svg);

      var big = el("text", { x: x0, y: 226, "class": "t-big" }, svg);
      var game = el("text", { x: x0, y: 250, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 288, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, MAXD], yDomain: [LO, HI], xLabel: "pressure on the metric →", yLabel: "result" });
      el("path", { d: "M0 " + C.py(0) + "H" + C.w, stroke: "var(--muted)", "stroke-width": 1.5, "stroke-dasharray": "4 4", fill: "none" }, C.g);
      el("path", { d: C.path(function (d) { return d; }, 0, MAXD, 2), fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, C.g);
      var pR = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2.5 }, C.g);
      var peakLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var mM = el("circle", { r: 5.5, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      var mR = el("circle", { r: 5.5, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      el("text", { x: C.px(0.3), y: C.py(9.2), "class": "t-small", fill: "var(--s1)", text: "the metric" }, C.g);
      el("text", { x: C.px(6.2), y: C.py(-2.6), "class": "t-small", fill: "var(--s2)", text: "the real outcome" }, C.g);

      var bx = function (r, v) { var a = zx, b = zx + v * sc; T.set(r, { x: Math.min(a, b), width: Math.max(2, Math.abs(b - a)) }); };

      return function (s) {
        var d = s.d, q = s.q, e = EX[s.ex], r = real(d, q), pk = peak(q);
        T.set(labM, { text: e.metric + " (the dashboard)" });
        T.set(labR, { text: e.real + " (reality)" });
        T.set(valM, { text: (d >= 0 ? "+" : "") + d.toFixed(1) });
        T.set(valR, { text: (r >= 0 ? "+" : "−") + Math.abs(r).toFixed(1) });
        bx(bM, d); bx(bR, r);
        T.set(pR, { d: C.path(function (x) { return real(x, q); }, 0, MAXD, 60) });
        T.set(peakLine, { x1: C.px(pk), x2: C.px(pk), opacity: pk < MAXD ? 1 : 0 });
        T.set(mM, { cx: C.px(d), cy: C.py(d) });
        T.set(mR, { cx: C.px(d), cy: C.py(Math.max(LO, r)) });
        var gap = d - r;
        T.set(big, { text: "Dashboard +" + d.toFixed(1) + ", reality " + (r >= 0 ? "+" : "−") + Math.abs(r).toFixed(1) });
        T.set(game, { text: gap > 1.5 ? "How the gap opens: " + e.game : "" });
        var past = d > pk + 0.5, atPeak = pk < MAXD && Math.abs(d - pk) <= 0.5, close = gap / Math.max(d, 1) < 0.25;
        T.set(verdict, { text: r < 0 ? "Worse than doing nothing, and the dashboard hides it" : past ? "Past the peak: pushing harder makes the real result worse" : atPeak ? "At the peak: more pressure only widens the gap" : close ? "Metric and goal still move together" : "The gap is opening", fill: r < 0 || past ? "var(--bad)" : atPeak || !close ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
