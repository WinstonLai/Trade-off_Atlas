// Three schema layouts cross-fade. Each cycle alternates a read (joins) and an update (rename a customer).
(function (T) {
  var LEVELS = [
    { name: "Normalized", joins: 2, touch: 1, read: 4, write: 1 },
    { name: "Partly denormalized", joins: 1, touch: 3, read: 2.5, write: 3 },
    { name: "One wide table", joins: 0, touch: 3, read: 1, write: 4 }
  ];
  var CYCLE = 5200;

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Database tables that merge into one wide table, showing joins on read and repeated updates on write.",
    vars: [
      { key: "lvl", label: "Schema design", min: 0, max: 2, step: 1, value: 0, color: "var(--s1)", fmt: function (v) { return LEVELS[Math.round(v)].name; } },
      { key: "r", label: "Workload: share of reads", min: 0.05, max: 0.95, step: 0.01, value: 0.5, color: "var(--s2)", fmt: function (v) { return Math.round(v * 100) + "% reads"; } }
    ],
    scenario: [
      { caption: "Normalized: each fact lives in one place. Renaming a customer touches one row, but every read needs joins.", set: { lvl: 0, r: 0.5 }, hold: 5400 },
      { caption: "Copy the customer name into orders: one fewer join, but now a rename must update every order.", set: { lvl: 1 }, dur: 1400, hold: 5400 },
      { caption: "One wide table: reads are instant, but storage grows and copies can drift out of sync.", set: { lvl: 2 }, dur: 1400, hold: 5400 },
      { caption: "Read-heavy analytics (dashboards) favour denormalized tables…", set: { r: 0.92 }, dur: 1400, hold: 3600 },
      { caption: "…while write-heavy transactional systems favour normalized ones.", set: { lvl: 0, r: 0.15 }, dur: 1800, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el, RH = 22;
      function table(g, x, y, title, cols, widths, rows) {
        var w = widths.reduce(function (a, b) { return a + b; }, 0);
        el("text", { x: x, y: y - 8, "class": "t-label", text: title }, g);
        el("rect", { x: x, y: y, width: w, height: RH * (rows.length + 1), rx: 6, fill: "var(--surface-2)", stroke: "var(--line)" }, g);
        var cx = x, out = { names: [], x: x, y: y, w: w, colX: [] };
        cols.forEach(function (c, i) {
          out.colX.push(cx);
          el("text", { x: cx + 8, y: y + 15, "class": "t-small", text: c }, g);
          rows.forEach(function (r, j) {
            var hl = el("rect", { x: cx + 2, y: y + RH * (j + 1) + 2, width: widths[i] - 4, height: RH - 4, rx: 3, fill: "var(--warn)", opacity: 0 }, g);
            var t = el("text", { x: cx + 8, y: y + RH * (j + 1) + 15, "class": "t-label t-mono", text: r[i] }, g);
            if (r[i] === "Ana") out.names.push({ t: t, hl: hl });
          });
          cx += widths[i];
        });
        for (var j = 1; j <= rows.length; j++) el("line", { x1: x, x2: x + w, y1: y + RH * j, y2: y + RH * j, stroke: "var(--line)" }, g);
        return out;
      }
      var orders = [["#1", "1", "1"], ["#2", "1", "2"], ["#3", "2", "1"], ["#4", "1", "1"]];
      var cust = { "1": "Ana", "2": "Ben" }, prod = { "1": "Lamp", "2": "Desk" };

      var g0 = el("g", {}, svg), g1 = el("g", {}, svg), g2 = el("g", {}, svg);
      var c0 = table(g0, 30, 50, "Customers", ["id", "name"], [40, 70], [["1", "Ana"], ["2", "Ben"]]);
      table(g0, 30, 190, "Products", ["id", "name"], [40, 70], [["1", "Lamp"], ["2", "Desk"]]);
      var o0 = table(g0, 250, 90, "Orders", ["order", "cust", "prod"], [56, 50, 50], orders);
      var j0a = el("path", { d: "M250 140 C200 140 190 90 140 85", fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, g0);
      var j0b = el("path", { d: "M356 210 C356 250 200 250 140 225", fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, g0);

      var o1 = table(g1, 30, 70, "Orders (with customer name)", ["order", "customer", "prod"], [56, 90, 50], orders.map(function (o) { return [o[0], cust[o[1]], o[2]]; }));
      table(g1, 290, 70, "Products", ["id", "name"], [40, 70], [["1", "Lamp"], ["2", "Desk"]]);
      var j1 = el("path", { d: "M226 105 C260 105 260 105 290 105", fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, g1);

      var o2 = table(g2, 30, 70, "Orders (everything in one row)", ["order", "customer", "product", "price"], [56, 90, 80, 70], orders.map(function (o) { return [o[0], cust[o[1]], prod[o[2]], "$" + (o[2] === "1" ? 40 : 120)]; }));
      var groups = [{ g: g0, names: c0.names, joins: [j0a, j0b] }, { g: g1, names: o1.names, joins: [j1] }, { g: g2, names: o2.names, joins: [] }];
      var phaseT = el("text", { x: 30, y: 300, "class": "t-mid" }, svg);
      var phaseT2 = el("text", { x: 30, y: 318, "class": "t-small" }, svg);

      var px = 470;
      var metric = function (y, label) {
        el("text", { x: px, y: y, "class": "t-small", text: label }, svg);
        return el("text", { x: px, y: y + 22, "class": "t-mid t-mono" }, svg);
      };
      var mJoin = metric(40, "Joins per read"), mTouch = metric(90, "Rows to update on rename");
      el("text", { x: px, y: 150, "class": "t-small", text: "Cost for this workload" }, svg);
      var bars = LEVELS.map(function (L, i) {
        var y = 162 + i * 34;
        el("text", { x: px, y: y + 10, "class": "t-small", text: L.name }, svg);
        el("rect", { x: px, y: y + 15, width: 150, height: 10, rx: 5, fill: "var(--surface-2)" }, svg);
        return el("rect", { x: px, y: y + 15, height: 10, rx: 5, fill: "var(--s1)" }, svg);
      });

      return function (s, t) {
        var lvl = s.lvl, L = LEVELS[Math.round(lvl)];
        groups.forEach(function (G, i) {
          var o = T.clamp(1 - Math.abs(lvl - i) * 1.6, 0, 1);
          G.g.style.opacity = o;
          G.g.style.display = o < 0.02 ? "none" : "";
        });
        var ph = (t % CYCLE) / CYCLE, reading = ph < 0.5;
        var G = groups[Math.round(lvl)];
        var pulse = reading ? 0.5 + 0.5 * Math.sin(ph * Math.PI * 12) : 0;
        groups.forEach(function (H) { H.joins.forEach(function (j) { T.set(j, { "stroke-width": H === G ? 2 + pulse * 3 : 2, opacity: reading ? 1 : 0.3 }); }); });
        G.names.forEach(function (n, i) {
          var on = !reading && ph > 0.55 + i * 0.08;
          T.set(n.t, { text: on ? "Anna" : "Ana" });
          T.set(n.hl, { opacity: on ? 0.35 : 0 });
        });
        if (reading) {
          T.set(phaseT, { text: L.joins ? "Read: show orders with names, " + L.joins + (L.joins > 1 ? " joins" : " join") : "Read: one table, no joins", fill: L.joins ? "var(--warn)" : "var(--good)" });
          T.set(phaseT2, { text: L.joins ? "The database has to stitch tables together on every query." : "Everything is already in the row." });
        } else {
          T.set(phaseT, { text: "Update: rename Ana → Anna, " + L.touch + (L.touch > 1 ? " rows" : " row"), fill: L.touch > 1 ? "var(--warn)" : "var(--good)" });
          T.set(phaseT2, { text: L.touch > 1 ? "Miss one copy and the data contradicts itself." : "One fact, one place." });
        }
        T.set(mJoin, { text: String(L.joins) });
        T.set(mTouch, { text: String(L.touch) });
        var costs = LEVELS.map(function (x) { return s.r * x.read + (1 - s.r) * x.write; });
        var min = Math.min.apply(null, costs);
        bars.forEach(function (b, i) { T.set(b, { width: costs[i] / 4 * 150, fill: costs[i] === min ? "var(--good)" : "var(--s1)", opacity: costs[i] === min ? 1 : 0.55 }); });
      };
    }
  });
})(window.Tradeoff);
