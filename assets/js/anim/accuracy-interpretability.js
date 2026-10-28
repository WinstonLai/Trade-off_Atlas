// Flexible models fit more of the pattern but are harder to explain. How much that matters depends on the stakes.
// fit for the job = accuracy − λ × (1 − explainability), with λ larger when decisions must be justified.
(function (T) {
  var CMAX = 3, LAMBDA = { low: 0.02, high: 0.25 };
  var acc = function (c) { return 0.75 + 0.18 * (1 - Math.exp(-1.3 * c)) / (1 - Math.exp(-1.3 * CMAX)); };
  var expl = function (c) { return 1 / (1 + Math.pow(c / 1.4, 2.2)); };
  var fit = function (c, k) { return acc(c) - LAMBDA[k] * (1 - expl(c)); };
  var norm = function (v) { return Math.max(0, Math.min(1, (v - 0.6) / 0.35)); };
  var best = function (k) { var b = 0, bv = -1; for (var c = 0; c <= CMAX; c += 0.01) if (fit(c, k) > bv) { bv = fit(c, k); b = c; } return b; };
  var BEST = { low: best("low"), high: best("high") };
  var pc = function (v) { return Math.round(v * 100) + "%"; };
  var MODELS = [
    { name: "Linear model", note: "Each factor has a weight you can read out and defend." },
    { name: "Small tree", note: "A short chain of if-then rules a person can follow." },
    { name: "Boosted trees", note: "Hundreds of trees. Explained by summaries, not read directly." },
    { name: "Deep network", note: "Millions of weights. Only approximate, after-the-fact explanations." }
  ];
  var level = function (e) { return e > 0.75 ? "high" : e > 0.4 ? "medium" : "low"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A ladder of four model types from linear model to deep network, and curves of accuracy, explainability and fit for the job against model complexity.",
    vars: [
      { key: "c", label: "Model complexity", min: 0, max: CMAX, step: 0.01, value: 0, color: "var(--s1)", fmt: function (v) { return MODELS[Math.round(v)].name; } },
      { key: "k", label: "How important is it to justify decisions?", type: "choice", value: "high",
        options: [{ value: "low", label: "Not very (ad ranking)" }, { value: "high", label: "Very (loan decisions)" }] }
    ],
    scenario: [
      { caption: "A simple linear model: a little less accurate, but anyone can see why it gave an answer.", set: { c: 0, k: "high" }, hold: 3800 },
      { caption: "When a decision must be justified, a small tree recovers over half the accuracy gain and is still easy to explain. That's the best fit here.", set: { c: 0.6 }, dur: 2200, hold: 4000 },
      { caption: "A deep network is the most accurate, but nobody can say why it decided. For a loan decision, that's a cost.", set: { c: 3 }, dur: 2400, hold: 4000 },
      { caption: "If the stakes are low (which ad to show) and nobody asks for reasons, the most accurate model simply wins.", set: { k: "low" }, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, cw = 78;
      el("text", { x: x0, y: 36, "class": "t-label", text: "Kind of model" }, svg);
      var chips = [], names = [];
      MODELS.forEach(function (m, i) {
        chips.push(el("rect", { x: x0 + i * (cw + 4), y: 46, width: cw, height: 34, rx: 6 }, svg));
        names.push(el("text", { x: x0 + i * (cw + 4) + cw / 2, y: 67, "text-anchor": "middle", "class": "t-small", text: m.name }, svg));
      });
      var note = el("text", { x: x0, y: 106, "class": "t-small" }, svg);
      var accT = el("text", { x: x0, y: 160, "class": "t-big" }, svg);
      var expT = el("text", { x: x0, y: 184, "class": "t-mid" }, svg);
      var verdict = el("text", { x: x0, y: 236, "class": "t-mid" }, svg);
      var tip = el("text", { x: x0, y: 258, "class": "t-small" }, svg);

      var C = T.chart(svg, { x: 400, y: 48, w: 210, h: 190, xDomain: [0, CMAX], yDomain: [0, 1], xLabel: "more complex →", yLabel: "score (accuracy axis stretched)" });
      el("path", { d: C.path(function (c) { return (acc(c) - 0.7) / 0.3; }, 0, CMAX, 40), fill: "none", stroke: "var(--s1)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      el("path", { d: C.path(expl, 0, CMAX, 60), fill: "none", stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pF = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var bestLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      el("text", { x: C.px(1.7), y: C.py(0.88), "class": "t-small", fill: "var(--s1)", text: "accuracy" }, C.g);
      el("text", { x: C.px(1.0), y: C.py(0.15), "class": "t-small", fill: "var(--s2)", text: "explainability" }, C.g);
      el("text", { x: C.px(1.2), y: C.py(0.04) - 2, "class": "t-small", fill: "var(--ink)", text: "fit for the job" }, C.g);

      return function (s) {
        var c = s.c, k = s.k, a = acc(c), e = expl(c), idx = Math.max(0, Math.min(3, Math.round(c)));
        chips.forEach(function (r, i) { T.set(r, { fill: i === idx ? "var(--s1)" : "var(--surface-2)" }); T.set(names[i], { fill: i === idx ? "var(--surface)" : "var(--muted)" }); });
        T.set(note, { text: MODELS[idx].note });
        T.set(pF, { d: C.path(function (x) { return norm(fit(x, k)); }, 0, CMAX, 80) });
        T.set(bestLine, { x1: C.px(BEST[k]), x2: C.px(BEST[k]) });
        T.set(mk, { cx: C.px(c), cy: C.py(norm(fit(c, k))) });
        T.set(accT, { text: "Accuracy " + pc(a) });
        T.set(expT, { text: "Explainability: " + level(e) });
        var f = fit(c, k), fb = fit(BEST[k], k), gap = fb - f;
        T.set(verdict, { text: gap < 0.01 ? "About the best fit for this job" : gap < 0.04 ? "Reasonable for this job" : "Poor fit for this job", fill: gap < 0.01 ? "var(--good)" : gap < 0.04 ? "var(--warn)" : "var(--bad)" });
        T.set(tip, { text: "(illustrative numbers; real gaps depend on the data)" });
      };
    }
  });
})(window.Tradeoff);
