// Two overlapping score distributions; the threshold decides how many real cases are caught vs. how many flags are wrong.
(function (T) {
  var MU_NEG = 0.38, MU_POS = 0.62, SD = 0.13, NNEG = 650, NPOS = 350;
  var erf = function (x) {
    var t = 1 / (1 + 0.3275911 * Math.abs(x));
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return x >= 0 ? y : -y;
  };
  var above = function (t, mu) { return 0.5 * (1 - erf((t - mu) / (SD * Math.SQRT2))); };
  var pdf = function (x, mu) { return Math.exp(-0.5 * Math.pow((x - mu) / SD, 2)) / (SD * Math.sqrt(2 * Math.PI)); };
  var stats = function (t) {
    var tp = NPOS * above(t, MU_POS), fp = NNEG * above(t, MU_NEG);
    return { tp: tp, fp: fp, fn: NPOS - tp, prec: tp + fp < 1e-6 ? 1 : tp / (tp + fp), rec: tp / NPOS };
  };
  var COST = { screen: { miss: 10, alarm: 1 }, remove: { miss: 1, alarm: 5 } };
  var cost = function (t, c) { var s = stats(t); return s.fn * COST[c].miss + s.fp * COST[c].alarm; };
  var best = function (c) {
    var bt = 0.05, bc = Infinity;
    for (var t = 0.05; t <= 0.95; t += 0.005) { var v = cost(t, c); if (v < bc) { bc = v; bt = t; } }
    return bt;
  };
  var BEST = { screen: best("screen"), remove: best("remove") };
  var pct = function (v) { return Math.round(v * 100) + "%"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Score distributions for real cases and non-cases with a movable threshold, and curves of precision and recall against the threshold.",
    vars: [
      { key: "th", label: "Decision threshold (flag when score is above)", min: 0.05, max: 0.95, step: 0.01, value: 0.5, color: "var(--s1)", fmt: function (v) { return v.toFixed(2); } },
      { key: "ctx", label: "Which mistake is worse?", type: "choice", value: "screen",
        options: [{ value: "screen", label: "Missing a real case (screening)" }, { value: "remove", label: "A false alarm (auto-removal)" }] }
    ],
    scenario: [
      { caption: "A model scores every item. At 0.5, it flags most real cases but misses a good share of them.", set: { th: 0.5, ctx: "screen" }, hold: 3400 },
      { caption: "Lower the threshold: recall climbs because fewer real cases slip through, but precision drops as false alarms pile up.", set: { th: 0.3 }, dur: 2200, hold: 3600 },
      { caption: "Same threshold, different job. If a false alarm is the costly mistake (auto-removing posts), this is now far from the cheapest setting.", set: { ctx: "remove" }, hold: 3600 },
      { caption: "Raise the threshold: precision climbs and recall falls. The dashed line marks the lowest-cost threshold for this job.", set: { th: 0.66 }, dur: 2400, hold: 3800 }
    ],
    setup: function (svg) {
      var el = T.el;
      var BAND = 0.05; // items are counted in score bands this wide
      var C = T.chart(svg, { x: 30, y: 48, w: 300, h: 170, xDomain: [0, 1], yDomain: [0, 112], xLabel: "model score →", yLabel: "items per score band" });
      var baseline = function (a, b) { return "L" + C.px(b).toFixed(1) + " " + C.py(0) + "L" + C.px(a).toFixed(1) + " " + C.py(0) + "Z"; };
      var negArea = el("path", { fill: "var(--s1)", "fill-opacity": 0.3 }, C.g);
      var posArea = el("path", { fill: "var(--s2)", "fill-opacity": 0.45 }, C.g);
      var negFn = function (x) { return NNEG * pdf(x, MU_NEG) * BAND; };
      var posFn = function (x) { return NPOS * pdf(x, MU_POS) * BAND; };
      el("path", { d: C.path(negFn, 0, 1, 100), fill: "none", stroke: "var(--s1)", "stroke-width": 2 }, C.g);
      el("path", { d: C.path(posFn, 0, 1, 100), fill: "none", stroke: "var(--s2)", "stroke-width": 2 }, C.g);
      el("text", { x: C.px(0.2), y: C.py(negFn(0.2)) - 8, "text-anchor": "middle", "class": "t-small", fill: "var(--s1)", text: "not a case" }, C.g);
      el("text", { x: C.px(0.82), y: C.py(posFn(0.82)) - 8, "text-anchor": "middle", "class": "t-small", fill: "var(--s2)", text: "real case" }, C.g);
      var thLine = el("line", { y1: -4, y2: C.h, stroke: "var(--ink)", "stroke-width": 2 }, C.g);
      var bestLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var bestT = el("text", { y: 12, "class": "t-small", fill: "var(--good)", text: "lowest cost" }, C.g);

      var R = T.chart(svg, { x: 392, y: 48, w: 218, h: 170, xDomain: [0.05, 0.95], yDomain: [0, 1], xLabel: "threshold →", yLabel: "share" });
      var cur = function (key) { return function (t) { return stats(t)[key]; }; };
      el("path", { d: R.path(cur("prec"), 0.05, 0.95, 90), fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, R.g);
      el("path", { d: R.path(cur("rec"), 0.05, 0.95, 90), fill: "none", stroke: "var(--s2)", "stroke-width": 2.5 }, R.g);
      el("text", { x: R.px(0.93), y: R.py(0.97) + 14, "text-anchor": "end", "class": "t-small", fill: "var(--s1)", text: "precision" }, R.g);
      el("text", { x: R.px(0.07), y: R.py(0.55), "class": "t-small", fill: "var(--s2)", text: "recall" }, R.g);
      var mP = el("circle", { r: 6, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2.5 }, R.g);
      var mR = el("circle", { r: 6, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2.5 }, R.g);

      var pr = el("text", { x: 30, y: 262, "class": "t-big" }, svg);
      var counts = el("text", { x: 30, y: 284, "class": "t-small" }, svg);
      var costT = el("text", { x: 30, y: 306, "class": "t-mid" }, svg);

      return function (s) {
        var t = s.th, st = stats(t), b = BEST[s.ctx];
        T.set(negArea, { d: C.path(negFn, t, 1, 60) + baseline(t, 1) });
        T.set(posArea, { d: C.path(posFn, t, 1, 60) + baseline(t, 1) });
        T.set(thLine, { x1: C.px(t), x2: C.px(t) });
        T.set(bestLine, { x1: C.px(b), x2: C.px(b) });
        T.set(bestT, { x: C.px(b) + (b > 0.6 ? -4 : 4), "text-anchor": b > 0.6 ? "end" : "start" });
        T.set(mP, { cx: R.px(t), cy: R.py(st.prec) });
        T.set(mR, { cx: R.px(t), cy: R.py(st.rec) });
        T.set(pr, { text: "Precision " + pct(st.prec) + " · Recall " + pct(st.rec) });
        T.set(counts, { text: "Of " + (NPOS + NNEG) + " items: " + Math.round(st.tp) + " real cases caught, " + Math.round(st.fn) + " missed, " + Math.round(st.fp) + " false alarms" });
        var c = cost(t, s.ctx), cb = cost(b, s.ctx);
        T.set(costT, { text: "Cost of mistakes: " + Math.round(c) + (c > cb * 1.15 ? "  (cheapest possible: " + Math.round(cb) + ")" : "  (near the cheapest)"), fill: c > cb * 1.5 ? "var(--bad)" : c > cb * 1.15 ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
