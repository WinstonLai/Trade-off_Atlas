// A bad record is caught at the door (ETL) or surfaces in a report later (ELT); the effort moves with it.
(function (T) {
  var PERIOD = 2200;
  var X = { src: 60, gate: 195, store: 345, rep: 520 }, Y = 80, RY = Y + 46; // RY: the lane the record travels in, below the boxes
  var effort = function (mode, chg) { return mode === "etl" ? 0.12 + 0.8 * chg : 0.12 + 0.18 * chg; };
  var badData = function (mode, chg) { return mode === "etl" ? 0.08 : 0.22 + 0.6 * chg; };
  var churn = function (v) { return v < 0.33 ? "rarely" : v < 0.66 ? "sometimes" : "constantly"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A pipeline from source to report. In ETL a bad record is rejected at a validation gate. In ELT it is stored raw and shows up wrong in a report.",
    vars: [
      { key: "mode", label: "When is structure applied?", type: "choice", value: "etl",
        options: [{ value: "etl", label: "On write (ETL)" }, { value: "elt", label: "On read (ELT)" }] },
      { key: "chg", label: "How often the source changes shape", min: 0, max: 1, step: 0.01, value: 0.15, color: "var(--s1)", fmt: churn }
    ],
    scenario: [
      { caption: "Schema-on-write: every record is validated before it's stored. The bad one is stopped at the door, and the warehouse stays clean.", set: { mode: "etl", chg: 0.15 }, hold: 4400 },
      { caption: "But when the source keeps changing, the gate keeps breaking and someone has to keep fixing the pipeline.", set: { chg: 0.9 }, dur: 1800, hold: 3800 },
      { caption: "Schema-on-read: everything lands raw, so ingestion never breaks. The bad record sails through into a report.", set: { mode: "elt" }, hold: 4400 },
      { caption: "With a stable source the flexibility isn't needed, and you still pay later with unchecked data.", set: { chg: 0.15 }, dur: 1800, hold: 3800 }
    ],
    setup: function (svg) {
      var el = T.el, box = function (x, w, label, sub) {
        var r = el("rect", { x: x - w / 2, y: Y - 28, width: w, height: 56, rx: 10, fill: "var(--surface-2)", stroke: "var(--line)", "stroke-width": 2 }, svg);
        el("text", { x: x, y: Y - 2, "text-anchor": "middle", "class": "t-label", text: label }, svg);
        var s = el("text", { x: x, y: Y + 15, "text-anchor": "middle", "class": "t-small", text: sub }, svg);
        return { rect: r, sub: s };
      };
      el("line", { x1: X.src, x2: X.rep, y1: RY, y2: RY, stroke: "var(--line)", "stroke-width": 3, "stroke-dasharray": "2 6", "stroke-linecap": "round" }, svg);
      var src = box(X.src, 84, "Source", "app / vendor");
      var gate = box(X.gate, 108, "Validate", "");
      var store = box(X.store, 96, "Storage", "");
      var rep = box(X.rep, 100, "Report", "");
      var note = el("text", { x: 320, y: 172, "text-anchor": "middle", "class": "t-mid" }, svg);

      var rec = el("circle", { cy: RY, r: 9, stroke: "var(--surface)", "stroke-width": 2 }, svg);
      var cross = el("text", { y: RY + 5, "text-anchor": "middle", "class": "t-label", fill: "var(--surface)", text: "×" }, svg);

      // two metrics, two bars each: ETL then ELT; the active mode is solid
      var rows = [
        { y: 214, label: "Engineering effort to keep pipelines running", fn: effort },
        { y: 276, label: "Bad data reaching reports", fn: badData }
      ];
      rows.forEach(function (row) {
        el("text", { x: 30, y: row.y - 6, "class": "t-label", text: row.label }, svg);
        row.bars = ["etl", "elt"].map(function (m, i) {
          el("text", { x: 30, y: row.y + 17 + i * 20, "class": "t-small", text: m.toUpperCase() }, svg);
          el("rect", { x: 64, y: row.y + 6 + i * 20, width: 260, height: 11, rx: 5, fill: "var(--surface-2)" }, svg);
          return el("rect", { x: 64, y: row.y + 6 + i * 20, height: 11, rx: 5, fill: i === 0 ? "var(--s1)" : "var(--s2)" }, svg);
        });
      });
      var stat = el("text", { x: 346, y: 238, "class": "t-small" }, svg);
      var stat2 = el("text", { x: 346, y: 258, "class": "t-small" }, svg);

      return function (s, t) {
        var etl = s.mode === "etl", k = Math.floor(t / PERIOD), ph = (t % PERIOD) / PERIOD;
        if (T.reduced) { k = 1; ph = 0.79; } // no motion: show the bad record's final position
        var bad = k % 2 === 1;
        T.set(gate.rect, { stroke: etl ? "var(--s1)" : "var(--line)", "stroke-dasharray": etl ? "none" : "4 4", opacity: etl ? 1 : 0.5 });
        T.set(gate.sub, { text: etl ? "check + reshape" : "no checks" });
        T.set(store.sub, { text: etl ? "clean tables" : "raw files" });
        T.set(rep.sub, { text: etl ? "reads as-is" : "shapes on read" });
        T.set(rep.rect, { stroke: !etl && bad && ph > 0.8 ? "var(--bad)" : "var(--line)" });

        var stops = etl && bad, endX = stops ? X.gate : X.rep;
        var p = T.clamp(ph / 0.8, 0, 1), x = X.src + (endX - X.src) * T.ease(p);
        var fade = ph > 0.8 ? 1 - (ph - 0.8) / 0.2 : 1;
        T.set(rec, { cx: x, fill: bad ? "var(--bad)" : "var(--good)", opacity: fade });
        T.set(cross, { x: x, opacity: bad ? fade : 0 });
        T.set(note, {
          text: !bad ? "Good record: arrives either way" : etl ? "Bad record: rejected at load, fixed before anyone sees it" : "Bad record: stored raw, wrong in the report weeks later",
          fill: !bad ? "var(--muted)" : etl ? "var(--good)" : "var(--bad)"
        });
        rows.forEach(function (row) {
          T.set(row.bars[0], { width: Math.max(4, row.fn("etl", s.chg) * 260), opacity: etl ? 1 : 0.3 });
          T.set(row.bars[1], { width: Math.max(4, row.fn("elt", s.chg) * 260), opacity: etl ? 0.3 : 1 });
        });
        T.set(stat, { text: etl ? "Each source change needs pipeline work first." : "Raw landing absorbs source changes." });
        T.set(stat2, { text: etl ? "Problems are found early, by the pipeline." : "Problems are found late, by readers." });
      };
    }
  });
})(window.Tradeoff);
