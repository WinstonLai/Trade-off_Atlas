// Technical terms say exactly what you mean, but only to a reader who knows them. What the reader actually receives = understood × exact.
(function (T) {
  var VOCAB = { expert: 0.9, novice: 0.25 };
  var understood = function (d, a) { return Math.max(0, 1 - 1.1 * d * (1 - VOCAB[a])); };
  var exact = function (d) { return 0.35 + 0.65 * Math.pow(d, 0.7); };
  var received = function (d, a) { return understood(d, a) * exact(d); };
  var best = function (a) { var b = 0, bv = 0; for (var d = 0; d <= 1; d += 0.005) if (received(d, a) > bv) { bv = received(d, a); b = d; } return b; };
  var BEST = { expert: best("expert"), novice: best("novice") };
  var pc = function (v) { return Math.round(v * 100) + "%"; };
  var SAMPLE = [
    ["The system sometimes shows old info", "right after you save a change."],
    ["Reads can return stale data right after", "a write, until the copies catch up."],
    ["Follower reads may return stale values", "until replication lag clears", "(eventual consistency)."]
  ];

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "The same sentence written at three levels of technical detail, bars for how much the reader understands and how exact the message is, and curves of what is received against technical density.",
    vars: [
      { key: "d", label: "How technical the wording is", min: 0, max: 1, step: 0.01, value: 0.1, color: "var(--s1)", fmt: function (v) { return v < 0.33 ? "Plain" : v < 0.67 ? "Mixed" : "Technical"; } },
      { key: "a", label: "Who is reading?", type: "choice", value: "novice",
        options: [{ value: "novice", label: "Newcomers" }, { value: "expert", label: "Specialists" }] }
    ],
    scenario: [
      { caption: "Plain wording for a newcomer: easy to follow, but vague. It doesn't say what actually goes wrong or why.", set: { d: 0.05, a: "novice" }, hold: 3800 },
      { caption: "Add a few precise terms and the message becomes accurate while still readable. About here a newcomer gets the most.", set: { d: 0.3 }, dur: 2200, hold: 3800 },
      { caption: "Full technical language is exact, but a newcomer loses most of it, and the exactness never arrives.", set: { d: 1 }, dur: 2200, hold: 3800 },
      { caption: "The same words for specialists: they understand every term, and the extra precision is useful. Match the words to the reader.", set: { a: "expert" }, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30;
      el("text", { x: x0, y: 36, "class": "t-label", text: "The same message, at this level" }, svg);
      var lines = [];
      for (var i = 0; i < 3; i++) lines.push(el("text", { x: x0, y: 62 + i * 20, "class": "t-mid", "font-weight": 600 }, svg));
      var BW = 200, by = 142;
      var rows = {};
      [["u", "Reader understands it", by, "var(--s1)"], ["e", "Says exactly what you mean", by + 34, "var(--s2)"], ["r", "What the reader actually gets", by + 68, "var(--good)"]].forEach(function (b) {
        el("text", { x: x0, y: b[2], "class": "t-small", text: b[1] }, svg);
        el("rect", { x: x0, y: b[2] + 5, width: BW, height: 12, rx: 6, fill: "var(--surface-2)" }, svg);
        rows[b[0]] = { bar: el("rect", { x: x0, y: b[2] + 5, height: 12, rx: 6, fill: b[3] }, svg), val: el("text", { x: x0 + BW + 10, y: b[2] + 15, "class": "t-small" }, svg) };
      });
      var verdict = el("text", { x: x0, y: 292, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 400, y: 48, w: 210, h: 190, xDomain: [0, 1], yDomain: [0, 1], xLabel: "more technical →", yLabel: "share" });
      var pU = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      el("path", { d: C.path(exact, 0, 1, 50), fill: "none", stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pR = el("path", { fill: "none", stroke: "var(--good)", "stroke-width": 3 }, C.g);
      var bestLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4", opacity: 0.6 }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--good)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      el("text", { x: C.px(0.04), y: C.py(0.3), "class": "t-small", fill: "var(--s2)", text: "exact" }, C.g);
      el("text", { x: C.px(0.6), y: C.py(0.16), "class": "t-small", fill: "var(--s1)", text: "understood" }, C.g);

      return function (s) {
        var d = s.d, a = s.a, u = understood(d, a), e = exact(d), r = received(d, a), tb = received(BEST[a], a);
        var sample = SAMPLE[d < 0.33 ? 0 : d < 0.67 ? 1 : 2];
        lines.forEach(function (l, i) { T.set(l, { text: sample[i] || "" }); });
        [["u", u], ["e", e], ["r", r]].forEach(function (p) { T.set(rows[p[0]].bar, { width: Math.max(4, BW * p[1]) }); T.set(rows[p[0]].val, { text: pc(p[1]) }); });
        T.set(pU, { d: C.path(function (x) { return understood(x, a); }, 0, 1, 40) });
        T.set(pR, { d: C.path(function (x) { return received(x, a); }, 0, 1, 80) });
        T.set(bestLine, { x1: C.px(BEST[a]), x2: C.px(BEST[a]) });
        T.set(mk, { cx: C.px(d), cy: C.py(r) });
        T.set(verdict, { text: r > tb * 0.95 ? "About the right level for this reader" : r > tb * 0.75 ? "Workable, but could land better" : (d > BEST[a] ? "Too technical for this reader" : "Too vague for this reader"), fill: r > tb * 0.95 ? "var(--good)" : r > tb * 0.75 ? "var(--warn)" : "var(--bad)" });
      };
    }
  });
})(window.Tradeoff);
