// One-sided z-test. The test statistic is the observed average effect, with standard error 1/√n (in units of σ).
// Under "no effect" it centres on 0, under a real effect of 0.3σ it centres on 0.3. Call it "real" when the result lands above the decision line.
(function (T) {
  var EFFECT = 0.3, XMIN = -0.5, XMAX = 0.9;
  var erf = function (x) {
    var t = 1 / (1 + 0.3275911 * Math.abs(x));
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return x >= 0 ? y : -y;
  };
  var cdf = function (z) { return 0.5 * (1 + erf(z / Math.SQRT2)); };
  var zOf = function (p) { var lo = -6, hi = 6; for (var i = 0; i < 40; i++) { var m = (lo + hi) / 2; if (cdf(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; };
  var se = function (n) { return 1 / Math.sqrt(n); };
  var line = function (a, n) { return zOf(1 - a) * se(n); };
  var power = function (a, n) { return 1 - cdf((line(a, n) - EFFECT) / se(n)); };
  var bell = function (mu, n) { return function (x) { return Math.exp(-0.5 * Math.pow((x - mu) / se(n), 2)); }; };
  var pc = function (v) { return Math.round(v * 100) + "%"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Two bell curves for the test result when there is no effect and when there is a real effect, a movable decision line with shaded error areas, and a curve of power against sample size.",
    vars: [
      { key: "a", label: "False-alarm rate you accept (α)", min: 0.01, max: 0.2, step: 0.005, value: 0.05, color: "var(--s1)", fmt: pc },
      { key: "n", label: "Sample size", min: 10, max: 300, step: 5, value: 30, color: "var(--s2)", fmt: function (v) { return Math.round(v); } }
    ],
    scenario: [
      { caption: "A real but modest effect, 30 observations, and a 5% false-alarm rate. The test spots the effect only about half the time.", set: { a: 0.05, n: 30 }, hold: 3800 },
      { caption: "Be stricter (1%) to avoid false alarms, and the decision line moves right. Now the test misses the real effect three times in four.", set: { a: 0.01 }, dur: 2200, hold: 4000 },
      { caption: "Collect five times more data: both curves narrow, they overlap less, and you can be strict and still catch the effect.", set: { n: 150 }, dur: 2600, hold: 4000 },
      { caption: "Or loosen the rule to 20% with only 30 observations. You catch more real effects, but one in five 'discoveries' is noise.", set: { a: 0.2, n: 30 }, dur: 2600, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el;
      var C = T.chart(svg, { x: 30, y: 48, w: 330, h: 150, xDomain: [XMIN, XMAX], yDomain: [0, 1.15], xLabel: "measured effect →", yLabel: "how likely each result is" });
      var areaA = el("path", { fill: "var(--bad)", "fill-opacity": 0.5 }, C.g);
      var areaB = el("path", { fill: "var(--warn)", "fill-opacity": 0.45 }, C.g);
      var p0 = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, C.g);
      var p1 = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2.5 }, C.g);
      var cut = el("line", { y1: -4, y2: C.h, stroke: "var(--ink)", "stroke-width": 2 }, C.g);
      var cutT = el("text", { y: 2, "class": "t-small", fill: "var(--ink)", text: "decision line" }, C.g);
      el("text", { x: C.px(0), y: C.py(0) + 32, "text-anchor": "middle", "class": "t-small", fill: "var(--s1)", text: "no real effect" }, C.g);
      el("text", { x: C.px(EFFECT), y: C.py(0) + 32, "text-anchor": "middle", "class": "t-small", fill: "var(--s2)", text: "real effect" }, C.g);

      var big = el("text", { x: 30, y: 258, "class": "t-mid" }, svg);
      var t1 = el("text", { x: 30, y: 280, "class": "t-small" }, svg);
      var t2 = el("text", { x: 30, y: 300, "class": "t-small" }, svg);

      var R = T.chart(svg, { x: 418, y: 48, w: 192, h: 150, xDomain: [10, 300], yDomain: [0, 1], xLabel: "sample size →", yLabel: "power" });
      var pP = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2.5 }, R.g);
      el("line", { x1: 0, x2: R.w, y1: R.py(0.8), y2: R.py(0.8), stroke: "var(--good)", "stroke-dasharray": "4 4" }, R.g);
      el("text", { x: R.w - 2, y: R.py(0.8) - 5, "text-anchor": "end", "class": "t-small", fill: "var(--good)", text: "80% convention" }, R.g);
      var mk = el("circle", { r: 6, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2.5 }, R.g);

      var shade = function (fn, a, b) { // area under fn between a and b, down to the baseline
        a = Math.max(XMIN, a); b = Math.min(XMAX, b);
        if (b <= a) return "";
        return C.path(fn, a, b, 40) + "L" + C.px(b).toFixed(1) + " " + C.py(0) + "L" + C.px(a).toFixed(1) + " " + C.py(0) + "Z";
      };
      return function (s) {
        var a = s.a, n = Math.round(s.n), c = line(a, n), pw = power(a, n);
        var f0 = bell(0, n), f1 = bell(EFFECT, n);
        T.set(p0, { d: C.path(f0, XMIN, XMAX, 90) });
        T.set(p1, { d: C.path(f1, XMIN, XMAX, 90) });
        T.set(areaA, { d: shade(f0, c, XMAX) });
        T.set(areaB, { d: shade(f1, XMIN, c) });
        var cx = Math.max(0, Math.min(C.w, C.px(c)));
        T.set(cut, { x1: cx, x2: cx });
        T.set(cutT, { x: cx + (cx > C.w - 80 ? -4 : 4), "text-anchor": cx > C.w - 80 ? "end" : "start" });
        T.set(pP, { d: R.path(function (v) { return power(a, v); }, 10, 300, 60) });
        T.set(mk, { cx: R.px(n), cy: R.py(pw) });
        T.set(big, { text: "Power " + pc(pw) + " · false alarms " + pc(a) });
        T.set(t1, { text: "red: with no real effect, " + pc(a) + " of results still cross the line" });
        T.set(t2, { text: "orange: with a real effect, " + pc(1 - pw) + " of results fall short and are missed", fill: pw < 0.5 ? "var(--bad)" : pw < 0.8 ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
