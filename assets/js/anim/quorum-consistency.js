// Dynamo-style quorums: with N replicas, a write waits for W acks and a read for R replies. R + W > N forces the two sets to overlap.
(function (T) {
  var N = 5, LAT = [8, 15, 30, 55, 110]; // reply time of each replica, fastest first (ms)
  var MAXMS = LAT[N - 1];

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Five replicas showing which ones hold the latest write and which ones a read asks, and a grid of read and write quorum sizes marking which combinations always read fresh data.",
    vars: [
      { key: "w", label: "Write waits for this many replicas (W)", min: 1, max: N, step: 1, value: 1, color: "var(--s1)", fmt: function (v) { return Math.round(v); } },
      { key: "r", label: "Read asks this many replicas (R)", min: 1, max: N, step: 1, value: 1, color: "var(--s2)", fmt: function (v) { return Math.round(v); } }
    ],
    scenario: [
      { caption: "Write to one replica, read from one. Both are fast, but the replica you read may not have the write yet.", set: { w: 1, r: 1 }, hold: 3800 },
      { caption: "Ask all five when reading: it is certain to include a replica with the latest value, but now the slowest replica sets the read time.", set: { r: 5 }, dur: 1800, hold: 3800 },
      { caption: "Majority on both sides (3 + 3 > 5): any read must meet any write, and neither waits for the two slowest replicas.", set: { w: 3, r: 3 }, dur: 2000, hold: 4000 },
      { caption: "Wait for all five on writes instead: reads can be answered by one replica, and the cost moves to writes.", set: { w: 5, r: 1 }, dur: 2000, hold: 3800 }
    ],
    setup: function (svg) {
      var el = T.el, gx = 40, sp = 56, cy = 90;
      el("text", { x: gx - 10, y: 34, "class": "t-label", text: "Five replicas, fastest first" }, svg);
      var reps = [], rings = [], lats = [];
      for (var i = 0; i < N; i++) {
        var cx = gx + i * sp + 18;
        rings.push(el("circle", { cx: cx, cy: cy, r: 25, fill: "none", stroke: "var(--s2)", "stroke-width": 3.5, "stroke-dasharray": "5 4" }, svg));
        reps.push(el("circle", { cx: cx, cy: cy, r: 18 }, svg));
        lats.push(el("text", { x: cx, y: cy + 46, "text-anchor": "middle", "class": "t-small", text: LAT[i] + " ms" }, svg));
      }
      el("circle", { cx: gx + 8, cy: 158, r: 6, fill: "var(--s1)" }, svg);
      el("text", { x: gx + 20, y: 162, "class": "t-small", text: "has the latest write" }, svg);
      el("circle", { cx: gx + 132, cy: 158, r: 6, fill: "none", stroke: "var(--s2)", "stroke-width": 2.5, "stroke-dasharray": "3 2" }, svg);
      el("text", { x: gx + 144, y: 162, "class": "t-small", text: "asked by a read (stale first)" }, svg);

      var verdict = el("text", { x: gx - 10, y: 218, "class": "t-big" }, svg);
      var why = el("text", { x: gx - 10, y: 240, "class": "t-small" }, svg);
      var wl = el("text", { x: gx - 10, y: 274, "class": "t-mid" }, svg);
      var rl = el("text", { x: gx - 10, y: 298, "class": "t-mid" }, svg);

      // grid of (W, R) combinations
      var gxo = 440, gyo = 70, cs = 28;
      el("text", { x: gxo, y: 40, "class": "t-label", text: "Read always fresh?" }, svg);
      for (var w = 1; w <= N; w++) for (var r = 1; r <= N; r++) {
        el("rect", { x: gxo + (w - 1) * cs, y: gyo + (N - r) * cs, width: cs - 3, height: cs - 3, rx: 4, fill: w + r > N ? "var(--good)" : "var(--line)", opacity: w + r > N ? 0.45 : 0.7 }, svg);
      }
      el("text", { x: gxo + N * cs / 2, y: gyo + N * cs + 14, "text-anchor": "middle", "class": "t-small", text: "W (write acks) →" }, svg);
      el("text", { x: gxo - 8, y: gyo + 4, "text-anchor": "end", "class": "t-small", text: "R ↑" }, svg);
      var sel = el("rect", { width: cs - 3, height: cs - 3, rx: 4, fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, svg);

      return function (s) {
        var w = Math.round(s.w), r = Math.round(s.r), ok = w + r > N;
        for (var i = 0; i < N; i++) {
          T.set(reps[i], { fill: i < w ? "var(--s1)" : "var(--line)" });
          T.set(rings[i], { opacity: i >= N - r ? 1 : 0 });
        }
        T.set(sel, { x: gxo + (w - 1) * cs, y: gyo + (N - r) * cs });
        T.set(verdict, { text: ok ? "Reads always see the latest write" : "A read can return stale data", fill: ok ? "var(--good)" : "var(--bad)" });
        T.set(why, { text: "W + R = " + (w + r) + (ok ? " > " : " ≤ ") + N + (ok ? ": the sets must overlap" : ": the sets can miss each other") });
        T.set(wl, { text: "Write takes " + LAT[w - 1] + " ms", fill: LAT[w - 1] > 50 ? "var(--warn)" : "var(--ink)" });
        T.set(rl, { text: "Read takes " + LAT[r - 1] + " ms", fill: LAT[r - 1] > 50 ? "var(--warn)" : "var(--ink)" });
      };
    }
  });
})(window.Tradeoff);
