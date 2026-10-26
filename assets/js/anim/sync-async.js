// A 40-hour week: live conversation is quick to settle things but fragments focus time, with diminishing returns.
(function (T) {
  var COLS = 5, ROWS = 8, CELLS = COLS * ROWS, V = 12;
  var TOPIC = {
    routine: { days: 1.2, risk: 0.06 },
    ambiguous: { days: 4, risk: 0.4 }
  };
  var focus = function (live) { return 34 - V * live; }; // every live hour costs about 2x a written one once switching is counted
  var settle = function (topic, live) { return 0.3 + (TOPIC[topic].days - 0.3) * Math.pow(1 - live, 2); };
  var risk = function (topic, live) { return 0.03 + (TOPIC[topic].risk - 0.03) * Math.pow(1 - live, 2); };
  var pct = function (v) { return Math.round(v * 100) + "%"; };

  // fixed pseudo-random order so meetings scatter through the week
  var ORDER = [], RANK = [], seed = 3, i, j;
  for (i = 0; i < CELLS; i++) ORDER.push(i);
  for (j = CELLS - 1; j > 0; j--) { seed = (seed * 9301 + 49297) % 233280; var k = Math.floor(seed / 233280 * (j + 1)); var tmp = ORDER[j]; ORDER[j] = ORDER[k]; ORDER[k] = tmp; }
  ORDER.forEach(function (cell, r) { RANK[cell] = r; });

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A working week of 40 hours with live conversation breaking up focus time, readouts for focus hours and time to settle a question, and a chart of both against the share done live.",
    vars: [
      { key: "live", label: "Share of communication done live", min: 0, max: 1, step: 0.01, value: 0, color: "var(--s1)", fmt: pct },
      { key: "topic", label: "What are you discussing?", type: "choice", value: "routine",
        options: [{ value: "routine", label: "Routine status" }, { value: "ambiguous", label: "An ambiguous problem" }] }
    ],
    scenario: [
      { caption: "Everything in writing: a long unbroken week of focus, and a routine update is settled by the next day.", set: { live: 0, topic: "routine" }, hold: 3600 },
      { caption: "Move it all into meetings: the week fragments, and a routine update is settled about a day sooner. Not much for 12 lost hours.", set: { live: 1 }, dur: 2000, hold: 3800 },
      { caption: "Now an ambiguous problem, handled in writing: days of back-and-forth, and a good chance it's misunderstood.", set: { live: 0, topic: "ambiguous" }, dur: 1200, hold: 3800 },
      { caption: "Some live conversation more than halves the time and the risk. Beyond that, extra meetings mostly cost focus.", set: { live: 0.4 }, dur: 2200, hold: 4200 }
    ],
    setup: function (svg) {
      var el = T.el, gx = 30, gy = 66, sp = 30;
      el("text", { x: gx, y: 30, "class": "t-label", text: "One week, hour by hour" }, svg);
      ["M", "T", "W", "T", "F"].forEach(function (d, c) { el("text", { x: gx + c * sp + 11, y: gy - 8, "text-anchor": "middle", "class": "t-small", text: d }, svg); });
      var cells = [];
      for (var c = 0; c < CELLS; c++) cells.push(el("rect", { x: gx + (c % COLS) * sp, y: gy + Math.floor(c / COLS) * 24, width: 22, height: 19, rx: 4 }, svg));
      el("rect", { x: gx, y: 284, width: 12, height: 12, rx: 3, fill: "var(--s1)" }, svg);
      el("text", { x: gx + 18, y: 295, "class": "t-small", text: "focus" }, svg);
      el("rect", { x: gx + 70, y: 284, width: 12, height: 12, rx: 3, fill: "var(--s2)" }, svg);
      el("text", { x: gx + 88, y: 295, "class": "t-small", text: "meetings + switching" }, svg);

      var rx = 214;
      var fT = el("text", { x: rx, y: 90, "class": "t-big" }, svg);
      el("text", { x: rx, y: 110, "class": "t-small", text: "focus time per week" }, svg);
      var dT = el("text", { x: rx, y: 168, "class": "t-big" }, svg);
      el("text", { x: rx, y: 188, "class": "t-small", text: "to settle a question" }, svg);
      var rT = el("text", { x: rx, y: 246, "class": "t-big" }, svg);
      el("text", { x: rx, y: 266, "class": "t-small", text: "chance it's misunderstood" }, svg);

      var C = T.chart(svg, { x: 440, y: 66, w: 170, h: 190, xDomain: [0, 1], yDomain: [0, 1], xLabel: "share live →", yLabel: "relative" });
      var curve = function (fn) { return function (l) { return fn(l); }; };
      el("path", { d: C.path(curve(function (l) { return focus(l) / 34; }), 0, 1, 40), fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, C.g);
      var pS = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2.5, "stroke-dasharray": "6 5" }, C.g);
      el("text", { x: C.px(0.55), y: C.py(0.79) - 10, "class": "t-small", fill: "var(--s1)", text: "focus" }, C.g);
      var sLab = el("text", { x: C.w - 2, y: 0, "text-anchor": "end", "class": "t-small", fill: "var(--s2)", text: "time to settle" }, C.g);
      var mkF = el("circle", { r: 6, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      var mkS = el("circle", { r: 6, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      var lastTopic = null;

      return function (s) {
        var live = T.clamp(s.live, 0, 1), f = focus(live), lost = Math.round(CELLS - f);
        for (var i = 0; i < CELLS; i++) T.set(cells[i], { fill: RANK[i] < lost ? "var(--s2)" : "var(--s1)", opacity: RANK[i] < lost ? 1 : 0.85 });
        var d = settle(s.topic, live), r = risk(s.topic, live);
        T.set(fT, { text: Math.round(f) + " h" });
        T.set(dT, { text: d < 1 ? Math.round(d * 8) + " hours" : d.toFixed(1) + " days", fill: d > 2.5 ? "var(--bad)" : d > 1 ? "var(--warn)" : "var(--ink)" });
        T.set(rT, { text: pct(r), fill: r > 0.25 ? "var(--bad)" : r > 0.1 ? "var(--warn)" : "var(--ink)" });
        if (lastTopic !== s.topic) {
          lastTopic = s.topic;
          T.set(pS, { d: C.path(function (l) { return settle(s.topic, l) / 4; }, 0, 1, 40) });
          T.set(sLab, { y: C.py(settle(s.topic, 0) / 4) + (s.topic === "routine" ? -8 : 16) });
        }
        T.set(mkF, { cx: C.px(live), cy: C.py(f / 34) });
        T.set(mkS, { cx: C.px(live), cy: C.py(d / 4) });
      };
    }
  });
})(window.Tradeoff);
