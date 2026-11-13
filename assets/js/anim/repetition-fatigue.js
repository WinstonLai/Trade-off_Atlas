// Two-factor view of repetition: understanding builds with each exposure, and so does tedium. Impact = understood × (1 − tuned out).
// Complex messages take longer to land (τ), and varying the wording delays the onset of tedium.
(function (T) {
  var MAXN = 12, TAU = { simple: 1.5, complex: 4 };
  var learn = function (n, m) { return 1 - Math.exp(-n / TAU[m]); };
  var onset = function (v) { return 5 + 6 * v; };
  var tire = function (n, v) { var r = n / onset(v); return 1 - Math.exp(-r * r); };
  var impact = function (n, v, m) { return learn(n, m) * (1 - tire(n, v)); };
  var best = function (v, m) { var bn = 0, bi = -1; for (var n = 0; n <= MAXN; n += 0.05) { var i = impact(n, v, m); if (i > bi) { bi = i; bn = n; } } return bn; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A row of exposures to a message coloured by whether they still help, meters for understanding, tedium and net impact, and curves of each against the number of repetitions.",
    vars: [
      { key: "n", label: "Times they hear it", min: 0, max: MAXN, step: 1, value: 1, color: "var(--s1)", fmt: function (v) { return Math.round(v); } },
      { key: "v", label: "Variety in how you say it", min: 0, max: 1, step: 0.05, value: 0, color: "var(--s2)", fmt: function (v) { return Math.round(v * 100) + "%"; } },
      { key: "m", label: "What are you saying?", type: "choice", value: "simple",
        options: [{ value: "simple", label: "Simple reminder" }, { value: "complex", label: "Complex change" }] }
    ],
    scenario: [
      { caption: "Said once, a message is easy to miss. Many people never register it.", set: { n: 1, v: 0, m: "simple" }, hold: 3400 },
      { caption: "A couple more times and nearly everyone has taken it in, with little irritation yet.", set: { n: 3 }, dur: 2000, hold: 3600 },
      { caption: "The same words nine times: understanding is maxed out, but people are tuning out. Impact has collapsed.", set: { n: 9 }, dur: 2400, hold: 4000 },
      { caption: "Say it differently each time (new example, new channel, new voice) and fatigue arrives much later. The same nine repeats now reach half the audience.", set: { v: 1 }, dur: 2000, hold: 4200 },
      { caption: "A complex change takes more repeats to land, so the best number moves right. Repeat it in new forms, and stop once it has landed.", set: { m: "complex", n: 5, v: 0.6 }, dur: 2400, hold: 4400 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330;
      el("text", { x: x0, y: 30, "class": "t-label", text: "Each time they hear it" }, svg);
      var dots = [];
      for (var i = 0; i < MAXN; i++) dots.push(el("circle", { cx: x0 + 11 + i * 27.5, cy: 54, r: 10, stroke: "var(--line)", "stroke-width": 2 }, svg));
      el("text", { x: x0, y: 84, "class": "t-small", text: "blue = still helping · orange = past the peak" }, svg);

      var meter = function (y, label, color) {
        el("text", { x: x0, y: y, "class": "t-small", text: label }, svg);
        el("rect", { x: x0, y: y + 6, width: W, height: 14, rx: 7, fill: "var(--line)" }, svg);
        return el("rect", { x: x0, y: y + 6, height: 14, rx: 7, fill: color }, svg);
      };
      var mL = meter(114, "Understood it", "var(--s1)");
      var mT = meter(156, "Tuned out or irritated", "var(--s2)");
      var mI = meter(198, "Got the message and not put off", "var(--ink)");

      var big = el("text", { x: x0, y: 262, "class": "t-big" }, svg);
      var verdict = el("text", { x: x0, y: 294, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, MAXN], yDomain: [0, 1], xLabel: "times they hear it →", yLabel: "share of the audience" });
      var pL = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pT = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pI = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var bestLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      el("text", { x: C.px(7.6), y: -6, "class": "t-small", fill: "var(--s1)", text: "understood" }, C.g);
      el("text", { x: C.px(7.6), y: C.py(0.48), "class": "t-small", fill: "var(--s2)", text: "tuned out" }, C.g);

      return function (s) {
        var n = s.n, v = s.v, m = s.m, k = Math.round(n), bn = best(v, m), im = impact(n, v, m), top = impact(bn, v, m);
        dots.forEach(function (d, i) { T.set(d, { fill: i < k ? (i + 1 <= bn + 0.5 ? "var(--s1)" : "var(--s2)") : "var(--surface)" }); });
        T.set(mL, { width: Math.max(14, W * learn(n, m)) });
        T.set(mT, { width: Math.max(14, W * tire(n, v)) });
        T.set(mI, { width: Math.max(14, W * im) });
        T.set(pL, { d: C.path(function (x) { return learn(x, m); }, 0, MAXN, 40) });
        T.set(pT, { d: C.path(function (x) { return tire(x, v); }, 0, MAXN, 40) });
        T.set(pI, { d: C.path(function (x) { return impact(x, v, m); }, 0, MAXN, 60) });
        T.set(bestLine, { x1: C.px(bn), x2: C.px(bn) });
        T.set(mk, { cx: C.px(n), cy: C.py(im) });
        T.set(big, { text: Math.round(im * 100) + "% get it and aren't put off" });
        T.set(verdict, { text: im > top * 0.9 ? "Near the best number of repeats" : n < bn ? "Too few repeats: say it again (about " + Math.round(bn) + ")" : "Past the peak: more repeats now hurt", fill: im > top * 0.9 ? "var(--good)" : n < bn ? "var(--warn)" : "var(--bad)" });
      };
    }
  });
})(window.Tradeoff);
