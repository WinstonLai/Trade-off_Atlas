// Polynomial fits to 12 noisy points: training error keeps falling, error on new data is U-shaped.
(function (T) {
  var NTR = 12, DEG = 9;
  var truth = function (x) { return 0.5 + 0.34 * Math.sin(2.1 * Math.PI * x); };
  var seed = 11;
  var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 - 0.5; };
  var train = [], test = [], i;
  for (i = 0; i < NTR; i++) { var x = (i + 0.5) / NTR; train.push({ x: x, y: truth(x) + rnd() * 0.22 }); }
  for (i = 0; i < 60; i++) { var xt = (i + 0.5) / 60; test.push({ x: xt, y: truth(xt) + rnd() * 0.22 }); }

  // least-squares polynomial of degree d via the normal equations (inputs rescaled to [-1, 1])
  function fit(d) {
    var n = d + 1, A = [], b = [], r, c, k;
    for (r = 0; r < n; r++) { A.push([]); b.push(0); for (c = 0; c < n; c++) A[r].push(0); }
    train.forEach(function (p) {
      var u = 2 * p.x - 1, pw = [1];
      for (k = 1; k < 2 * n; k++) pw.push(pw[k - 1] * u);
      for (r = 0; r < n; r++) { b[r] += pw[r] * p.y; for (c = 0; c < n; c++) A[r][c] += pw[r + c]; }
    });
    for (r = 0; r < n; r++) A[r][r] += 1e-9;
    for (c = 0; c < n; c++) {
      var piv = c;
      for (r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      var tA = A[c]; A[c] = A[piv]; A[piv] = tA;
      var tb = b[c]; b[c] = b[piv]; b[piv] = tb;
      for (r = c + 1; r < n; r++) {
        var f = A[r][c] / A[c][c];
        for (k = c; k < n; k++) A[r][k] -= f * A[c][k];
        b[r] -= f * b[c];
      }
    }
    var w = new Array(n);
    for (r = n - 1; r >= 0; r--) { var s = b[r]; for (k = r + 1; k < n; k++) s -= A[r][k] * w[k]; w[r] = s / A[r][r]; }
    return function (x) { var u = 2 * x - 1, y = 0; for (var q = n - 1; q >= 0; q--) y = y * u + w[q]; return y; };
  }
  var mse = function (fn, pts) { return pts.reduce(function (a, p) { return a + Math.pow(fn(p.x) - p.y, 2); }, 0) / pts.length; };

  var FIT = [], TR = [], TE = [];
  for (var d = 1; d <= DEG; d++) { FIT[d] = fit(d); TR[d] = mse(FIT[d], train); TE[d] = mse(FIT[d], test); }
  var YMAX = 0.04;

  var verdict = function (d) {
    return d <= 2 ? "Too simple (high bias): misses the pattern" : d <= 5 ? "About right: captures the pattern, ignores the noise" : "Too flexible (high variance): memorises the noise";
  };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A polynomial curve fitted to noisy points, next to a chart of training error and error on new data against model complexity.",
    vars: [
      { key: "d", label: "Model complexity (polynomial degree)", min: 1, max: DEG, step: 1, value: 1, color: "var(--s1)", fmt: function (v) { return String(Math.round(v)); } }
    ],
    scenario: [
      { caption: "A straight line is too simple: it misses the curve, so it's wrong on training data and on new data alike.", set: { d: 1 }, hold: 3400 },
      { caption: "Degree 3 follows the real pattern. Error on new data is close to its lowest.", set: { d: 3 }, dur: 1800, hold: 3200 },
      { caption: "Degree 9 passes through nearly every training point, noise included. Training error is tiny and error on new data balloons.", set: { d: 9 }, dur: 2400, hold: 4200 }
    ],
    setup: function (svg) {
      var el = T.el;
      var L = T.chart(svg, { x: 30, y: 48, w: 290, h: 200, xDomain: [0, 1], yDomain: [-0.1, 1.1], xLabel: "input →", yLabel: "output" });
      el("path", { d: L.path(truth), fill: "none", stroke: "var(--muted)", "stroke-width": 1.5, "stroke-dasharray": "4 4" }, L.g);
      test.forEach(function (p) { el("circle", { cx: L.px(p.x), cy: L.py(p.y), r: 2, fill: "var(--s2)", opacity: 0.4 }, L.g); });
      var fitP = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 2.5, "stroke-linejoin": "round" }, L.g);
      train.forEach(function (p) { el("circle", { cx: L.px(p.x), cy: L.py(p.y), r: 4.5, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 1.5 }, L.g); });

      var ly = 282;
      el("circle", { cx: 36, cy: ly, r: 4, fill: "var(--s1)" }, svg);
      el("text", { x: 46, y: ly + 4, "class": "t-small", text: "training data" }, svg);
      el("circle", { cx: 130, cy: ly, r: 3, fill: "var(--s2)", opacity: 0.6 }, svg);
      el("text", { x: 140, y: ly + 4, "class": "t-small", text: "new data" }, svg);
      el("line", { x1: 206, x2: 224, y1: ly, y2: ly, stroke: "var(--muted)", "stroke-dasharray": "4 4" }, svg);
      el("text", { x: 230, y: ly + 4, "class": "t-small", text: "true pattern" }, svg);
      var head = el("text", { x: 30, y: 26, "class": "t-label" }, svg);

      var R = T.chart(svg, { x: 392, y: 48, w: 218, h: 200, xDomain: [1, DEG], yDomain: [0, YMAX], xLabel: "complexity →", yLabel: "error" });
      var line = function (arr) { var s = ""; for (var k = 1; k <= DEG; k++) s += (k > 1 ? "L" : "M") + R.px(k).toFixed(1) + " " + R.py(Math.min(arr[k], YMAX)).toFixed(1); return s; };
      el("path", { d: line(TR), fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, R.g);
      el("path", { d: line(TE), fill: "none", stroke: "var(--s2)", "stroke-width": 2.5 }, R.g);
      el("text", { x: R.px(DEG) - 4, y: R.h - 8, "text-anchor": "end", "class": "t-small", fill: "var(--s1)", text: "training" }, R.g);
      el("text", { x: R.px(7.4), y: 12, "text-anchor": "end", "class": "t-small", fill: "var(--s2)", text: "new data" }, R.g);
      var vline = el("line", { y1: 0, y2: R.h, stroke: "var(--line)", "stroke-dasharray": "3 3" }, R.g);
      var mTr = el("circle", { r: 6, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2.5 }, R.g);
      var mTe = el("circle", { r: 6, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2.5 }, R.g);
      var vals = el("text", { x: 392, y: 286, "class": "t-mid" }, svg);

      return function (s) {
        var dd = T.clamp(s.d, 1, DEG), lo = Math.floor(dd), hi = Math.min(DEG, lo + 1), f = dd - lo;
        var fl = FIT[lo], fh = FIT[hi];
        T.set(fitP, { d: L.path(function (x) { return T.lerp(fl(x), fh(x), f); }, 0, 1, 90) });
        var tr = T.lerp(TR[lo], TR[hi], f), te = T.lerp(TE[lo], TE[hi], f);
        T.set(vline, { x1: R.px(dd), x2: R.px(dd) });
        T.set(mTr, { cx: R.px(dd), cy: R.py(Math.min(tr, YMAX)) });
        T.set(mTe, { cx: R.px(dd), cy: R.py(Math.min(te, YMAX)) });
        T.set(head, { text: "Degree " + Math.round(dd) + ": " + verdict(Math.round(dd)) });
        T.set(vals, { text: "train " + tr.toFixed(3) + " · new data " + (te > 0.1 ? ">0.1" : te.toFixed(3)) });
      };
    }
  });
})(window.Tradeoff);
