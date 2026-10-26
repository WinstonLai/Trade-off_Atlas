// Independent release lanes saturate at the number of teams; services and the links between them keep growing.
(function (T) {
  var TEAMS = 6, MAXN = 12, TEAM_COLOR = ["var(--s1)", "var(--s2)", "var(--s3)"];
  var linked = function (i, j) { return j === i + 1 || (i + j * 3) % 5 === 0; };
  var links = function (n) { var c = 0; for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) if (linked(i, j)) c++; return c; };
  var autonomy = function (n) { return (1 - 1 / Math.min(n, TEAMS)) / (1 - 1 / TEAMS); };
  var MAXC = MAXN + links(MAXN);
  var complexity = function (n) { return (n + links(n)) / MAXC; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A system split into a growing number of services with links between them, and a chart of team autonomy and operational complexity.",
    vars: [
      { key: "n", label: "Number of services", min: 1, max: MAXN, step: 1, value: 1, color: "var(--s1)", fmt: function (v) { return Math.round(v) === 1 ? "1 (monolith)" : String(Math.round(v)); } }
    ],
    scenario: [
      { caption: "One monolith: one thing to deploy and debug. But six teams all queue behind the same release.", set: { n: 1 }, hold: 3600 },
      { caption: "Split into about as many services as teams: everyone can ship on their own, with a modest number of links.", set: { n: 6 }, dur: 2000, hold: 3800 },
      { caption: "Keep splitting: no more teams get independence, but every service adds failure points and network calls.", set: { n: 12 }, dur: 2400, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el, cx = 160, cy = 142, R = 82;
      el("text", { x: 30, y: 26, "class": "t-label", text: "Services and the calls between them" }, svg);
      var edges = {}, i, j;
      for (i = 0; i < MAXN; i++) for (j = i + 1; j < MAXN; j++) if (linked(i, j)) edges[i + "-" + j] = { i: i, j: j, n: el("line", { stroke: "var(--muted)", "stroke-width": 1.5, opacity: 0.55 }, svg) };
      var nodes = [];
      for (i = 0; i < MAXN; i++) nodes.push(el("circle", { fill: TEAM_COLOR[i % 3], stroke: "var(--surface)", "stroke-width": 2 }, svg));
      var one = el("text", { x: cx, y: cy + 4, "text-anchor": "middle", "class": "t-label", fill: "var(--surface)", text: "one app" }, svg);

      var lanes = el("text", { x: 30, y: 262, "class": "t-big" }, svg);
      el("text", { x: 30, y: 282, "class": "t-small", text: "teams that can ship independently" }, svg);
      var fail = el("text", { x: 30, y: 306, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 200, xDomain: [1, MAXN], yDomain: [0, 1.05], xLabel: "services →", yLabel: "relative" });
      var pa = "", pc = "";
      for (i = 1; i <= MAXN; i++) { pa += (i > 1 ? "L" : "M") + C.px(i).toFixed(1) + " " + C.py(autonomy(i)).toFixed(1); pc += (i > 1 ? "L" : "M") + C.px(i).toFixed(1) + " " + C.py(complexity(i)).toFixed(1); }
      el("path", { d: pa, fill: "none", stroke: "var(--s1)", "stroke-width": 2.5, "stroke-linejoin": "round" }, C.g);
      el("path", { d: pc, fill: "none", stroke: "var(--s2)", "stroke-width": 2.5, "stroke-linejoin": "round" }, C.g);
      el("text", { x: C.px(7.2), y: C.py(autonomy(8)) - 8, "class": "t-small", fill: "var(--s1)", text: "team autonomy" }, C.g);
      el("text", { x: C.px(5.6), y: C.py(0.15), "class": "t-small", fill: "var(--s2)", text: "operational complexity" }, C.g);
      var mkA = el("circle", { r: 6, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      var mkC = el("circle", { r: 6, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);

      return function (s) {
        var n = T.clamp(Math.round(s.n), 1, MAXN), pos = [];
        for (var a = 0; a < MAXN; a++) {
          var ang = -Math.PI / 2 + a / n * 2 * Math.PI;
          pos.push(n === 1 ? [cx, cy] : [cx + R * Math.cos(ang), cy + R * Math.sin(ang)]);
          var on = a < n;
          nodes[a].style.display = on ? "" : "none";
          if (on) T.set(nodes[a], { cx: pos[a][0], cy: pos[a][1], r: n === 1 ? 40 : 15 });
        }
        T.set(one, { opacity: n === 1 ? 1 : 0 });
        for (var key in edges) {
          var e = edges[key], vis = e.j < n;
          e.n.style.display = vis ? "" : "none";
          if (vis) T.set(e.n, { x1: pos[e.i][0], y1: pos[e.i][1], x2: pos[e.j][0], y2: pos[e.j][1] });
        }
        var lanesN = Math.min(n, TEAMS), l = links(n);
        T.set(lanes, { text: lanesN + " of " + TEAMS, fill: lanesN === TEAMS ? "var(--good)" : lanesN >= 3 ? "var(--warn)" : "var(--bad)" });
        T.set(fail, { text: (n + l) + (n + l === 1 ? " thing" : " things") + " that can fail (" + n + (n === 1 ? " service" : " services") + " + " + l + (l === 1 ? " link" : " links") + ")" });
        T.set(mkA, { cx: C.px(n), cy: C.py(autonomy(n)) });
        T.set(mkC, { cx: C.px(n), cy: C.py(complexity(n)) });
      };
    }
  });
})(window.Tradeoff);
