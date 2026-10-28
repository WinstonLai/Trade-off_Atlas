// Same table, two layouts. Row store keeps each record together; column store keeps each column together.
// Time ≈ SEEK per separate place to read + one unit per value read.
(function (T) {
  var COLS = 20, GR = 10, ROWS = 1000, SEEK = 100;
  var cost = function (layout, rows, k) {
    var n = rows === "one" ? 1 : ROWS;
    return layout === "row" ? SEEK + n * COLS : SEEK * k + n * k;
  };
  var fmt = function (v) { return Math.round(v).toLocaleString("en-US"); };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Two grids showing which values a row store and a column store must read for a query, and bars comparing their time.",
    vars: [
      { key: "k", label: "Columns the query needs", min: 1, max: COLS, step: 1, value: 2, color: "var(--s1)", fmt: function (v) { return Math.round(v) + " of " + COLS; } },
      { key: "rows", label: "Which rows?", type: "choice", value: "all",
        options: [{ value: "all", label: "All rows (analytics)" }, { value: "one", label: "One row (lookup)" }] }
    ],
    scenario: [
      { caption: "A report that sums 2 of 20 columns over every row. The column store reads only those two columns.", set: { k: 2, rows: "all" }, hold: 3800 },
      { caption: "The row store must read every row in full to get at two values each, so most of what it reads is thrown away.", set: { k: 2 }, hold: 3000 },
      { caption: "Ask for all 20 columns and the advantage disappears, the column store even has more places to look.", set: { k: 20 }, dur: 2400, hold: 3600 },
      { caption: "Now fetch one whole record. The row store reads it in a single place, while the column store must gather it from 20 columns.", set: { rows: "one" }, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el, cw = 7, ch = 9, gy = 62, xs = { row: 30, col: 196 };
      var cells = { row: [], col: [] };
      [["row", "Row store reads"], ["col", "Column store reads"]].forEach(function (g) {
        el("text", { x: xs[g[0]], y: 50, "class": "t-label", text: g[1] }, svg);
        for (var r = 0; r < GR; r++) for (var c = 0; c < COLS; c++) cells[g[0]].push(el("rect", { x: xs[g[0]] + c * cw, y: gy + r * ch, width: cw - 1, height: ch - 1, rx: 1 }, svg));
      });
      el("rect", { x: 30, y: 168, width: 9, height: 9, rx: 2, fill: "var(--s1)" }, svg);
      el("text", { x: 44, y: 177, "class": "t-small", text: "needed" }, svg);
      el("rect", { x: 96, y: 168, width: 9, height: 9, rx: 2, fill: "var(--s2)", opacity: 0.5 }, svg);
      el("text", { x: 110, y: 177, "class": "t-small", text: "read, then discarded" }, svg);
      el("rect", { x: 232, y: 168, width: 9, height: 9, rx: 2, fill: "var(--line)" }, svg);
      el("text", { x: 246, y: 177, "class": "t-small", text: "never touched" }, svg);

      el("text", { x: 372, y: 50, "class": "t-label", text: "Time to answer the query" }, svg);
      var bars = {}, vals = {};
      [["row", "Row store", 70], ["col", "Column store", 128]].forEach(function (b) {
        el("text", { x: 372, y: b[2], "class": "t-small", text: b[1] }, svg);
        bars[b[0]] = el("rect", { x: 372, y: b[2] + 8, height: 18, rx: 4 }, svg);
        vals[b[0]] = el("text", { x: 372, y: b[2] + 44, "class": "t-small" }, svg);
      });

      var big = el("text", { x: 30, y: 236, "class": "t-big" }, svg);
      var sub = el("text", { x: 30, y: 260, "class": "t-small" }, svg);
      var tip = el("text", { x: 30, y: 292, "class": "t-small" }, svg);

      return function (s) {
        var k = Math.round(s.k), one = s.rows === "one", HOT = 4;
        for (var r = 0; r < GR; r++) for (var c = 0; c < COLS; c++) {
          var i = r * COLS + c, need = c < k && (!one || r === HOT);
          var rowRead = !one || r === HOT;
          T.set(cells.row[i], need ? { fill: "var(--s1)", opacity: 1 } : rowRead ? { fill: "var(--s2)", opacity: 0.5 } : { fill: "var(--line)", opacity: 1 });
          T.set(cells.col[i], need ? { fill: "var(--s1)", opacity: 1 } : { fill: "var(--line)", opacity: 1 });
        }
        var cr = cost("row", s.rows, k), cc = cost("col", s.rows, k), mx = Math.max(cr, cc);
        T.set(bars.row, { width: Math.max(4, 230 * cr / mx), fill: cr <= cc ? "var(--good)" : "var(--s2)" });
        T.set(bars.col, { width: Math.max(4, 230 * cc / mx), fill: cc <= cr ? "var(--good)" : "var(--s2)" });
        T.set(vals.row, { text: fmt(cr) + " units · " + 1 + " place" + " to read" });
        T.set(vals.col, { text: fmt(cc) + " units · " + k + (k === 1 ? " place" : " places") + " to read" });
        var f = Math.max(cr, cc) / Math.min(cr, cc);
        T.set(big, { text: f < 1.15 ? "About the same" : (cc < cr ? "Column store" : "Row store") + " is " + (f < 10 ? f.toFixed(1) : Math.round(f)) + "× faster", fill: f < 1.15 ? "var(--ink)" : "var(--good)" });
        T.set(sub, { text: one ? "reading " + k + " of " + COLS + " values from one record" : "reading " + k + " of " + COLS + " values from " + ROWS.toLocaleString("en-US") + " records" });
        T.set(tip, { text: "(grid shows 10 of the rows; the calculation uses " + ROWS.toLocaleString("en-US") + ")" });
      };
    }
  });
})(window.Tradeoff);
