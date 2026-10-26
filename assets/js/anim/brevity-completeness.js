// Effectiveness = coverage (rises with length) × share of readers who finish (falls with length).
(function (T) {
  var K = { known: 80, new: 250 }, ATTN = 500, LMAX = 1000;
  var cover = function (L, a) { return 1 - Math.exp(-L / K[a]); };
  var reads = function (L) { return Math.exp(-L / ATTN); };
  var eff = function (L, a) { return cover(L, a) * reads(L); };
  var best = function (a) { return K[a] * Math.log(1 + ATTN / K[a]); };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A message that grows longer, readers dropping off, and curves for coverage, read-through and overall effectiveness.",
    vars: [
      { key: "L", label: "Message length", min: 20, max: LMAX, step: 5, value: 40, color: "var(--s1)", fmt: function (v) { return Math.round(v) + " words"; } },
      { key: "a", label: "Audience", type: "choice", value: "known", options: [{ value: "known", label: "Knows the context" }, { value: "new", label: "New to the topic" }] }
    ],
    scenario: [
      { caption: "A one-liner: everyone reads it, but key details are missing.", set: { L: 40, a: "known" } },
      { caption: "Around 150 words for a team that knows the context: the sweet spot.", set: { L: 160 }, dur: 1800, hold: 3000 },
      { caption: "A wall of text covers everything, and most readers stop before the important part.", set: { L: 800 }, dur: 2400, hold: 3200 },
      { caption: "For newcomers, more context is needed, so the sweet spot moves longer…", set: { L: 160, a: "new" }, dur: 1800, hold: 2400 },
      { caption: "…but it's still far from \"everything\". Lead with the ask, then add detail.", set: { L: 275 }, dur: 1600, hold: 3400 }
    ],
    setup: function (svg) {
      var el = T.el, cx0 = 30, cw = 230;
      var card = el("rect", { x: cx0, y: 30, width: cw, rx: 10, fill: "var(--surface-2)", stroke: "var(--line)" }, svg);
      el("rect", { x: cx0 + 14, y: 44, width: 120, height: 9, rx: 4, fill: "var(--ink)" }, svg);
      var lines = [];
      for (var i = 0; i < 16; i++) lines.push(el("rect", { x: cx0 + 14, y: 64 + i * 11, height: 6, rx: 3, fill: "var(--muted)", opacity: 0.55 }, svg));
      var words = el("text", { x: cx0, y: 18, "class": "t-small" }, svg);
      var people = [];
      for (var p = 0; p < 10; p++) {
        var g = el("g", { transform: "translate(" + (cx0 + 12 + p * 23) + ",270)" }, svg);
        el("circle", { cy: -8, r: 5, fill: "currentColor" }, g);
        el("path", { d: "M-8 8a8 7 0 0 1 16 0Z", fill: "currentColor" }, g);
        people.push(g);
      }
      var rd = el("text", { x: cx0, y: 304, "class": "t-small" }, svg);

      var c = T.chart(svg, { x: 330, y: 40, w: 280, h: 210, xDomain: [0, LMAX], yDomain: [0, 1], xLabel: "words →", yLabel: "share" });
      var pc = el("path", { fill: "none", stroke: "var(--s3)", "stroke-width": 2, "stroke-dasharray": "5 4" }, c.g);
      var pr = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "5 4" }, c.g);
      var pe = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 3 }, c.g);
      var bm = el("line", { y1: 0, y2: c.h, stroke: "var(--good)", "stroke-dasharray": "3 3" }, c.g);
      var bt = el("text", { y: c.h - 6, "class": "t-small", text: "sweet spot", fill: "var(--good)" }, c.g);
      var mk = el("circle", { r: 7, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, c.g);
      [["coverage", "var(--s3)"], ["read to the end", "var(--s2)"], ["message lands", "var(--s1)"]].forEach(function (l, i) {
        el("rect", { x: 330 + i * 98, y: 290, width: 10, height: 10, rx: 2, fill: l[1] }, svg);
        el("text", { x: 344 + i * 98, y: 299, "class": "t-small", text: l[0] }, svg);
      });

      return function (s) {
        var L = s.L, n = Math.max(1, Math.min(16, Math.round(L / 60) + 1));
        T.set(card, { height: 40 + n * 11 });
        lines.forEach(function (ln, i) {
          ln.style.display = i < n ? "" : "none";
          T.set(ln, { width: i === n - 1 ? 90 : 190 - (i * 37 % 40) });
        });
        T.set(words, { text: Math.round(L) + " words · covers " + Math.round(cover(L, s.a) * 100) + "% of what they need" });
        var r = reads(L), finish = Math.round(r * 10);
        people.forEach(function (g, i) { g.style.color = i < finish ? "var(--s2)" : "var(--line)"; });
        T.set(rd, { text: finish + " of 10 readers get to the end" });
        T.set(pc, { d: c.path(function (x) { return cover(x, s.a); }) });
        T.set(pr, { d: c.path(reads) });
        T.set(pe, { d: c.path(function (x) { return eff(x, s.a); }) });
        var b = best(s.a);
        T.set(bm, { x1: c.px(b), x2: c.px(b) });
        T.set(bt, { x: c.px(b) + 6 });
        T.set(mk, { cx: c.px(L), cy: c.py(eff(L, s.a)) });
      };
    }
  });
})(window.Tradeoff);
