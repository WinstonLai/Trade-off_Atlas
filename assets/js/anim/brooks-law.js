// Output = people minus coordination overhead (∝ channels), minus ramp-up for late joiners.
(function (T) {
  var MAX = 16, CORE = 4;
  var channels = function (n) { return n * (n - 1) / 2; };
  var planned = function (n) { return n - 0.1 * channels(n); };
  var late = function (n) { return Math.max(0.2, planned(n) - 0.35 * Math.max(0, n - CORE)); };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A network of team members whose communication lines multiply, next to a chart of team output.",
    vars: [
      { key: "mode", label: "When people join", type: "choice", value: "planned",
        options: [{ value: "planned", label: "From the start" }, { value: "late", label: "Added to a late project" }] },
      { key: "n", label: "Team size", min: 1, max: MAX, step: 1, value: 3, color: "var(--s1)", fmt: function (v) { return Math.round(v) + " people"; } }
    ],
    scenario: [
      { caption: "A small team: few communication lines, and everyone stays in sync.", set: { mode: "planned", n: 3 } },
      { caption: "Add people and output grows, but the connections grow faster than the headcount.", set: { n: 8 }, dur: 2200 },
      { caption: "Past a point, coordination eats the gains. 14 people means 91 conversations.", set: { n: 14 }, dur: 2200, hold: 3000 },
      { caption: "Now take a late project with a core team of 4…", set: { mode: "late", n: 4 }, dur: 1200 },
      { caption: "…add 6 new hires, and ramp-up plus mentoring leave output where it started.", set: { n: 10 }, dur: 2400, hold: 3600 }
    ],
    setup: function (svg) {
      var el = T.el, cx = 165, cy = 170, R = 115;
      var gl = el("g", {}, svg), gd = el("g", {}, svg);
      var pos = [];
      for (var i = 0; i < MAX; i++) pos.push(null);
      var lines = [], dots = [];
      for (var a = 0; a < MAX; a++) for (var b = a + 1; b < MAX; b++) {
        lines.push({ a: a, b: b, n: el("line", { stroke: "var(--muted)", "stroke-width": 1, "stroke-dasharray": "3 4" }, gl) });
      }
      for (var k = 0; k < MAX; k++) dots.push(el("circle", { r: 8, stroke: "var(--surface)", "stroke-width": 2.5 }, gd));
      var t1 = el("text", { x: cx, y: 318, "text-anchor": "middle", "class": "t-label" }, svg);

      var c = T.chart(svg, { x: 380, y: 50, w: 240, h: 200, xDomain: [1, MAX], yDomain: [0, 6.5], xLabel: "team size →", yLabel: "team output" });
      var pPlan = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2.5, d: c.path(planned) }, c.g);
      var pLate = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2.5, "stroke-dasharray": "6 5", d: c.path(late) }, c.g);
      el("text", { x: c.px(13.2), y: c.py(planned(13.2)) - 10, "class": "t-small", text: "planned", fill: "var(--s1)" }, c.g);
      el("text", { x: c.px(9), y: c.py(late(9)) + 22, "class": "t-small", text: "added late", fill: "var(--s2)" }, c.g);
      var guide = el("line", { stroke: "var(--line)", "stroke-dasharray": "3 3" }, c.g);
      var mk = el("circle", { r: 7, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, c.g);
      var read = el("text", { x: 380, y: 300, "class": "t-mid" }, svg);
      var read2 = el("text", { x: 380, y: 318, "class": "t-small" }, svg);

      return function (s, t) {
        var n = Math.max(1, Math.round(s.n)), isLate = s.mode === "late";
        for (var i = 0; i < MAX; i++) {
          var ang = -Math.PI / 2 + i / n * Math.PI * 2;
          var r = n === 1 ? 0 : R;
          var x = cx + Math.cos(ang) * r, y = cy - 10 + Math.sin(ang) * r;
          pos[i] = [x, y];
          var on = i < n;
          dots[i].style.display = on ? "" : "none";
          T.set(dots[i], { cx: x, cy: y, fill: isLate && i >= CORE ? "var(--s2)" : "var(--s1)" });
        }
        lines.forEach(function (L) {
          var on = L.b < n;
          L.n.style.display = on ? "" : "none";
          if (on) T.set(L.n, { x1: pos[L.a][0], y1: pos[L.a][1], x2: pos[L.b][0], y2: pos[L.b][1], "stroke-dashoffset": -(t / 60) % 7, opacity: n > 10 ? 0.35 : 0.6 });
        });
        T.set(t1, { text: n + (n === 1 ? " person · " : " people · ") + channels(n) + " communication channels" });

        var f = isLate ? late : planned, out = f(s.n);
        T.set(pPlan, { opacity: isLate ? 0.35 : 1, "stroke-width": isLate ? 1.5 : 3 });
        T.set(pLate, { opacity: isLate ? 1 : 0.35, "stroke-width": isLate ? 3 : 1.5 });
        T.set(mk, { cx: c.px(s.n), cy: c.py(T.clamp(out, 0, 6.5)) });
        T.set(guide, { x1: c.px(s.n), x2: c.px(s.n), y1: c.h, y2: c.py(T.clamp(out, 0, 6.5)) });
        T.set(read, { text: "Output ≈ " + out.toFixed(1) + " people's worth" });
        T.set(read2, { text: "Delivery time ≈ " + Math.round(40 / Math.max(out, 0.2)) + " weeks for a 40-person-week job" });
      };
    }
  });
})(window.Tradeoff);
