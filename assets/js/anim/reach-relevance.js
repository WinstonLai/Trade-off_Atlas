// 100 people, 12 of whom need the message. Each irrelevant message teaches people to skim, so the share who actually read falls as relevance falls.
(function (T) {
  var N = 100, REL = [3, 17, 24, 38, 41, 55, 62, 70, 77, 84, 91, 96], NREL = REL.length;
  var relSet = {}; REL.forEach(function (i) { relSet[i] = true; });
  var others = []; for (var i = 0; i < N; i++) if (!relSet[i]) others.push(i);
  var ORDER = {
    good: REL.concat(others), // you know who needs it and send to them first
    guess: (function () { // the people who need it are scattered evenly through your list
      var pos = {}, o = [], r = 0, k = 0;
      REL.forEach(function (_, j) { pos[Math.floor((j + 0.5) * N / NREL)] = true; });
      for (var rank = 0; rank < N; rank++) o.push(pos[rank] ? REL[r++] : others[k++]);
      return o;
    })()
  };
  var COV = {}; ["good", "guess"].forEach(function (m) {
    COV[m] = [0]; for (var n = 1; n <= N; n++) COV[m].push(COV[m][n - 1] + (relSet[ORDER[m][n - 1]] ? 1 : 0));
  });
  var readRate = function (rel) { return 0.2 + 0.7 * Math.pow(rel, 0.6); };
  var metrics = function (n, m) {
    n = Math.max(1, Math.round(n)); var cov = COV[m][n], rr = readRate(cov / n);
    return { cov: cov, rr: rr, informed: cov * rr, wasted: (n - cov) * rr };
  };
  var YMAX = 36;

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A grid of one hundred people showing who receives a message and who needs it, and curves of relevant people reached and attention wasted against how many people receive it.",
    vars: [
      { key: "n", label: "People who receive it", min: 1, max: N, step: 1, value: 12, color: "var(--s1)", fmt: function (v) { return Math.round(v); } },
      { key: "m", label: "How well do you know who needs it?", type: "choice", value: "good",
        options: [{ value: "good", label: "I know who" }, { value: "guess", label: "I'm guessing" }] }
    ],
    scenario: [
      { caption: "You know the 12 people who need this, and you send it to exactly them. All of them read it, and nobody else is disturbed.", set: { n: 12, m: "good" }, hold: 3800 },
      { caption: "Send it to everyone 'just in case'. The 12 are reached, but 88 people read something irrelevant, and the habit of skimming makes even the 12 less likely to read.", set: { n: 100 }, dur: 2400, hold: 4200 },
      { caption: "Now suppose you can't tell who needs it, and you pick 12 at random. Most of those who need it never see it.", set: { n: 12, m: "guess" }, dur: 1800, hold: 3800 },
      { caption: "Here, a wide send is the only way to reach them, so it earns its cost. Better targeting (teams, channels people opt into) lowers that cost.", set: { n: 100 }, dur: 2400, hold: 4200 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, y0 = 50, cs = 17;
      el("text", { x: x0, y: 36, "class": "t-label", text: "100 people" }, svg);
      var cells = [];
      for (var p = 0; p < N; p++) cells.push(el("rect", { x: x0 + (p % 10) * cs, y: y0 + Math.floor(p / 10) * cs, width: cs - 3, height: cs - 3, rx: 4 }, svg));
      var lx = x0 + 10 * cs + 14;
      [["var(--s1)", "needs it, received", 66], ["var(--s2)", "received, didn't need it", 90]].forEach(function (l) {
        el("rect", { x: lx, y: l[2] - 9, width: 10, height: 10, rx: 3, fill: l[0] }, svg);
        el("text", { x: lx + 15, y: l[2], "class": "t-small", text: l[1] }, svg);
      });
      el("rect", { x: lx + 1, y: 107, width: 8, height: 8, rx: 3, fill: "none", stroke: "var(--bad)", "stroke-width": 2 }, svg);
      el("text", { x: lx + 15, y: 114, "class": "t-small", text: "needs it, missed" }, svg);
      var big = el("text", { x: x0, y: 250, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 272, "class": "t-small" }, svg);
      var sub2 = el("text", { x: x0, y: 292, "class": "t-small" }, svg);

      var C = T.chart(svg, { x: 400, y: 48, w: 210, h: 190, xDomain: [0, N], yDomain: [0, YMAX], xLabel: "people who receive it →", yLabel: "people" });
      var pI = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 3 }, C.g);
      var pW = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2.5, "stroke-dasharray": "6 5" }, C.g);
      el("text", { x: C.px(4), y: C.py(YMAX) + 12, "class": "t-small", fill: "var(--s2)", text: "attention wasted" }, C.g);
      el("text", { x: C.px(30), y: C.py(20), "class": "t-small", fill: "var(--s1)", text: "relevant people who read it" }, C.g);
      var mI = el("circle", { r: 6, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      var mW = el("circle", { r: 6, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);

      return function (s) {
        var n = Math.max(1, Math.round(s.n)), m = s.m, x = metrics(n, m), got = {};
        for (var r = 0; r < n; r++) got[ORDER[m][r]] = true;
        cells.forEach(function (c, p) {
          var rel = !!relSet[p], rec = !!got[p];
          T.set(c, { fill: rec ? (rel ? "var(--s1)" : "var(--s2)") : "var(--line)", opacity: rec ? 1 : 0.55, stroke: rel && !rec ? "var(--bad)" : "none", "stroke-width": 2 });
        });
        T.set(pI, { d: C.path(function (v) { return metrics(v, m).informed; }, 1, N, 99) });
        T.set(pW, { d: C.path(function (v) { return metrics(v, m).wasted; }, 1, N, 99) });
        T.set(mI, { cx: C.px(n), cy: C.py(x.informed) });
        T.set(mW, { cx: C.px(n), cy: C.py(x.wasted) });
        T.set(big, { text: x.informed.toFixed(1) + " of " + NREL + " relevant people read it" });
        T.set(sub, { text: x.cov + " of " + NREL + " received it · " + Math.round(x.rr * 100) + "% of recipients read it" });
        T.set(sub2, { text: Math.round(x.wasted) + " people spent time on something that didn't concern them", fill: x.wasted > 15 ? "var(--bad)" : x.wasted > 5 ? "var(--warn)" : "var(--muted)" });
      };
    }
  });
})(window.Tradeoff);
