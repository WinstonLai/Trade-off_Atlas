// 40 events cross an unreliable link. Each has a fixed random draw u: below f/2 the event is dropped before it is written,
// between f/2 and f it is written but the acknowledgement is lost. What the sender does next depends on the guarantee.
(function (T) {
  var NE = 40, EOS_OVERHEAD = 1.3, U = [], seed = 7;
  for (var i = 0; i < NE; i++) { seed = (seed * 16807) % 2147483647; U.push(seed / 2147483647); }
  var MODES = ["amo", "alo", "eos"];
  var NAME = { amo: "At most once", alo: "At least once", eos: "Exactly once" };
  var USE = { amo: "Fine for: metrics where gaps are OK", alo: "Fine when readers tolerate repeats", eos: "Needed for: money, stock, counts" };

  function run(mode, f) {
    var lost = 0, dup = 0, fails = 0, cells = [];
    U.forEach(function (u) {
      var st = "ok";
      if (u < f) fails++;
      if (u < f / 2) { if (mode === "amo") { st = "lost"; lost++; } }
      else if (u < f) { if (mode === "alo") { st = "dup"; dup++; } }
      cells.push(st);
    });
    var attempts = NE + (mode === "amo" ? 0 : fails);
    return { lost: lost, dup: dup, cells: cells, extra: attempts * (mode === "eos" ? EOS_OVERHEAD : 1) / NE - 1 };
  }

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Forty events as stored at a destination under three delivery guarantees, marking lost and duplicated events, and bars comparing losses, duplicates and extra work for each guarantee.",
    vars: [
      { key: "m", label: "Delivery guarantee", type: "choice", value: "amo",
        options: MODES.map(function (k) { return { value: k, label: NAME[k] }; }) },
      { key: "f", label: "How often the link fails", min: 0, max: 0.4, step: 0.01, value: 0.2, color: "var(--s2)", fmt: function (v) { return Math.round(v * 100) + "%"; } }
    ],
    scenario: [
      { caption: "At most once: send and move on. When the link fails, the event is simply gone (red).", set: { m: "amo", f: 0.2 }, hold: 4000 },
      { caption: "At least once: retry until acknowledged. Nothing is lost, but when only the acknowledgement was lost the event lands twice (orange).", set: { m: "alo" }, hold: 4600 },
      { caption: "Exactly once: retries plus a way to recognise repeats, such as idempotent writes or transactions. Correct, but it costs extra coordination.", set: { m: "eos" }, hold: 4600 },
      { caption: "When failures are rare, duplicates are rare too, so at-least-once with a tolerant reader is often enough.", set: { m: "alo", f: 0.05 }, dur: 2200, hold: 4200 },
      { caption: "When the link is bad, every guarantee pays for more retries. Exactly-once still adds its own overhead on top.", set: { m: "eos", f: 0.4 }, dur: 2400, hold: 4400 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, cw = 16.5;
      el("text", { x: x0, y: 30, "class": "t-label", text: "40 events, as stored at the destination" }, svg);
      var cells = [], dups = [];
      for (var k = 0; k < NE; k++) {
        var cx = x0 + (k % 20) * cw, cy = 42 + Math.floor(k / 20) * 20;
        cells.push(el("rect", { x: cx, y: cy, width: 14, height: 14, rx: 3 }, svg));
        dups.push(el("rect", { x: cx + 6, y: cy + 6, width: 9, height: 9, rx: 2, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 1.5 }, svg));
      }
      var lg = [["var(--s3)", "stored once"], ["var(--bad)", "lost"], ["var(--s2)", "stored twice"]];
      lg.forEach(function (l, i) {
        el("rect", { x: x0 + i * 100, y: 92, width: 10, height: 10, rx: 2, fill: l[0] }, svg);
        el("text", { x: x0 + i * 100 + 15, y: 101, "class": "t-small", text: l[1] }, svg);
      });

      var big = el("text", { x: x0, y: 166, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 190, "class": "t-small" }, svg);
      var use = el("text", { x: x0, y: 226, "class": "t-mid" }, svg);
      var note = el("text", { x: x0, y: 250, "class": "t-small" }, svg);

      // comparison panel: one group per guarantee, three bars each (100% of events = 150px)
      var px = 392, gy = 48, gap = 62, SCL = 150;
      el("text", { x: px, y: 30, "class": "t-label", text: "All three at this failure rate" }, svg);
      var groups = {};
      MODES.forEach(function (m, gi) {
        var y = gy + gi * gap, g = el("g", {}, svg);
        el("text", { x: px, y: y + 8, "class": "t-small", fill: "var(--ink)", text: NAME[m] }, g);
        var bars = [["var(--bad)", "lost"], ["var(--s2)", "dup"], ["var(--s1)", "extra"]].map(function (b, bi) {
          var by = y + 14 + bi * 13;
          var r = el("rect", { x: px, y: by, height: 9, rx: 3, fill: b[0] }, g);
          var t = el("text", { x: px, y: by + 8, "class": "t-small" }, g);
          return { r: r, t: t };
        });
        groups[m] = { g: g, bars: bars };
      });
      el("text", { x: px, y: 246, "class": "t-small", text: "bars: lost · twice · extra work" }, svg);

      return function (s) {
        var cur = run(s.m, s.f);
        cur.cells.forEach(function (st, i) {
          T.set(cells[i], st === "lost" ? { fill: "var(--bad)", opacity: 0.35 } : { fill: "var(--s3)", opacity: 1 });
          T.set(dups[i], { opacity: st === "dup" ? 1 : 0 });
        });
        MODES.forEach(function (m) {
          var r = run(m, s.f), vals = [r.lost / NE, r.dup / NE, r.extra];
          T.set(groups[m].g, { opacity: m === s.m ? 1 : 0.4 });
          groups[m].bars.forEach(function (b, i) {
            var len = Math.max(2, vals[i] * SCL);
            T.set(b.r, { width: len });
            T.set(b.t, { x: px + len + 5, text: Math.round(vals[i] * 100) + "%" });
          });
        });
        T.set(big, { text: NAME[s.m] });
        T.set(sub, { text: "This run: lost " + cur.lost + " · stored twice " + cur.dup + " · extra work " + Math.round(cur.extra * 100) + "%" });
        var wrong = cur.lost + cur.dup;
        T.set(use, { text: USE[s.m] });
        T.set(note, { text: wrong ? wrong + " of " + NE + " events end up wrong" : "Every event is stored exactly once" });
      };
    }
  });
})(window.Tradeoff);
