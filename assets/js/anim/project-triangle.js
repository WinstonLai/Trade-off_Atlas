// Scope is the work demanded; time × cost is the work the project can afford.
// When the two stop matching, quality absorbs the gap.
(function (T) {
  var BASE = 5, MIN = 1, MAX = 10;
  var cap = function (s) { return s.time * s.cost / BASE; };
  var quality = function (s) { return T.clamp(cap(s) / s.scope, 0, 1); };
  var fit = function (v) { return T.clamp(v, MIN, MAX); };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A triangle with corners for scope, time and cost. Moving one corner pushes the others.",
    vars: [
      { key: "scope", label: "Scope", min: MIN, max: MAX, step: 0.1, value: 5, color: "var(--s1)" },
      { key: "time", label: "Time", min: MIN, max: MAX, step: 0.1, value: 5, color: "var(--s2)" },
      { key: "cost", label: "Cost", min: MIN, max: MAX, step: 0.1, value: 5, color: "var(--s3)" }
    ],
    lockable: ["scope", "time", "cost"],
    relate: function (s, changed, locked) {
      s = Object.assign({}, s);
      if (changed === "scope") {
        if (locked === "cost") s.time = fit(BASE * s.scope / s.cost);
        else if (locked === "time") s.cost = fit(BASE * s.scope / s.time);
        else {
          var f = Math.sqrt(s.scope * BASE / (s.time * s.cost));
          s.time = fit(s.time * f); s.cost = fit(s.cost * f);
        }
      } else if (changed === "time") {
        if (locked === "scope") s.cost = fit(BASE * s.scope / s.time);
        else s.scope = fit(cap(s));
      } else if (changed === "cost") {
        if (locked === "scope") s.time = fit(BASE * s.scope / s.cost);
        else s.scope = fit(cap(s));
      }
      return s;
    },
    scenario: [
      { caption: "Start balanced: the scope fits the time and budget available.", set: { scope: 5, time: 5, cost: 5 }, direct: true, lock: null },
      { caption: "Budget fixed. Add scope, and the timeline has to stretch to absorb it.", set: { scope: 8.5 }, lock: "cost", hold: 3000 },
      { caption: "Back to balance.", set: { scope: 5, time: 5, cost: 5 }, direct: true, lock: null, dur: 900, hold: 700 },
      { caption: "Deadline fixed. Add scope, and cost rises (more people, more overtime).", set: { scope: 8.5 }, lock: "time", hold: 3000 },
      { caption: "Back to balance.", set: { scope: 5, time: 5, cost: 5 }, direct: true, lock: null, dur: 900, hold: 700 },
      { caption: "Scope fixed. Pull the deadline in, and you pay extra to compress the schedule.", set: { time: 3 }, lock: "scope", hold: 3000 },
      { caption: "Squeeze all three at once, and quality is what gives way.", set: { scope: 9, time: 3, cost: 3 }, direct: true, lock: null, hold: 3600 }
    ],
    setup: function (svg) {
      var el = T.el, cx = 200, cy = 185;
      var ang = { scope: -90, time: 30, cost: 150 };
      var color = { scope: "var(--s1)", time: "var(--s2)", cost: "var(--s3)" };
      var name = { scope: "Scope", time: "Time", cost: "Cost" };
      var radius = function (v) { return 30 + v * 13; };
      var pt = function (k, v, jitter) {
        var a = ang[k] * Math.PI / 180, r = radius(v) + (jitter || 0);
        return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      };
      var poly = function (p) { return "M" + p.map(function (q) { return q[0].toFixed(1) + " " + q[1].toFixed(1); }).join("L") + "Z"; };
      var keys = ["scope", "time", "cost"];

      // ghost of the balanced triangle
      el("path", { d: poly(keys.map(function (k) { return pt(k, BASE); })), fill: "none", stroke: "var(--line)", "stroke-width": 1.5, "stroke-dasharray": "5 5" }, svg);
      var tri = el("path", { fill: "var(--s1)", "fill-opacity": 0.08, stroke: "var(--ink)", "stroke-width": 2.5, "stroke-linejoin": "round" }, svg);
      var qDisc = el("circle", { cx: cx, cy: cy, r: 30, fill: "var(--good)", "fill-opacity": 0.16 }, svg);
      var qText = el("text", { x: cx, y: cy - 2, "text-anchor": "middle", "class": "t-mid", text: "100%" }, svg);
      el("text", { x: cx, y: cy + 14, "text-anchor": "middle", "class": "t-small", text: "quality" }, svg);

      var nodes = {};
      keys.forEach(function (k) {
        var g = el("g", {}, svg);
        var c = el("circle", { r: 9, fill: color[k], stroke: "var(--surface)", "stroke-width": 3 }, g);
        var lab = el("text", { "class": "t-label", "text-anchor": "middle" }, g);
        var lock = el("g", {}, g);
        el("rect", { x: -6, y: -2, width: 12, height: 9, rx: 2, fill: "var(--ink)" }, lock);
        el("path", { d: "M-3.5 -2v-3a3.5 3.5 0 0 1 7 0v3", fill: "none", stroke: "var(--ink)", "stroke-width": 1.8 }, lock);
        nodes[k] = { c: c, lab: lab, lock: lock };
      });

      // right panel: demand vs capacity
      var px = 410, bw = 200;
      el("text", { x: px, y: 60, "class": "t-label", text: "Work needed (scope)" }, svg);
      el("rect", { x: px, y: 70, width: bw, height: 16, rx: 4, fill: "var(--surface-2)" }, svg);
      var needBar = el("rect", { x: px, y: 70, height: 16, rx: 4, fill: "var(--s1)" }, svg);
      el("text", { x: px, y: 122, "class": "t-label", text: "Work affordable (time × cost)" }, svg);
      el("rect", { x: px, y: 132, width: bw, height: 16, rx: 4, fill: "var(--surface-2)" }, svg);
      var capBar = el("rect", { x: px, y: 132, height: 16, rx: 4, fill: "var(--s2)" }, svg);
      var gapBar = el("rect", { x: px, y: 132, height: 16, fill: "var(--bad)", "fill-opacity": 0.35 }, svg);
      var verdict = el("text", { x: px, y: 190, "class": "t-mid" }, svg);
      var verdict2 = el("text", { x: px, y: 212, "class": "t-small" }, svg);
      var scale = function (v) { return T.clamp(v / 12, 0, 1) * bw; };

      return function (s, t, lock) {
        var q = quality(s), strain = 1 - q;
        var pts = keys.map(function (k, i) {
          var j = strain > 0.02 ? Math.sin(t / 90 + i * 2) * strain * 6 : 0;
          return pt(k, s[k], j);
        });
        T.set(tri, { d: poly(pts), stroke: strain > 0.02 ? "var(--bad)" : "var(--ink)" });
        keys.forEach(function (k, i) {
          var n = nodes[k], p = pts[i];
          T.set(n.c, { cx: p[0], cy: p[1] });
          var ly = k === "scope" ? p[1] - 18 : p[1] + 26;
          T.set(n.lab, { x: p[0], y: ly, text: name[k] + " " + s[k].toFixed(1) });
          n.lock.style.display = lock === k ? "" : "none";
          T.set(n.lock, { transform: "translate(" + (p[0] + (k === "time" ? 16 : -16)) + "," + (p[1] - 4) + ")" });
        });
        T.set(qText, { text: Math.round(q * 100) + "%" });
        T.set(qDisc, { r: 22 + q * 10, fill: q > 0.97 ? "var(--good)" : q > 0.7 ? "var(--warn)" : "var(--bad)" });

        var need = s.scope, have = cap(s);
        T.set(needBar, { width: scale(need) });
        T.set(capBar, { width: scale(have) });
        var gap = need - have;
        T.set(gapBar, { x: px + scale(have), width: gap > 0.05 ? scale(need) - scale(have) : 0 });
        if (gap > 0.05) {
          T.set(verdict, { text: "Gap: corners get cut", fill: "var(--bad)" });
          T.set(verdict2, { text: "Scope exceeds time × budget." });
        } else {
          T.set(verdict, { text: "In balance", fill: "var(--good)" });
          T.set(verdict2, { text: "Scope fits time × budget." });
        }
      };
    }
  });
})(window.Tradeoff);
