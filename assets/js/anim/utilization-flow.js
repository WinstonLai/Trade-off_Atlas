// Kingman's approximation: wait ≈ variability × u / (1 − u) × task time.
(function (T) {
  var VAR = { low: 0.6, high: 1.6 };
  var wait = function (u, v) { return VAR[v] * u / (1 - u); };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Tasks queue in front of a worker. As the worker gets busier, the queue and the waiting time grow sharply.",
    vars: [
      { key: "u", label: "Utilization (how busy)", min: 0.1, max: 0.97, step: 0.01, value: 0.5, color: "var(--s1)", fmt: function (v) { return Math.round(v * 100) + "%"; } },
      { key: "v", label: "How variable the work is", type: "choice", value: "low",
        options: [{ value: "low", label: "Predictable tasks" }, { value: "high", label: "Unpredictable tasks" }] }
    ],
    scenario: [
      { caption: "At 50% busy, work barely waits. There's slack to absorb surprises.", set: { u: 0.5, v: "low" } },
      { caption: "At 75%, a small queue forms. Still fine.", set: { u: 0.75 }, dur: 2000 },
      { caption: "At 90%, the queue jumps. Each task now waits days before anyone touches it.", set: { u: 0.9 }, dur: 2200, hold: 3000 },
      { caption: "At 97%, everyone looks productive, and nothing moves.", set: { u: 0.97 }, dur: 1800, hold: 3000 },
      { caption: "Unpredictable work makes it worse: the knee arrives much earlier.", set: { u: 0.8, v: "high" }, dur: 1600, hold: 3600 }
    ],
    setup: function (svg) {
      var el = T.el, y0 = 120, wx = 300;
      el("rect", { x: 20, y: y0 + 22, width: wx - 10, height: 6, rx: 3, fill: "var(--surface-2)" }, svg);
      el("text", { x: 20, y: 60, "class": "t-label", text: "Queue of waiting tasks" }, svg);
      var boxes = [];
      for (var i = 0; i < 12; i++) boxes.push(el("rect", { width: 18, height: 18, rx: 4, y: y0, fill: "var(--s2)" }, svg));
      var more = el("text", { x: 20, y: y0 - 10, "class": "t-small" }, svg);
      // worker
      el("circle", { cx: wx + 30, cy: y0 + 10, r: 26, fill: "var(--surface-2)" }, svg);
      var ring = el("circle", { cx: wx + 30, cy: y0 + 10, r: 26, fill: "none", stroke: "var(--s1)", "stroke-width": 5, transform: "rotate(-90 " + (wx + 30) + " " + (y0 + 10) + ")", "stroke-linecap": "round" }, svg);
      el("text", { x: wx + 30, y: y0 + 15, "text-anchor": "middle", "class": "t-label", text: "team" }, svg);
      var busy = el("text", { x: wx + 30, y: y0 + 58, "text-anchor": "middle", "class": "t-small" }, svg);
      var done = el("rect", { width: 14, height: 14, rx: 3, y: y0 + 3, fill: "var(--good)" }, svg);

      var waitT = el("text", { x: 20, y: 230, "class": "t-big" }, svg);
      el("text", { x: 20, y: 252, "class": "t-small", text: "average wait before work starts (1-day tasks)" }, svg);
      var meter = el("rect", { x: 20, y: 270, height: 10, rx: 5, fill: "var(--bad)" }, svg);
      el("rect", { x: 20, y: 270, width: 300, height: 10, rx: 5, fill: "none", stroke: "var(--line)" }, svg);

      var c = T.chart(svg, { x: 410, y: 50, w: 210, h: 220, xDomain: [0, 1], yDomain: [0, 20], xLabel: "utilization →", yLabel: "wait (days)" });
      var pLow = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2.5, d: c.path(function (u) { return wait(Math.min(u, 0.995), "low"); }, 0, 0.99, 120) }, c.g);
      var pHigh = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2.5, "stroke-dasharray": "6 5", d: c.path(function (u) { return wait(Math.min(u, 0.995), "high"); }, 0, 0.99, 120) }, c.g);
      el("line", { x1: c.px(0.8), x2: c.px(0.8), y1: 0, y2: c.h, stroke: "var(--line)", "stroke-dasharray": "3 3" }, c.g);
      el("text", { x: c.px(0.8) - 4, y: 12, "text-anchor": "end", "class": "t-small", text: "80%" }, c.g);
      var mk = el("circle", { r: 7, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, c.g);

      return function (s, t) {
        var w = wait(s.u, s.v), q = s.u * w; // Little's law: queue = arrival rate × wait
        var period = 1400, frac = (t % period) / period;
        var nq = Math.min(12, Math.round(q));
        var shift = frac > 0.8 ? T.ease((frac - 0.8) / 0.2) * 22 : 0;
        boxes.forEach(function (b, i) {
          var on = i < nq;
          b.style.display = on ? "" : "none";
          T.set(b, { x: wx - 34 - i * 22 + shift, opacity: i === 0 ? 1 - shift / 30 : 1 });
        });
        T.set(more, { text: q > 12 ? "+" + Math.round(q - 12) + " more waiting off-screen" : "" });
        var circ = 2 * Math.PI * 26;
        T.set(ring, { "stroke-dasharray": (circ * frac) + " " + circ, opacity: 0.4 + s.u * 0.6 });
        T.set(busy, { text: Math.round(s.u * 100) + "% busy" });
        T.set(done, { x: wx + 62 + frac * 240 * (1 - s.u * 0.5), opacity: 1 - frac });
        T.set(waitT, { text: w < 1 ? Math.round(w * 8) + " hours" : w.toFixed(1) + " days", fill: w > 5 ? "var(--bad)" : w > 2 ? "var(--warn)" : "var(--ink)" });
        T.set(meter, { width: T.clamp(w / 20, 0.01, 1) * 300 });
        T.set(pLow, { opacity: s.v === "low" ? 1 : 0.3 });
        T.set(pHigh, { opacity: s.v === "high" ? 1 : 0.3 });
        T.set(mk, { cx: c.px(s.u), cy: c.py(T.clamp(w, 0, 20)) });
      };
    }
  });
})(window.Tradeoff);
