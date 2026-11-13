// Each task typically takes 5 days. Padding every task by p days commits n × p extra days.
// Pooling takes the padding out and adds one buffer of p × √n: overruns and underruns offset (tasks assumed independent).
(function (T) {
  var MED = 5, MAXN = 12, MAXP = 6, MAXD = (MED + MAXP) * MAXN, W = 330, SC = W / MAXD;
  var padded = function (n, p) { return (MED + p) * n; };
  var buffer = function (n, p) { return p * Math.sqrt(n); };
  var pooled = function (n, p) { return MED * n + buffer(n, p); };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Two schedules for the same chain of tasks: one with padding inside every task, one with the padding pooled into a single shorter buffer at the end, and curves of days committed against number of tasks.",
    vars: [
      { key: "n", label: "Tasks in the chain", min: 1, max: MAXN, step: 1, value: 8, color: "var(--s1)", fmt: function (v) { return Math.round(v); } },
      { key: "p", label: "Safety padding per task", min: 1, max: MAXP, step: 0.5, value: 5, color: "var(--s2)", fmt: function (v) { return v.toFixed(1) + " days"; } }
    ],
    scenario: [
      { caption: "Eight tasks that typically take 5 days. Each owner adds 5 days of padding to be safe, so the plan commits 80 days.", set: { n: 8, p: 5 }, hold: 3800 },
      { caption: "Pool the padding: strip it out and keep one buffer at the end. Overruns on some tasks cancel underruns on others, so about 14 days covers the same risk. The plan is 54 days.", set: { n: 8 }, hold: 4600 },
      { caption: "With only two tasks there is little to offset, so pooling saves just a few days.", set: { n: 2 }, dur: 2000, hold: 3600 },
      { caption: "The longer the chain, the more the individual risks cancel. At twelve tasks the pooled plan is over a third shorter.", set: { n: 12 }, dur: 2400, hold: 4000 },
      { caption: "The catch: pooled buffer only works if it is protected. If tasks start late because \"there's buffer\", the saving is gone.", set: { n: 8 }, dur: 2000, hold: 4200 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, h = 26;
      var rowA = 64, rowB = 144;
      el("text", { x: x0, y: rowA - 10, "class": "t-label", text: "Pad every task" }, svg);
      el("text", { x: x0, y: rowB - 10, "class": "t-label", text: "Pool one buffer at the end" }, svg);
      var mk = function (y, fill, op) { return el("rect", { y: y, height: h, rx: 3, fill: fill, opacity: op, stroke: "var(--surface)", "stroke-width": 1.5 }, svg); };
      var aw = [], ap = [], bw = [];
      for (var i = 0; i < MAXN; i++) { aw.push(mk(rowA, "var(--s1)", 1)); ap.push(mk(rowA, "var(--s2)", 0.55)); bw.push(mk(rowB, "var(--s1)", 1)); }
      var bb = mk(rowB, "var(--s2)", 0.55);
      var ta = el("text", { x: x0, y: rowA + h + 18, "class": "t-small" }, svg);
      var tb = el("text", { x: x0, y: rowB + h + 18, "class": "t-small" }, svg);
      el("text", { x: x0, y: 214, "class": "t-small", text: "blue = typical work · orange = safety margin" }, svg);

      var big = el("text", { x: x0, y: 252, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 274, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 304, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [1, MAXN], yDomain: [0, MAXD], xLabel: "tasks in the chain →", yLabel: "days committed" });
      el("path", { d: C.path(function (n) { return padded(n, 5); }, 1, MAXN, 2), fill: "none", stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "5 4", opacity: 0.35 }, C.g);
      var pA = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2.5 }, C.g);
      var pB = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, C.g);
      var mA = el("circle", { r: 6, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      var mB = el("circle", { r: 6, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      el("text", { x: C.px(1.4), y: C.py(MAXD - 16), "class": "t-small", fill: "var(--s2)", text: "pad every task" }, C.g);
      el("text", { x: C.px(5.5), y: C.py(24), "class": "t-small", fill: "var(--s1)", text: "pool one buffer" }, C.g);

      return function (s) {
        var n = Math.round(s.n), p = s.p;
        var xa = x0, xb = x0;
        for (var i = 0; i < MAXN; i++) {
          var on = i < n, ww = on ? MED * SC : 0, pw = on ? p * SC : 0;
          T.set(aw[i], { x: xa, width: ww }); xa += ww;
          T.set(ap[i], { x: xa, width: pw }); xa += pw;
          T.set(bw[i], { x: xb, width: ww }); xb += ww;
        }
        T.set(bb, { x: xb, width: buffer(n, p) * SC });
        var a = padded(n, p), b = pooled(n, p), save = a - b, pct = save / a;
        T.set(ta, { text: Math.round(a) + " days committed (" + n + " × " + (MED + p).toFixed(p % 1 ? 1 : 0) + ")" });
        T.set(tb, { text: Math.round(b) + " days committed (" + MED * n + " of work + " + Math.round(buffer(n, p)) + " buffer)" });
        T.set(pA, { d: C.path(function (k) { return padded(k, p); }, 1, MAXN, 2) });
        T.set(pB, { d: C.path(function (k) { return pooled(k, p); }, 1, MAXN, 40) });
        T.set(mA, { cx: C.px(n), cy: C.py(a) });
        T.set(mB, { cx: C.px(n), cy: C.py(b) });
        T.set(big, { text: save < 0.5 ? "Nothing to pool with one task" : "Pooling saves " + Math.round(save) + " days (" + Math.round(pct * 100) + "%)" });
        T.set(sub, { text: "Similar protection against the chain overrunning, if the tasks overrun independently" });
        T.set(verdict, { text: pct > 0.25 ? "Worth pooling" : pct > 0.08 ? "A modest saving" : "Little to gain", fill: pct > 0.25 ? "var(--good)" : pct > 0.08 ? "var(--warn)" : "var(--muted)" });
      };
    }
  });
})(window.Tradeoff);
