// Oversight L is the share of decisions that need approval. Waiting costs A per unit of L.
// A mistake costs B and an approval catches it, so the share that slips through is (1 − L)², scaled by how error-prone the team is.
(function (T) {
  var A = 15, B = 100, REPORTS = 6, HOURS = 4;
  var ERR = { exp: 0.08, nu: 0.2 };
  var wait = function (L) { return A * L; };
  var slip = function (L, t) { return ERR[t] * (1 - L) * (1 - L); };
  var mistakes = function (L, t) { return B * slip(L, t); };
  var total = function (L, t) { return wait(L) + mistakes(L, t); };
  var best = function (t) { var bl = 0, bc = Infinity; for (var L = 0; L <= 1.0001; L += 0.01) { var c = total(L, t); if (c < bc) { bc = c; bl = L; } } return bl; };
  var BEST = { exp: best("exp"), nu: best("nu") };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A manager connected to six team members by lines that thicken with oversight, the manager's weekly review time, and curves of waiting cost, mistake cost and their total against the share of decisions needing approval.",
    vars: [
      { key: "L", label: "Decisions that need approval", min: 0, max: 1, step: 0.01, value: 1, color: "var(--s1)", fmt: function (v) { return Math.round(v * 100) + "%"; } },
      { key: "t", label: "Who is on the team?", type: "choice", value: "exp",
        options: [{ value: "exp", label: "Experienced (8% mistakes)" }, { value: "nu", label: "New (20% mistakes)" }] }
    ],
    scenario: [
      { caption: "Approve everything: almost no mistake gets through, but every decision waits for the manager, who spends 24 hours a week reviewing.", set: { L: 1, t: "exp" }, hold: 4000 },
      { caption: "Approve nothing: no waiting. An experienced team makes few mistakes, so this already costs less than reviewing everything.", set: { L: 0 }, dur: 2400, hold: 3800 },
      { caption: "A light touch, reviewing only the risky calls, is close to the best for this team.", set: { L: 0.1 }, dur: 1800, hold: 3600 },
      { caption: "Same light touch with a new team: they make more mistakes and few are caught, so the cost jumps.", set: { t: "nu" }, hold: 3800 },
      { caption: "While people are learning, review most of the work, then loosen as trust builds. The right amount of control moves with experience.", set: { L: 0.6 }, dur: 2400, hold: 4200 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330;
      el("text", { x: x0, y: 30, "class": "t-label", text: "Manager and team" }, svg);
      var mx = x0 + W / 2, my = 56, ry = 124;
      var lines = [], dots = [];
      for (var i = 0; i < REPORTS; i++) {
        var rx = x0 + 15 + i * ((W - 30) / (REPORTS - 1));
        lines.push(el("line", { x1: mx, y1: my + 14, x2: rx, y2: ry - 10, stroke: "var(--s1)", "stroke-linecap": "round" }, svg));
        dots.push(el("circle", { cx: rx, cy: ry, r: 10, fill: "var(--ink-2)", opacity: 0.55 }, svg));
      }
      el("circle", { cx: mx, cy: my, r: 15, fill: "var(--ink)" }, svg);
      el("text", { x: x0, y: 168, "class": "t-small", text: "line weight = how much each decision needs sign-off" }, svg);
      el("text", { x: x0, y: 192, "class": "t-label", text: "Manager's review time" }, svg);
      el("rect", { x: x0, y: 200, width: W, height: 12, rx: 6, fill: "var(--line)" }, svg);
      var load = el("rect", { x: x0, y: 200, height: 12, rx: 6, fill: "var(--s2)" }, svg);
      var loadT = el("text", { x: x0 + W, y: 192, "text-anchor": "end", "class": "t-small" }, svg);

      var big = el("text", { x: x0, y: 252, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 274, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 304, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, 1], yDomain: [0, 22], xLabel: "decisions needing approval →", yLabel: "cost per decision" });
      el("path", { d: C.path(wait, 0, 1, 2), fill: "none", stroke: "var(--s1)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pM = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pT = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var bestLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      el("text", { x: C.px(0.04), y: C.py(3.5), "class": "t-small", fill: "var(--s1)", text: "waiting" }, C.g);
      el("text", { x: C.px(0.5), y: C.py(7), "class": "t-small", fill: "var(--s2)", text: "mistakes" }, C.g);

      return function (s) {
        var L = s.L, t = s.t, c = total(L, t), b = BEST[t], cb = total(b, t), hrs = REPORTS * HOURS * L;
        lines.forEach(function (ln) { T.set(ln, { "stroke-width": 0.5 + 5 * L, opacity: 0.15 + 0.85 * L }); });
        T.set(load, { width: Math.max(12, W * L) });
        T.set(loadT, { text: hrs.toFixed(0) + " hours a week" });
        T.set(pM, { d: C.path(function (x) { return mistakes(x, t); }, 0, 1, 40) });
        T.set(pT, { d: C.path(function (x) { return total(x, t); }, 0, 1, 40) });
        T.set(bestLine, { x1: C.px(b), x2: C.px(b) });
        T.set(mk, { cx: C.px(L), cy: C.py(c) });
        T.set(big, { text: "Total cost " + c.toFixed(1) + " per decision" });
        T.set(sub, { text: "waiting " + wait(L).toFixed(1) + " + mistakes " + mistakes(L, t).toFixed(1) + " (" + (slip(L, t) * 100).toFixed(1) + "% of decisions go wrong)" });
        T.set(verdict, { text: c > cb * 1.3 ? "Far from the best (about " + Math.round(b * 100) + "% reviewed)" : c > cb * 1.08 ? "Close to the best (about " + Math.round(b * 100) + "% reviewed)" : "Near the lowest total cost", fill: c > cb * 1.3 ? "var(--bad)" : c > cb * 1.08 ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
