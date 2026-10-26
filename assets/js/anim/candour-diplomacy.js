// Two axes: how directly you challenge (x) and how visibly you care (y).
(function (T) {
  var Q = {
    rc: { name: "Radical candour", col: "var(--good)", say: ["\"The report had errors a client would spot.", "I know you can do better, and I'll help.", "Can we go through them together today?\""] },
    oa: { name: "Obnoxious aggression", col: "var(--bad)", say: ["\"This report is sloppy. Fix it.\"", "", ""] },
    re: { name: "Ruinous empathy", col: "var(--warn)", say: ["\"Great effort on the report!", "Maybe just have another quick look", "sometime, if you get a chance?\""] },
    mi: { name: "Manipulative insincerity", col: "var(--muted)", say: ["\"Looks fine.\"", "(…then complains about it to others)", ""] }
  };
  var quad = function (d, c) { return d >= 50 ? (c >= 50 ? "rc" : "oa") : (c >= 50 ? "re" : "mi"); };
  var clarity = function (d) { return 1 / (1 + Math.exp(-(d - 50) / 12)); };
  var trust = function (d, c) { return T.clamp(0.2 + 0.8 * c / 100 - Math.max(0, d - 40) / 100 * (1 - c / 100) * 1.3, 0, 1); };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A two-by-two grid of directness against care, with an example of feedback for each position.",
    vars: [
      { key: "d", label: "Challenge directly", min: 0, max: 100, step: 1, value: 25, color: "var(--s1)", fmt: function (v) { return Math.round(v) + "%"; } },
      { key: "c", label: "Care personally", min: 0, max: 100, step: 1, value: 80, color: "var(--s3)", fmt: function (v) { return Math.round(v) + "%"; } }
    ],
    scenario: [
      { caption: "Lots of care, little directness: it feels kind, but the problem never gets fixed.", set: { d: 22, c: 82 }, hold: 3600 },
      { caption: "Turn up directness without care: the message is clear, but trust takes the hit.", set: { d: 85, c: 18 }, dur: 2200, hold: 3600 },
      { caption: "Neither direct nor caring: vague to their face, critical behind their back.", set: { d: 18, c: 18 }, dur: 2000, hold: 3400 },
      { caption: "Both at once: clear about the problem, and clearly on their side.", set: { d: 85, c: 85 }, dur: 2400, hold: 4200 }
    ],
    setup: function (svg) {
      var el = T.el, gx = 40, gy = 30, gs = 250;
      var px = function (d) { return gx + d / 100 * gs; }, py = function (c) { return gy + gs - c / 100 * gs; };
      var cells = [["re", 0, 0], ["rc", 1, 0], ["mi", 0, 1], ["oa", 1, 1]].map(function (q) {
        var r = el("rect", { x: gx + q[1] * gs / 2, y: gy + q[2] * gs / 2, width: gs / 2, height: gs / 2, fill: Q[q[0]].col, "fill-opacity": 0.06, stroke: "var(--line)" }, svg);
        el("text", { x: gx + q[1] * gs / 2 + gs / 4, y: gy + q[2] * gs / 2 + gs / 4 + 4, "text-anchor": "middle", "class": "t-small", text: Q[q[0]].name }, svg);
        return { key: q[0], r: r };
      });
      el("text", { x: gx + gs / 2, y: gy + gs + 22, "text-anchor": "middle", "class": "t-label", text: "challenge directly →" }, svg);
      el("text", { x: gx - 14, y: gy + gs / 2, "text-anchor": "middle", "class": "t-label", text: "care personally →", transform: "rotate(-90 " + (gx - 14) + " " + (gy + gs / 2) + ")" }, svg);
      var trail = el("path", { fill: "none", stroke: "var(--muted)", "stroke-width": 1.5, "stroke-dasharray": "2 4" }, svg);
      var dot = el("circle", { r: 10, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 3 }, svg);

      var bx = 330;
      var bub = el("rect", { x: bx, y: 30, width: 285, height: 104, rx: 14, fill: "var(--surface-2)", stroke: "var(--line)" }, svg);
      el("path", { d: "M" + (bx + 30) + " 134l-8 16 22-16", fill: "var(--surface-2)", stroke: "var(--line)" }, svg);
      var qName = el("text", { x: bx + 16, y: 54, "class": "t-label" }, svg);
      var say = [0, 1, 2].map(function (i) { return el("text", { x: bx + 16, y: 78 + i * 19, "class": "t-label", fill: "var(--ink)", style: "font-size:12px;font-weight:500" }, svg); });

      var bars = [["Clarity of the message", "var(--s1)"], ["Trust afterwards", "var(--s3)"], ["Likely to improve", "var(--s2)"]].map(function (b, i) {
        var y = 186 + i * 40;
        el("text", { x: bx, y: y, "class": "t-small", text: b[0] }, svg);
        el("rect", { x: bx, y: y + 8, width: 285, height: 12, rx: 6, fill: "var(--surface-2)" }, svg);
        return el("rect", { x: bx, y: y + 8, height: 12, rx: 6, fill: b[1] }, svg);
      });

      var hist = [];
      return function (s) {
        var x = px(s.d), y = py(s.c), k = quad(s.d, s.c);
        var last = hist[hist.length - 1];
        if (!last || Math.abs(last[0] - x) + Math.abs(last[1] - y) > 3) { hist.push([x, y]); if (hist.length > 40) hist.shift(); }
        T.set(trail, { d: hist.length > 1 ? "M" + hist.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join("L") : "" });
        T.set(dot, { cx: x, cy: y, fill: Q[k].col });
        cells.forEach(function (c) { T.set(c.r, { "fill-opacity": c.key === k ? 0.2 : 0.05 }); });
        T.set(qName, { text: Q[k].name, fill: Q[k].col });
        say.forEach(function (t, i) { T.set(t, { text: Q[k].say[i] }); });
        var cl = clarity(s.d), tr = trust(s.d, s.c);
        T.set(bars[0], { width: cl * 285 });
        T.set(bars[1], { width: Math.max(4, tr * 285) });
        T.set(bars[2], { width: Math.max(4, cl * tr * 285) });
      };
    }
  });
})(window.Tradeoff);
