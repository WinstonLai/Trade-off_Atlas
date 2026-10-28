// Weinberg's rule of thumb: each extra task in flight costs about 20% of the day in context switching.
(function (T) {
  var LOSS = 0.2, FLOOR = 0.2, EFFORT = 10; // days of focused work per task
  var useful = function (n) { return Math.max(FLOOR, 1 - LOSS * (n - 1)); };
  var firstDone = function (n) { return EFFORT * n / useful(n); }; // all tasks progress together, so the first finishes when they all do
  var MAXN = 5, MAXD = firstDone(MAXN), W = 300;

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "One person's day split between tasks in flight and time lost to switching, and curves of useful output and time to first delivery against tasks in flight.",
    vars: [
      { key: "n", label: "Tasks in flight at once", min: 1, max: MAXN, step: 1, value: 1, color: "var(--s1)", fmt: function (v) { return Math.round(v); } }
    ],
    scenario: [
      { caption: "One task at a time: all of the day goes into the work, and the first result arrives after 10 days.", set: { n: 1 }, hold: 3400 },
      { caption: "Three tasks in parallel: each swap costs a slice of the day, so only 60% is useful, and nothing finishes for 50 days.", set: { n: 3 }, dur: 2200, hold: 3800 },
      { caption: "Five at once: most of the day is lost to switching, and everything is late together.", set: { n: 5 }, dur: 2200, hold: 3800 },
      { caption: "A limit of two keeps most of the output and gets the first result out in 25 days. Finish something before you start something.", set: { n: 2 }, dur: 2200, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, y0 = 112;
      el("text", { x: x0, y: 34, "class": "t-label", text: "Tasks in flight" }, svg);
      var chips = [];
      for (var i = 0; i < MAXN; i++) chips.push(el("rect", { x: x0 + i * 30, y: 46, width: 22, height: 22, rx: 5, fill: "var(--s1)" }, svg));
      el("text", { x: x0, y: y0 - 8, "class": "t-label", text: "One person's day" }, svg);
      var segs = [];
      for (var j = 0; j < MAXN; j++) segs.push(el("rect", { y: y0, height: 40, stroke: "var(--surface)", "stroke-width": 2 }, svg));
      var lost = el("rect", { y: y0, height: 40, fill: "var(--bad)", "fill-opacity": 0.35 }, svg);
      var lostT = el("text", { y: y0 + 25, "text-anchor": "middle", "class": "t-small", fill: "var(--ink)", text: "switching" }, svg);

      var big = el("text", { x: x0, y: 224, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 246, "class": "t-small" }, svg);
      var first = el("text", { x: x0, y: 280, "class": "t-mid" }, svg);
      var cmp = el("text", { x: x0, y: 302, "class": "t-small" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [1, MAXN], yDomain: [0, 1], xLabel: "tasks in flight →", yLabel: "relative to the maximum" });
      el("path", { d: C.path(useful, 1, MAXN, 60), fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, C.g);
      el("path", { d: C.path(function (n) { return firstDone(n) / MAXD; }, 1, MAXN, 80), fill: "none", stroke: "var(--s2)", "stroke-width": 2.5, "stroke-dasharray": "6 5" }, C.g);
      el("text", { x: C.px(1.1), y: C.py(0.9), "class": "t-small", fill: "var(--s1)", text: "useful share of the day" }, C.g);
      el("text", { x: C.px(2.6), y: C.py(0.12), "class": "t-small", fill: "var(--s2)", text: "time to first result" }, C.g);
      var mU = el("circle", { r: 6, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      var mD = el("circle", { r: 6, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);

      return function (s) {
        var n = s.n, k = Math.round(n), u = useful(n), fd = firstDone(n);
        chips.forEach(function (c, i) { T.set(c, { opacity: i < k ? 1 : 0.15 }); });
        var x = x0;
        segs.forEach(function (r, i) {
          var w = i < k ? u / k * W : 0;
          T.set(r, { x: x, width: w, fill: i % 2 ? "var(--s2)" : "var(--s1)" });
          x += w;
        });
        T.set(lost, { x: x, width: W - (x - x0) });
        T.set(lostT, { x: x + (W - (x - x0)) / 2, opacity: W - (x - x0) > 70 ? 1 : 0 });
        T.set(mU, { cx: C.px(n), cy: C.py(u) });
        T.set(mD, { cx: C.px(n), cy: C.py(fd / MAXD) });
        T.set(big, { text: Math.round(u * 100) + "% of the day is useful work" });
        T.set(sub, { text: k > 1 ? k + " tasks × time to refocus after each swap" : "no swapping, no loss" });
        T.set(first, { text: "First result after " + Math.round(fd) + " days", fill: fd > 40 ? "var(--bad)" : fd > 15 ? "var(--warn)" : "var(--good)" });
        T.set(cmp, { text: "One at a time: " + EFFORT + " days, then the next one every " + EFFORT + " days" });
      };
    }
  });
})(window.Tradeoff);
