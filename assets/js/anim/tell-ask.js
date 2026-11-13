// a is the share of your turns spent asking. What you know grows with asking (less so if you already have most of the picture),
// buy-in grows with how much they were heard, and clarity about your own view falls as you say less. Score is their geometric mean, less a time cost.
(function (T) {
  var SIT = { open: { w: 0.9, tau: 0.05 }, urgent: { w: 0.15, tau: 0.35 } };
  var know = function (a, s) { return SIT[s].w * (1 - Math.exp(-3 * a)) + (1 - SIT[s].w); };
  var buyin = function (a) { return Math.sqrt(a); };
  var clarity = function (a) { return 1 - Math.pow(a, 1.5); };
  var score = function (a, s) { return Math.cbrt(know(a, s) * buyin(a) * clarity(a)) - SIT[s].tau * a; };
  var best = function (s) { var ba = 0, bs = -1; for (var a = 0; a <= 1.0001; a += 0.01) { var v = score(a, s); if (v > bs) { bs = v; ba = a; } } return ba; };
  var BEST = { open: best("open"), urgent: best("urgent") };
  var TURNS = 20;

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A row of twenty conversational turns split between asking and telling, meters for what you know, their buy-in and the clarity of your view, and curves of each against the share of turns spent asking.",
    vars: [
      { key: "a", label: "Share of your turns spent asking", min: 0, max: 1, step: 0.01, value: 0, color: "var(--s1)", fmt: function (v) { return Math.round(v * 100) + "%"; } },
      { key: "s", label: "The situation", type: "choice", value: "open",
        options: [{ value: "open", label: "Open question" }, { value: "urgent", label: "Urgent, you know the answer" }] }
    ],
    scenario: [
      { caption: "Telling only: your view is perfectly clear and it's quick, but you learn nothing new and nobody feels heard.", set: { a: 0, s: "open" }, hold: 3800 },
      { caption: "Asking only: people feel heard, but they never find out what you think. You gather a lot and commit to nothing.", set: { a: 1 }, dur: 2600, hold: 3800 },
      { caption: "A mix: state your view, then ask what they see differently. For an open question this is near the best.", set: { a: 0.5 }, dur: 2200, hold: 4000 },
      { caption: "When it's urgent and you already know the answer, extra questions mostly cost time, so the same mix scores lower.", set: { s: "urgent" }, hold: 4000 },
      { caption: "Tell more, ask a little: enough to check you haven't missed something and to give people a say.", set: { a: 0.25 }, dur: 2000, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330;
      el("text", { x: x0, y: 30, "class": "t-label", text: "Your share of the conversation" }, svg);
      var cw = W / TURNS, rects = [], marks = [];
      for (var i = 0; i < TURNS; i++) {
        rects.push(el("rect", { x: x0 + i * cw + 1, y: 40, width: cw - 2, height: 24, rx: 4 }, svg));
        marks.push(el("text", { x: x0 + i * cw + cw / 2, y: 57, "text-anchor": "middle", "class": "t-label", fill: "#fff" }, svg));
      }
      el("text", { x: x0, y: 82, "class": "t-small", text: "? = you ask · ! = you tell" }, svg);

      var meter = function (y, label, color) {
        el("text", { x: x0, y: y, "class": "t-small", text: label }, svg);
        el("rect", { x: x0, y: y + 6, width: W, height: 14, rx: 7, fill: "var(--line)" }, svg);
        return el("rect", { x: x0, y: y + 6, height: 14, rx: 7, fill: color }, svg);
      };
      var mK = meter(108, "How much of the picture you have", "var(--s1)");
      var mB = meter(150, "Their buy-in", "var(--s3)");
      var mC = meter(192, "How clearly they know your view", "var(--s2)");

      var big = el("text", { x: x0, y: 256, "class": "t-big" }, svg);
      var verdict = el("text", { x: x0, y: 290, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 160, xDomain: [0, 1], yDomain: [0, 1], xLabel: "share of turns spent asking →", yLabel: "score" });
      var pK = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      el("path", { d: C.path(buyin, 0, 1, 40), fill: "none", stroke: "var(--s3)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      el("path", { d: C.path(clarity, 0, 1, 40), fill: "none", stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pS = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var bestLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      var legend = [["var(--s1)", "what you know"], ["var(--s3)", "buy-in"], ["var(--s2)", "clarity of view"], ["var(--ink)", "outcome"]];
      legend.forEach(function (l, i) {
        var lx = 392 + (i % 2) * 124, ly = 262 + Math.floor(i / 2) * 20;
        el("path", { d: "M" + lx + " " + ly + "h14", stroke: l[0], "stroke-width": i === 3 ? 3 : 2, "stroke-linecap": "round" }, svg);
        el("text", { x: lx + 20, y: ly + 4, "class": "t-small", text: l[1] }, svg);
      });

      return function (st) {
        var a = st.a, s = st.s, k = Math.round(a * TURNS), sc = score(a, s), b = BEST[s], sb = score(b, s);
        rects.forEach(function (r, i) { T.set(r, { fill: i < k ? "var(--s1)" : "var(--s2)" }); T.set(marks[i], { text: i < k ? "?" : "!" }); });
        T.set(mK, { width: Math.max(14, W * know(a, s)) });
        T.set(mB, { width: Math.max(14, W * buyin(a)) });
        T.set(mC, { width: Math.max(14, W * clarity(a)) });
        T.set(pK, { d: C.path(function (x) { return know(x, s); }, 0, 1, 40) });
        T.set(pS, { d: C.path(function (x) { return score(x, s); }, 0, 1, 60) });
        T.set(bestLine, { x1: C.px(b), x2: C.px(b) });
        T.set(mk, { cx: C.px(a), cy: C.py(Math.max(0, sc)) });
        T.set(big, { text: "Outcome score " + Math.round(Math.max(0, sc) * 100) + " out of 100" });
        T.set(verdict, { text: sc < sb * 0.6 ? "Far from the best (about " + Math.round(b * 100) + "% asking)" : sc < sb * 0.9 ? "Close to the best (about " + Math.round(b * 100) + "% asking)" : "Near the best balance", fill: sc < sb * 0.6 ? "var(--bad)" : sc < sb * 0.9 ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
