// Popularity is skewed (Zipf), so the first slice of cache serves most requests and each extra slice helps less.
(function (T) {
  var N = 10000, CELLS = 200, PER = N / CELLS, COLS = 20, ROWS = 10, MAXP = 0.5;
  var HIT_MS = 2, MISS_MS = 200, ITEM_MB = 1, LN_N = Math.log(N), GAMMA = 0.5772;
  var hitRate = function (k) { return k < 1 ? 0 : Math.min(1, (Math.log(k) + GAMMA) / (LN_N + GAMMA)); };
  var latency = function (h) { return h * HIT_MS + (1 - h) * MISS_MS; };
  var mem = function (k) { return k * ITEM_MB >= 1000 ? (k * ITEM_MB / 1000).toFixed(1) + " GB" : Math.round(k * ITEM_MB) + " MB"; };
  var pctTxt = function (p) { return (p * 100 < 10 ? (p * 100).toFixed(1) : Math.round(p * 100)) + "%"; };

  // a fixed stream of requests whose popularity rank follows 1/rank
  var REQ = [], seed = 5;
  for (var i = 0; i < 400; i++) { seed = (seed * 9301 + 49297) % 233280; REQ.push(Math.floor(Math.exp(seed / 233280 * LN_N))); }

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A grid of catalogue items with the most popular ones cached, requests landing on it, and a chart of latency and memory against cache size.",
    vars: [
      { key: "p", label: "Cache size (share of the catalogue)", min: 0, max: MAXP, step: 0.005, value: 0, color: "var(--s1)", fmt: pctTxt }
    ],
    scenario: [
      { caption: "No cache: every request goes to the database and takes about 200 ms.", set: { p: 0 }, hold: 3400 },
      { caption: "Cache the most popular 1% of items: a handful of items draws over half of all requests.", set: { p: 0.01 }, dur: 1800, hold: 3400 },
      { caption: "At 5% most requests are hits and the average has fallen by two thirds, for a small amount of memory.", set: { p: 0.05 }, dur: 1800, hold: 3400 },
      { caption: "Ten times more memory (50%) lifts the hit rate from 69% to 93%. Each doubling buys the same few points, so the cost per point keeps rising.", set: { p: 0.5 }, dur: 2600, hold: 3800 }
    ],
    setup: function (svg) {
      var el = T.el, gx = 30, gy = 50, sp = 14;
      el("text", { x: gx, y: 30, "class": "t-label", text: "Catalogue, most popular items first" }, svg);
      var cells = [];
      for (var c = 0; c < CELLS; c++) cells.push(el("rect", { x: gx + (c % COLS) * sp, y: gy + Math.floor(c / COLS) * sp, width: sp - 3, height: sp - 3, rx: 2.5 }, svg));
      var rings = [];
      for (var r = 0; r < 4; r++) rings.push(el("circle", { r: 0, fill: "none", "stroke-width": 2.5 }, svg));
      el("circle", { cx: gx + 5, cy: gy + ROWS * sp + 14, r: 4.5, fill: "var(--s1)" }, svg);
      el("text", { x: gx + 15, y: gy + ROWS * sp + 18, "class": "t-small", text: "cached" }, svg);
      el("circle", { cx: gx + 75, cy: gy + ROWS * sp + 14, r: 4.5, fill: "var(--line)" }, svg);
      el("text", { x: gx + 85, y: gy + ROWS * sp + 18, "class": "t-small", text: "not cached" }, svg);
      el("text", { x: gx, y: gy + ROWS * sp + 38, "class": "t-small", text: "rings flash on each request: green = hit, orange = miss" }, svg);

      var latT = el("text", { x: 30, y: 262, "class": "t-big" }, svg);
      el("text", { x: 30, y: 282, "class": "t-small", text: "average response time" }, svg);
      var subT = el("text", { x: 30, y: 306, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 200, xDomain: [0, MAXP], yDomain: [0, 1], xLabel: "cache size →", yLabel: "relative to the maximum" });
      el("path", { d: C.path(function (p) { return latency(hitRate(p * N)) / MISS_MS; }, 0, MAXP, 120), fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, C.g);
      el("path", { d: C.path(function (p) { return p / MAXP; }, 0, MAXP, 2), fill: "none", stroke: "var(--s2)", "stroke-width": 2.5, "stroke-dasharray": "6 5" }, C.g);
      el("text", { x: C.px(0.2), y: C.py(0.22), "class": "t-small", fill: "var(--s1)", text: "response time" }, C.g);
      el("text", { x: C.px(0.04), y: C.py(0.7), "class": "t-small", fill: "var(--s2)", text: "memory used" }, C.g);
      var mkL = el("circle", { r: 6, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      var mkM = el("circle", { r: 6, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);

      return function (s, t) {
        var k = s.p * N, h = hitRate(k), lat = latency(h);
        var lit = Math.round(s.p * CELLS);
        for (var i = 0; i < CELLS; i++) T.set(cells[i], { fill: i < lit ? "var(--s1)" : "var(--line)", opacity: i < lit ? 1 - i / CELLS * 0.4 : 1 });
        var period = 380, base = Math.floor(t / period), age = (t % period) / period;
        for (var j = 0; j < rings.length; j++) {
          var q = REQ[(base + j * 7) % REQ.length], cell = Math.min(CELLS - 1, Math.floor(q / PER)), isHit = q < k;
          var a = (age + j) / rings.length; // stagger: each ring sits at a different point of its cycle
          T.set(rings[j], { cx: gx + (cell % COLS) * sp + (sp - 3) / 2, cy: gy + Math.floor(cell / COLS) * sp + (sp - 3) / 2, r: 3 + a * 8, stroke: isHit ? "var(--good)" : "var(--s2)", opacity: 1 - a });
        }
        T.set(latT, { text: (lat < 10 ? lat.toFixed(1) : Math.round(lat)) + " ms" });
        T.set(subT, { text: "hit rate " + Math.round(h * 100) + "% · memory " + mem(k) });
        T.set(mkL, { cx: C.px(s.p), cy: C.py(lat / MISS_MS) });
        T.set(mkM, { cx: C.px(s.p), cy: C.py(s.p / MAXP) });
      };
    }
  });
})(window.Tradeoff);
