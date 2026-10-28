// Waiting buys information (expected regret falls) but costs delay. Irreversible choices carry more regret, so they justify waiting longer.
(function (T) {
  var DELAY = 40, REGRET = { rev: 20, irrev: 100 }, WEEKS = 12;
  var regret = function (t, k) { return REGRET[k] * Math.pow(1 - t, 2); };
  var delay = function (t) { return DELAY * t; };
  var total = function (t, k) { return regret(t, k) + delay(t); };
  var best = function (k) { return Math.max(0, 1 - DELAY / (2 * REGRET[k])); };
  var when = function (t) { var w = Math.round(t * WEEKS); return w === 0 ? "now" : "week " + w; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A funnel of possible outcomes that narrows as information arrives, with a movable commit point, and curves of regret, delay cost and their total against when you commit.",
    vars: [
      { key: "t", label: "When you commit to a decision", min: 0, max: 1, step: 0.01, value: 0, color: "var(--s1)", fmt: when },
      { key: "k", label: "Can you undo it later?", type: "choice", value: "irrev",
        options: [{ value: "irrev", label: "Hard to reverse" }, { value: "rev", label: "Easy to reverse" }] }
    ],
    scenario: [
      { caption: "A hard-to-reverse decision made today: the range of possible outcomes is still wide, so it is mostly a guess.", set: { t: 0, k: "irrev" }, hold: 3600 },
      { caption: "Wait for evidence and the funnel narrows. Around week 10 the extra information stops paying for the delay.", set: { t: 0.8 }, dur: 2600, hold: 3800 },
      { caption: "Wait longer and you are paying for delay with little left to learn. Postponing forever is also a decision.", set: { t: 1 }, dur: 1800, hold: 3600 },
      { caption: "If the choice is easy to reverse, being wrong is cheap and waiting is mostly a cost.", set: { k: "rev" }, hold: 3600 },
      { caption: "So commit now, learn from the result, and adjust. Match how long you wait to how costly a mistake would be.", set: { t: 0 }, dur: 2400, hold: 3800 }
    ],
    setup: function (svg) {
      var el = T.el;
      var L = T.chart(svg, { x: 30, y: 48, w: 290, h: 150, xDomain: [0, 1], yDomain: [-1, 1], xLabel: "time, as evidence arrives →", yLabel: "range of possible outcomes" });
      var spread = function (t) { return 0.12 + 0.88 * (1 - t); };
      el("path", { d: L.path(spread, 0, 1, 50) + L.path(function (t) { return -spread(t); }, 1, 0, 50).replace("M", "L") + "Z", fill: "var(--s1)", "fill-opacity": 0.14, stroke: "var(--s1)", "stroke-width": 1.5 }, L.g);
      var wait = el("rect", { x: 0, y: 0, height: L.h, fill: "var(--s2)", "fill-opacity": 0.14 }, L.g);
      var line = el("line", { y1: -4, y2: L.h, stroke: "var(--ink)", "stroke-width": 2 }, L.g);
      var bar = el("line", { stroke: "var(--ink)", "stroke-width": 5, "stroke-linecap": "round" }, L.g);
      el("text", { x: 4, y: 14, "class": "t-small", fill: "var(--s2)", text: "time spent waiting" }, L.g);

      var R = T.chart(svg, { x: 392, y: 48, w: 218, h: 150, xDomain: [0, 1], yDomain: [0, 110], xLabel: "when you commit →", yLabel: "expected cost" });
      var pReg = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2, "stroke-dasharray": "5 4" }, R.g);
      el("path", { d: R.path(delay, 0, 1, 2), fill: "none", stroke: "var(--s2)", "stroke-width": 2, "stroke-dasharray": "5 4" }, R.g);
      var pTot = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, R.g);
      var bestLine = el("line", { y1: 0, y2: R.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, R.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, R.g);
      el("text", { x: R.px(0.04), y: R.py(104), "class": "t-small", fill: "var(--s1)", text: "regret" }, R.g);
      el("text", { x: R.px(0.7), y: R.py(delay(0.7)) + 16, "class": "t-small", fill: "var(--s2)", text: "delay" }, R.g);

      var big = el("text", { x: 30, y: 246, "class": "t-big" }, svg);
      var sub = el("text", { x: 30, y: 268, "class": "t-small" }, svg);
      var verdict = el("text", { x: 30, y: 296, "class": "t-mid" }, svg);

      return function (s) {
        var t = s.t, k = s.k, tot = total(t, k), b = best(k), tb = total(b, k);
        T.set(wait, { width: L.px(t) });
        T.set(line, { x1: L.px(t), x2: L.px(t) });
        T.set(bar, { x1: L.px(t), x2: L.px(t), y1: L.py(spread(t)), y2: L.py(-spread(t)) });
        T.set(pReg, { d: R.path(function (x) { return regret(x, k); }, 0, 1, 60) });
        T.set(pTot, { d: R.path(function (x) { return total(x, k); }, 0, 1, 60) });
        T.set(bestLine, { x1: R.px(b), x2: R.px(b) });
        T.set(mk, { cx: R.px(t), cy: R.py(tot) });
        T.set(big, { text: "Expected cost " + Math.round(tot) });
        T.set(sub, { text: "regret " + Math.round(regret(t, k)) + " + delay " + Math.round(delay(t)) + " · committing " + when(t) });
        T.set(verdict, { text: tot > tb * 1.6 ? "Far from the best moment (" + when(b) + ")" : tot > tb * 1.15 ? "Close to the best moment (" + when(b) + ")" : "About the right time to commit", fill: tot > tb * 1.6 ? "var(--bad)" : tot > tb * 1.15 ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
