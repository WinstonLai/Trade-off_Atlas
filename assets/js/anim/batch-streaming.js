// Events flow from a source. Batch collects them in a bucket and flushes on a schedule;
// streaming sends each one straight through.
(function (T) {
  var OPTS = [
    { name: "Streaming", age: "seconds", cost: 0.95, cx: 0.95, period: 0 },
    { name: "Every minute", age: "~1 minute", cost: 0.7, cx: 0.65, period: 1300 },
    { name: "Every 15 min", age: "~10 minutes", cost: 0.45, cx: 0.4, period: 2200 },
    { name: "Hourly", age: "~45 minutes", cost: 0.32, cx: 0.3, period: 3200 },
    { name: "Every 6 hours", age: "~4 hours", cost: 0.24, cx: 0.24, period: 4400 },
    { name: "Nightly", age: "up to a day", cost: 0.18, cx: 0.2, period: 6000 }
  ];
  var N = 12;

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Events flowing from a source into a warehouse, either one by one or in scheduled batches.",
    vars: [
      { key: "i", label: "Processing schedule", min: 0, max: 5, step: 1, value: 5, color: "var(--s1)", fmt: function (v) { return OPTS[Math.round(v)].name; } }
    ],
    scenario: [
      { caption: "Nightly batch: cheap and simple, but the data can be a day old.", set: { i: 5 }, hold: 6500 },
      { caption: "Run it hourly: fresher, a bit more cost and more jobs to monitor.", set: { i: 3 }, dur: 1200, hold: 6000 },
      { caption: "Streaming: fresh within seconds, but it runs nonstop and has to handle late, duplicate and out-of-order events.", set: { i: 0 }, dur: 1200, hold: 5500 },
      { caption: "Micro-batches are often the pragmatic middle: fresh enough, without streaming's complexity.", set: { i: 2 }, dur: 1200, hold: 6000 }
    ],
    setup: function (svg) {
      var el = T.el, Y = 110, SRC = 60, BKT = 300, WH = 540;
      el("rect", { x: SRC - 36, y: Y - 30, width: 72, height: 60, rx: 10, fill: "var(--surface-2)", stroke: "var(--line)", "stroke-width": 2 }, svg);
      el("text", { x: SRC, y: Y + 4, "text-anchor": "middle", "class": "t-label", text: "App events" }, svg);
      el("line", { x1: SRC + 36, x2: WH - 50, y1: Y, y2: Y, stroke: "var(--line)", "stroke-width": 2, "stroke-dasharray": "2 6" }, svg);
      var bucket = el("g", {}, svg);
      el("path", { d: "M" + (BKT - 44) + " " + (Y - 34) + "h88l-10 68h-68Z", fill: "var(--surface-2)", stroke: "var(--s1)", "stroke-width": 2, "stroke-linejoin": "round" }, bucket);
      var fill = el("rect", { x: BKT - 36, width: 72, rx: 3, fill: "var(--s1)", "fill-opacity": 0.35 }, bucket);
      el("text", { x: BKT, y: Y + 54, "text-anchor": "middle", "class": "t-small", text: "batch buffer" }, bucket);
      el("rect", { x: WH - 50, y: Y - 40, width: 100, height: 80, rx: 12, fill: "var(--surface-2)", stroke: "var(--line)", "stroke-width": 2 }, svg);
      el("text", { x: WH, y: Y - 16, "text-anchor": "middle", "class": "t-label", text: "Dashboard" }, svg);
      var age = el("text", { x: WH, y: Y + 10, "text-anchor": "middle", "class": "t-mid t-mono" }, svg);
      el("text", { x: WH, y: Y + 28, "text-anchor": "middle", "class": "t-small", text: "since last update" }, svg);
      var flash = el("rect", { x: WH - 50, y: Y - 40, width: 100, height: 80, rx: 12, fill: "var(--s3)", opacity: 0 }, svg);
      var dots = [];
      for (var k = 0; k < N; k++) dots.push(el("circle", { r: 5, cy: Y, fill: "var(--s2)" }, svg));
      var block = el("rect", { y: Y - 12, width: 30, height: 24, rx: 5, fill: "var(--s1)" }, svg);

      var meters = [["Data freshness", "var(--s3)"], ["Running cost", "var(--s2)"], ["Engineering complexity", "var(--bad)"]].map(function (m, i) {
        var x = 30 + i * 200;
        el("text", { x: x, y: 230, "class": "t-label", text: m[0] }, svg);
        el("rect", { x: x, y: 242, width: 170, height: 12, rx: 6, fill: "var(--surface-2)" }, svg);
        return { bar: el("rect", { x: x, y: 242, height: 12, rx: 6, fill: m[1] }, svg), txt: el("text", { x: x, y: 276, "class": "t-small" }, svg) };
      });

      var lastFlush = 0, lastIdx = -1;
      return function (s, t) {
        var o = OPTS[Math.round(s.i)], streaming = o.period === 0;
        if (Math.round(s.i) !== lastIdx) { lastIdx = Math.round(s.i); lastFlush = t; }
        var stop = streaming ? WH - 50 : BKT - 30;
        for (var k = 0; k < N; k++) {
          var f = ((t / 2600) + k / N) % 1;
          T.set(dots[k], { cx: SRC + 36 + f * (stop - SRC - 36), opacity: f > 0.93 ? (1 - f) / 0.07 : 1 });
        }
        bucket.style.opacity = streaming ? 0.25 : 1;
        var fl = 0;
        if (!streaming) {
          var e = t - lastFlush;
          if (e >= o.period) { lastFlush = t; e = 0; }
          fl = e / o.period;
          var mv = T.clamp(e / 500, 0, 1);
          block.style.display = e < 500 ? "" : "none";
          T.set(block, { x: T.lerp(BKT - 15, WH - 50, T.ease(mv)), opacity: 1 - mv * 0.6 });
          T.set(flash, { opacity: e < 700 ? 0.25 * (1 - e / 700) : 0 });
        } else {
          block.style.display = "none";
          T.set(flash, { opacity: 0.08 + 0.06 * Math.sin(t / 200) });
        }
        T.set(fill, { y: Y + 26 - fl * 52, height: fl * 52 });
        T.set(age, { text: streaming ? "~1 s" : o.age });
        var fresh = 1 - Math.round(s.i) / 5.4;
        meters[0].bar.setAttribute("width", Math.max(6, fresh * 170));
        meters[0].txt.textContent = "Data is " + o.age + " old";
        meters[1].bar.setAttribute("width", o.cost * 170);
        meters[1].txt.textContent = streaming ? "Always-on clusters" : "Runs only on schedule";
        meters[2].bar.setAttribute("width", o.cx * 170);
        meters[2].txt.textContent = streaming ? "Late, duplicate and out-of-order events" : "Simple reruns and backfills";
      };
    }
  });
})(window.Tradeoff);
