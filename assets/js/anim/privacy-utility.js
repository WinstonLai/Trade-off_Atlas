// Differential privacy, Laplace mechanism for counts: add noise of scale 1/ε. Smaller ε means more noise, so the output barely depends on any one person.
// The slider holds log10(ε) so that equal steps are equal ratios.
(function (T) {
  var TRUE = [60, 40, 28, 18, 10, 5];
  var L = [0.8, -1.7, 0.4, 2.1, -0.6, -1.1]; // a fixed draw of standard Laplace noise
  var NAMES = ["A", "B", "C", "D", "E", "F"];
  var eps = function (v) { return Math.pow(10, v); };
  var fmtEps = function (v) { var e = eps(v); return "ε = " + (e < 1 ? e.toFixed(2) : e.toFixed(1)); };
  var YMAX = 90;
  var lap = function (x, b) { return Math.exp(-Math.abs(x) / b); }; // density shape, peak normalised to 1

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Six bars showing true counts and noisy released counts, and two overlapping curves showing how hard it is to tell whether one person is in the data.",
    vars: [
      { key: "e", label: "Privacy budget (ε): small is private, large is accurate", min: -1.3, max: 0.7, step: 0.01, value: -1.3, color: "var(--s1)", fmt: fmtEps }
    ],
    scenario: [
      { caption: "Very strong privacy (ε = 0.05). The noise is far larger than the counts, so the released numbers say almost nothing.", set: { e: -1.3 }, hold: 3800 },
      { caption: "At ε = 0.5 the larger bars are recognisable and the small ones are still blurred. One person's presence is hard to detect.", set: { e: -0.3 }, dur: 2400, hold: 3800 },
      { caption: "At ε = 2 the counts are close to the truth, but the guarantee is weaker: the odds of detecting one person can shift by 7 times.", set: { e: 0.3 }, dur: 2400, hold: 4000 },
      { caption: "At ε = 5 nearly no noise remains, and almost no protection either. Privacy and accuracy are one dial.", set: { e: 0.7 }, dur: 2000, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el;
      var C = T.chart(svg, { x: 30, y: 48, w: 300, h: 130, xDomain: [0, 6], yDomain: [0, YMAX], yLabel: "people counted" });
      var truth = [], noisy = [];
      for (var i = 0; i < TRUE.length; i++) {
        var x = C.px(i + 0.12);
        truth.push(el("rect", { x: x, width: 36, rx: 3, fill: "none", stroke: "var(--ink)", "stroke-width": 1.5, "stroke-dasharray": "3 3" }, C.g));
        noisy.push(el("rect", { x: x, width: 36, rx: 3, fill: "var(--s1)", "fill-opacity": 0.75 }, C.g));
        el("text", { x: x + 18, y: C.h + 14, "text-anchor": "middle", "class": "t-small", text: NAMES[i] }, C.g);
      }
      el("text", { x: 30, y: 226, "class": "t-small", text: "dashed outline: the true count · filled: the released count" }, svg);
      var err = el("text", { x: 30, y: 254, "class": "t-big" }, svg);
      var sub = el("text", { x: 30, y: 276, "class": "t-small" }, svg);
      var verdict = el("text", { x: 30, y: 304, "class": "t-mid" }, svg);

      var R = T.chart(svg, { x: 400, y: 48, w: 210, h: 130, xDomain: [-4, 5], yDomain: [0, 1.15], yLabel: "how likely each output is" });
      var pWithout = el("path", { fill: "var(--s1)", "fill-opacity": 0.18, stroke: "var(--s1)", "stroke-width": 2.5 }, R.g);
      var pWith = el("path", { fill: "var(--s2)", "fill-opacity": 0.18, stroke: "var(--s2)", "stroke-width": 2.5 }, R.g);
      el("text", { x: R.px(-4), y: R.py(0) + 16, "class": "t-small", fill: "var(--s1)", text: "not in the data" }, R.g);
      el("text", { x: R.px(5), y: R.py(0) + 16, "text-anchor": "end", "class": "t-small", fill: "var(--s2)", text: "in the data (+1)" }, R.g);
      var fill = function (fn) { return R.path(fn, -4, 5, 120) + "L" + R.px(5) + " " + R.py(0) + "L" + R.px(-4) + " " + R.py(0) + "Z"; };

      return function (s) {
        var e = eps(s.e), b = 1 / e, shown = [];
        for (var i = 0; i < TRUE.length; i++) {
          var v = Math.max(0, Math.min(YMAX, TRUE[i] + b * L[i])); shown.push(v);
          T.set(truth[i], { y: C.py(TRUE[i]), height: C.h - C.py(TRUE[i]) });
          T.set(noisy[i], { y: C.py(v), height: Math.max(1, C.h - C.py(v)) });
        }
        T.set(pWithout, { d: fill(function (x) { return lap(x, b); }) });
        T.set(pWith, { d: fill(function (x) { return lap(x - 1, b); }) });
        var order = shown.slice().map(function (v, i) { return [v, i]; }).sort(function (p, q) { return q[0] - p[0]; }).map(function (p) { return p[1]; }).join("") === "012345";
        T.set(err, { text: "Typical error: ±" + (b < 10 ? b.toFixed(1) : Math.round(b)) + " people per count" });
        T.set(sub, { text: "one person can shift the odds of being detected by at most " + (Math.exp(e) < 10 ? Math.exp(e).toFixed(1) : Math.round(Math.exp(e))) + "×  ·  largest-to-smallest order " + (order ? "preserved" : "scrambled") });
        T.set(verdict, { text: e < 0.2 ? "Strong privacy, little accuracy" : e < 1.2 ? "A common middle ground" : "Accurate, but weaker guarantee", fill: e < 0.2 ? "var(--warn)" : e < 1.2 ? "var(--good)" : "var(--warn)" });
      };
    }
  });
})(window.Tradeoff);
