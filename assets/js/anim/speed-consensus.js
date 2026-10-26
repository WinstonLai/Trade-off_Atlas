// Buy-in saturates as people join; decision time grows faster than linearly.
// The value of waiting depends on how costly a wrong call is to undo.
(function (T) {
  var NMAX = 12;
  var buyin = function (n) { return 1 - Math.exp(-n / 3); };
  var days = function (n) { return 0.5 * Math.pow(n, 1.4); };
  var W = { two: [1, 0.12], one: [1.6, 0.02] };
  var value = function (n, k) { return W[k][0] * buyin(n) - W[k][1] * days(n); };
  var bestN = function (k) { var b = 1; for (var n = 1; n <= NMAX; n++) if (value(n, k) > value(b, k)) b = n; return b; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Stakeholders gather around a decision while a clock fills, beside curves for buy-in and decision time.",
    vars: [
      { key: "n", label: "People consulted", min: 1, max: NMAX, step: 1, value: 1, color: "var(--s1)", fmt: function (v) { return Math.round(v); } },
      { key: "k", label: "Kind of decision", type: "choice", value: "two", options: [{ value: "two", label: "Reversible (two-way door)" }, { value: "one", label: "Hard to undo (one-way door)" }] }
    ],
    scenario: [
      { caption: "Decide alone: instant, but nobody else is bought in.", set: { n: 1, k: "two" } },
      { caption: "Consult a few key people: still fast, with enough buy-in for a call you can reverse.", set: { n: 3 }, dur: 1600, hold: 3000 },
      { caption: "Ask everyone: strong buy-in, but the decision now takes weeks.", set: { n: 12 }, dur: 2400, hold: 3000 },
      { caption: "For a one-way-door decision, being wrong is expensive…", set: { n: 3, k: "one" }, dur: 1600, hold: 2400 },
      { caption: "…so the wider input is worth the wait. Match inclusion to reversibility.", set: { n: 8 }, dur: 2000, hold: 3600 }
    ],
    setup: function (svg) {
      var el = T.el, cx = 170, cy = 160, R = 112;
      var spokes = el("g", {}, svg);
      var clockBg = el("circle", { cx: cx, cy: cy, r: 44, fill: "var(--surface-2)" }, svg);
      var clock = el("circle", { cx: cx, cy: cy, r: 44, fill: "none", stroke: "var(--s2)", "stroke-width": 6, transform: "rotate(-90 " + cx + " " + cy + ")" }, svg);
      el("text", { x: cx, y: cy - 4, "text-anchor": "middle", "class": "t-label", text: "Decision" }, svg);
      var dT = el("text", { x: cx, y: cy + 14, "text-anchor": "middle", "class": "t-small t-mono" }, svg);
      var people = [], lines = [];
      for (var i = 0; i < NMAX; i++) {
        var a = -Math.PI / 2 + i / NMAX * Math.PI * 2;
        var x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
        lines.push(el("line", { x1: x, y1: y, x2: cx + Math.cos(a) * 48, y2: cy + Math.sin(a) * 48, stroke: "var(--s1)", "stroke-width": 1.5, "stroke-dasharray": "3 3" }, spokes));
        var g = el("g", { transform: "translate(" + x + "," + y + ")" }, svg);
        var body = el("circle", { r: 13, fill: "var(--surface-2)", stroke: "var(--line)", "stroke-width": 2 }, g);
        var tick = el("path", { d: "M-5 0l3.5 4 6.5-8", fill: "none", stroke: "var(--bg)", "stroke-width": 2.5, "stroke-linecap": "round" }, g);
        people.push({ body: body, tick: tick });
      }
      var c = T.chart(svg, { x: 360, y: 46, w: 250, h: 200, xDomain: [1, NMAX], yDomain: [0, 1], xLabel: "people consulted →", yLabel: "" });
      el("path", { d: c.path(buyin), fill: "none", stroke: "var(--s3)", "stroke-width": 2.5 }, c.g);
      el("path", { d: c.path(function (n) { return days(n) / days(NMAX); }), fill: "none", stroke: "var(--s2)", "stroke-width": 2.5, "stroke-dasharray": "6 4" }, c.g);
      var bm = el("line", { y1: 0, y2: c.h, stroke: "var(--good)", "stroke-dasharray": "3 3" }, c.g);
      var bt = el("text", { y: -6, "class": "t-small", text: "sweet spot", fill: "var(--good)", "text-anchor": "middle" }, c.g);
      var mkB = el("circle", { r: 6, fill: "var(--s3)", stroke: "var(--surface)", "stroke-width": 2 }, c.g);
      var mkT = el("circle", { r: 6, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2 }, c.g);
      [["buy-in", "var(--s3)"], ["time to decide", "var(--s2)"]].forEach(function (l, i) {
        el("rect", { x: 360 + i * 90, y: 286, width: 10, height: 10, rx: 2, fill: l[1] }, svg);
        el("text", { x: 374 + i * 90, y: 295, "class": "t-small", text: l[0] }, svg);
      });
      var verdict = el("text", { x: 360, y: 318, "class": "t-small" }, svg);

      return function (s, t) {
        var n = Math.round(s.n), d = days(s.n);
        people.forEach(function (p, i) {
          var on = i < n;
          var agreed = on && ((t / 500) % (NMAX + 4)) > i * 0.6;
          T.set(p.body, { fill: on ? (agreed ? "var(--s3)" : "var(--s1)") : "var(--surface-2)", stroke: on ? "var(--surface)" : "var(--line)" });
          p.tick.style.display = agreed ? "" : "none";
          lines[i].style.display = on ? "" : "none";
          T.set(lines[i], { "stroke-dashoffset": -(t / 50) % 6 });
        });
        var circ = 2 * Math.PI * 44;
        T.set(clock, { "stroke-dasharray": (circ * d / days(NMAX)) + " " + circ });
        T.set(dT, { text: d < 1 ? "same day" : Math.round(d) + " days" });
        var b = bestN(s.k);
        T.set(bm, { x1: c.px(b), x2: c.px(b) });
        T.set(bt, { x: c.px(b) });
        T.set(mkB, { cx: c.px(s.n), cy: c.py(buyin(s.n)) });
        T.set(mkT, { cx: c.px(s.n), cy: c.py(d / days(NMAX)) });
        T.set(verdict, { text: n < b ? "Too narrow for this kind of decision" : n > b + 1 ? "More voices than this decision needs" : "About right for this kind of decision", fill: Math.abs(n - b) <= 1 ? "var(--good)" : "var(--warn)" });
      };
    }
  });
})(window.Tradeoff);
