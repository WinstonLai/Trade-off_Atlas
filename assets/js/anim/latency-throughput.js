// A batch costs a fixed overhead plus a per-item time. Bigger batches amortise the overhead (throughput saturates) but every item waits for the whole batch (latency grows linearly).
(function (T) {
  var PER = 1, OVER = { high: 20, low: 2 }, MAXB = 64, SLO = 50; // ms
  var latency = function (b, o) { return OVER[o] + b * PER; };
  var tput = function (b, o) { return 1000 * b / latency(b, o); }; // items per second
  var best = function (o) { return Math.max(1, Math.min(MAXB, Math.floor((SLO - OVER[o]) / PER))); }; // largest batch within the latency budget
  var SC = 3.4; // px per ms in the batch bar

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A bar showing the fixed overhead and per-item time of one batch, and curves of throughput and latency against batch size.",
    vars: [
      { key: "b", label: "Batch size (items handled per call)", min: 1, max: MAXB, step: 1, value: 1, color: "var(--s1)", fmt: function (v) { return Math.round(v); } },
      { key: "o", label: "Fixed cost of each call", type: "choice", value: "high",
        options: [{ value: "high", label: "High (network round trip)" }, { value: "low", label: "Low (in-process call)" }] }
    ],
    scenario: [
      { caption: "One item per call: each result comes back quickly, but most of the time goes on call overhead, so throughput is low.", set: { b: 1, o: "high" }, hold: 3600 },
      { caption: "Batch 16 items: the overhead is shared, so throughput rises sharply. Each item now waits for the whole batch.", set: { b: 16 }, dur: 2200, hold: 3600 },
      { caption: "Past about 30 the gain is small, because the overhead is already a minor part, while latency keeps growing and breaks the 50 ms budget.", set: { b: 64 }, dur: 2400, hold: 4000 },
      { caption: "When calls are cheap, there's little overhead to share. Small batches already give most of the throughput.", set: { o: "low", b: 8 }, dur: 2000, hold: 3800 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, y0 = 80;
      el("text", { x: x0, y: 50, "class": "t-label", text: "Time spent on one call" }, svg);
      var over = el("rect", { x: x0, y: y0, height: 34, fill: "var(--s2)" }, svg);
      var items = el("rect", { y: y0, height: 34, fill: "var(--s1)" }, svg);
      var overT = el("text", { y: y0 + 54, "class": "t-small", fill: "var(--s2)", text: "overhead" }, svg);
      var itemT = el("text", { y: y0 + 54, "class": "t-small", fill: "var(--s1)" }, svg);
      var slo = el("line", { y1: y0 - 12, y2: y0 + 46, stroke: "var(--bad)", "stroke-width": 2, "stroke-dasharray": "4 3" }, svg);
      el("text", { x: x0 + SLO * SC, y: y0 - 16, "text-anchor": "middle", "class": "t-small", fill: "var(--bad)", text: "50 ms budget" }, svg);

      var big = el("text", { x: x0, y: 218, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 242, "class": "t-mid" }, svg);
      var verdict = el("text", { x: x0, y: 276, "class": "t-small" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [1, MAXB], yDomain: [0, 1], xLabel: "batch size →", yLabel: "relative to the maximum" });
      var pT = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, C.g);
      var pL = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2.5, "stroke-dasharray": "6 5" }, C.g);
      el("text", { x: C.px(30), y: C.py(0.98), "class": "t-small", fill: "var(--s1)", text: "throughput" }, C.g);
      el("text", { x: C.px(3), y: C.py(0.8), "class": "t-small", fill: "var(--s2)", text: "latency" }, C.g);
      var mT = el("circle", { r: 6, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      var mL = el("circle", { r: 6, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);

      return function (s) {
        var b = Math.max(1, Math.round(s.b)), o = s.o, lat = latency(b, o), X = tput(b, o);
        T.set(over, { width: OVER[o] * SC });
        T.set(items, { x: x0 + OVER[o] * SC, width: b * PER * SC });
        T.set(overT, { x: x0 });
        T.set(itemT, { x: x0 + OVER[o] * SC + 4, text: b + (b === 1 ? " item" : " items") + " × " + PER + " ms" });
        T.set(slo, { x1: x0 + SLO * SC, x2: x0 + SLO * SC });
        T.set(pT, { d: C.path(function (x) { return tput(x, o) / 1000; }, 1, MAXB, 70) });
        T.set(pL, { d: C.path(function (x) { return latency(x, o) / (OVER.high + MAXB); }, 1, MAXB, 2) });
        T.set(mT, { cx: C.px(b), cy: C.py(X / 1000) });
        T.set(mL, { cx: C.px(b), cy: C.py(lat / (OVER.high + MAXB)) });
        T.set(big, { text: Math.round(X) + " items / second" });
        T.set(sub, { text: "each item waits " + lat + " ms", fill: lat > SLO ? "var(--bad)" : "var(--good)" });
        T.set(verdict, { text: lat > SLO ? "Over the latency budget. The largest batch that fits is " + best(o) + " items." : "Within the 50 ms latency budget." });
      };
    }
  });
})(window.Tradeoff);
