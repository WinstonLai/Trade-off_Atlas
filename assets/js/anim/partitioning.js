// Eight partitions. Range partitioning keeps neighbouring keys together (cheap range scans) but sends a burst of new keys to one partition;
// hash partitioning spreads keys evenly (no hot spot) but a range query must ask every partition.
(function (T) {
  var P = 8;
  var load = function (s, scheme, p) { return scheme === "hash" ? 1 / P : (p === P - 1 ? s + (1 - s) / P : (1 - s) / P); };
  var peak = function (s, scheme) { return scheme === "hash" ? 1 / P : s + (1 - s) / P; };
  var capacity = function (s, scheme) { return 1 / P / peak(s, scheme); }; // share of the cluster usable before the busiest partition is full
  var pc = function (v) { return Math.round(v * 100) + "%"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Load on each of eight partitions under hash and range partitioning, which partitions a recent-keys query touches, and a curve of usable cluster capacity against skew.",
    vars: [
      { key: "s", label: "Share of traffic hitting the newest keys", min: 0, max: 0.9, step: 0.01, value: 0.05, color: "var(--s1)", fmt: pc },
      { key: "scheme", label: "How keys are split", type: "choice", value: "range",
        options: [{ value: "range", label: "By key range" }, { value: "hash", label: "By hash of the key" }] }
    ],
    scenario: [
      { caption: "Keys split into ranges. When traffic is spread over all keys, load is even and range queries are cheap.", set: { s: 0.05, scheme: "range" }, hold: 3800 },
      { caption: "Most traffic starts hitting recent keys (new orders, today's events). They all live in the last range, so one partition takes the load.", set: { s: 0.8 }, dur: 2600, hold: 4000 },
      { caption: "Hash the key instead: the same traffic is spread evenly, and nothing is hot.", set: { scheme: "hash" }, hold: 3800 },
      { caption: "The price: 'give me the last hour' now has to ask all eight partitions, where range partitioning asked one.", set: {}, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, sp = 36, base = 150, H = 100;
      el("text", { x: x0, y: 36, "class": "t-label", text: "Load on each partition" }, svg);
      var bars = [], tiles = [];
      for (var p = 0; p < P; p++) {
        bars.push(el("rect", { x: x0 + p * sp, width: sp - 8, rx: 4 }, svg));
        el("text", { x: x0 + p * sp + (sp - 8) / 2, y: base + 15, "text-anchor": "middle", "class": "t-small", text: "P" + (p + 1) }, svg);
        tiles.push(el("rect", { x: x0 + p * sp, y: 208, width: sp - 8, height: 14, rx: 4 }, svg));
      }
      el("line", { x1: x0, x2: x0 + P * sp - 8, y1: base, y2: base, stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      var fair = base - H / P;
      el("line", { x1: x0, x2: x0 + P * sp - 8, y1: fair, y2: fair, stroke: "var(--muted)", "stroke-dasharray": "4 3" }, svg);
      el("text", { x: x0, y: fair - 4, "class": "t-small", text: "fair share" }, svg);
      el("text", { x: x0, y: base + 30, "class": "t-small", text: "oldest keys" }, svg);
      el("text", { x: x0 + P * sp - 8, y: base + 30, "text-anchor": "end", "class": "t-small", text: "newest keys" }, svg);
      el("text", { x: x0, y: 202, "class": "t-label", text: "A \"last hour\" query has to ask" }, svg);
      var scan = el("text", { x: x0, y: 244, "class": "t-small" }, svg);
      var big = el("text", { x: x0, y: 272, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 294, "class": "t-small" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 170, xDomain: [0, 0.9], yDomain: [0, 1], xLabel: "traffic on newest keys →", yLabel: "usable cluster capacity" });
      el("path", { d: C.path(function (s) { return capacity(s, "hash"); }, 0, 0.9, 2), fill: "none", stroke: "var(--s2)", "stroke-width": 2.5, "stroke-dasharray": "6 5" }, C.g);
      el("path", { d: C.path(function (s) { return capacity(s, "range"); }, 0, 0.9, 60), fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, C.g);
      el("text", { x: C.px(0.45), y: C.py(1) + 14, "class": "t-small", fill: "var(--s2)", text: "hash" }, C.g);
      el("text", { x: C.px(0.3), y: C.py(0.2), "class": "t-small", fill: "var(--s1)", text: "range" }, C.g);
      var mk = el("circle", { r: 6.5, stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);

      return function (st) {
        var sc = st.scheme, s = st.s;
        for (var p = 0; p < P; p++) {
          var l = load(s, sc, p), h = l * H;
          T.set(bars[p], { y: base - h, height: h, fill: l > 2 / P ? "var(--bad)" : "var(--s1)" });
          var touched = sc === "hash" || p === P - 1;
          T.set(tiles[p], { fill: touched ? "var(--s2)" : "var(--line)" });
        }
        T.set(scan, { text: sc === "hash" ? "All 8 partitions (the recent keys are scattered)" : "1 of 8 partitions (the recent keys sit together)" });
        var pk = peak(s, sc) * P;
        T.set(big, { text: "Busiest partition: " + pk.toFixed(1) + "× its fair share", fill: pk > 2 ? "var(--bad)" : pk > 1.3 ? "var(--warn)" : "var(--good)" });
        T.set(sub, { text: "the cluster can only use " + pc(capacity(s, sc)) + " of its capacity before that partition is full" });
        T.set(mk, { cx: C.px(s), cy: C.py(capacity(s, sc)), fill: sc === "hash" ? "var(--s2)" : "var(--s1)" });
      };
    }
  });
})(window.Tradeoff);
