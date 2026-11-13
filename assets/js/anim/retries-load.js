// Each attempt fails with probability p. A request makes up to r retries, so the backend sees λ × (1 + p + p² + …) per request-rate λ (as a share of capacity).
// Past capacity the backend's useful output collapses (queues time out), which raises p again. p is solved by damped fixed-point iteration.
// A retry budget caps the extra load at 10% by letting only a share ρ of failures retry.
(function (T) {
  var BUDGET = 0.1, MAXR = 5, MAXF = 0.6;
  function solve(lam, f0, r, pol) {
    var p = f0, E, rho;
    var parts = function () {
      E = 0; for (var k = 1; k <= r; k++) E += Math.pow(p, k);
      rho = (pol === "budget" && E > 0) ? Math.min(1, BUDGET / E) : 1;
      return lam * (1 + rho * E);
    };
    var offered;
    for (var i = 0; i < 80; i++) {
      offered = parts();
      var good = offered <= 1 ? 1 : 1 / (offered * offered);
      p += 0.5 * ((1 - (1 - f0) * good) - p);
    }
    offered = parts();
    return { p: p, E: E, rho: rho, offered: offered, success: 1 - (rho * Math.pow(p, r + 1) + (1 - rho) * p) };
  }

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "The attempts one request makes, a gauge of the load the backend receives against its capacity, and curves of the share of requests that succeed with and without retries as the backend's own failure rate grows.",
    vars: [
      { key: "r", label: "Retries per request", min: 0, max: MAXR, step: 1, value: 0, color: "var(--s1)", fmt: function (v) { return Math.round(v); } },
      { key: "f", label: "How often the backend fails on its own", min: 0, max: MAXF, step: 0.01, value: 0.1, color: "var(--s2)", fmt: function (v) { return Math.round(v * 100) + "%"; } },
      { key: "l", label: "Normal traffic (share of capacity)", min: 0.4, max: 0.95, step: 0.01, value: 0.8, color: "var(--s3)", fmt: function (v) { return Math.round(v * 100) + "%"; } },
      { key: "pol", label: "Retry policy", type: "choice", value: "plain",
        options: [{ value: "plain", label: "Always retry" }, { value: "budget", label: "Retry budget (≤10% extra)" }] }
    ],
    scenario: [
      { caption: "No retries: one attempt in ten fails, and users see every failure.", set: { r: 0, f: 0.1, l: 0.8, pol: "plain" }, hold: 3400 },
      { caption: "Three retries hide the blips. Almost every request succeeds, for about 11% more load.", set: { r: 3 }, dur: 1800, hold: 3800 },
      { caption: "Now the backend is struggling. Every failure triggers three more attempts, the extra load pushes it past capacity, and more attempts fail. Users do worse than with no retries at all.", set: { f: 0.3 }, dur: 2400, hold: 5200 },
      { caption: "A retry budget lets only a limited share of failures retry. The load stays under the tipping point and users do better than with no retries.", set: { pol: "budget" }, hold: 4600 },
      { caption: "For ordinary blips the budget still allows nearly all the retries that are needed.", set: { f: 0.1 }, dur: 2200, hold: 3800 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330, GM = 2.5;
      el("text", { x: x0, y: 30, "class": "t-label", text: "Attempts one request makes" }, svg);
      var dots = [];
      for (var i = 0; i <= MAXR; i++) dots.push(el("circle", { cx: x0 + 12 + i * 32, cy: 54, r: 11, fill: "var(--s1)" }, svg));
      el("text", { x: x0, y: 84, "class": "t-small", text: "brightness = how often that attempt is needed" }, svg);

      el("text", { x: x0, y: 112, "class": "t-label", text: "Load on the backend" }, svg);
      el("rect", { x: x0, y: 120, width: W, height: 22, rx: 4, fill: "var(--line)", opacity: 0.5 }, svg);
      var g1 = el("rect", { x: x0, y: 120, height: 22, fill: "var(--s1)" }, svg);
      var g2 = el("rect", { y: 120, height: 22, fill: "var(--s2)" }, svg);
      var capX = x0 + W / GM;
      el("path", { d: "M" + capX + " 114V148", stroke: "var(--ink)", "stroke-width": 2, "stroke-dasharray": "3 3" }, svg);
      el("text", { x: capX + 5, y: 160, "class": "t-small", text: "capacity" }, svg);
      var gT = el("text", { x: x0 + W, y: 112, "text-anchor": "end", "class": "t-small" }, svg);

      var big = el("text", { x: x0, y: 210, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 232, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 268, "class": "t-mid" }, svg);
      var note = el("text", { x: x0, y: 292, "class": "t-small" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, MAXF], yDomain: [0, 1], xLabel: "backend's own failure rate →", yLabel: "requests that succeed" });
      el("path", { d: C.path(function (f) { return 1 - f; }, 0, MAXF, 2), fill: "none", stroke: "var(--muted)", "stroke-width": 2, "stroke-dasharray": "5 4" }, C.g);
      var pCur = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      el("text", { x: C.px(0.02), y: C.py(0.62), "class": "t-small", text: "no retries" }, C.g);
      el("text", { x: C.px(0.34), y: C.py(0.1), "class": "t-small", fill: "var(--ink)", text: "with this policy" }, C.g);

      return function (s) {
        var r = Math.round(s.r), res = solve(s.l, s.f, r, s.pol), base = 1 - s.f;
        dots.forEach(function (d, i) { T.set(d, { opacity: i <= r ? Math.max(0.12, Math.pow(res.p, i)) : 0 }); });
        var extra = res.offered - s.l;
        T.set(g1, { width: Math.min(W, s.l * W / GM) });
        T.set(g2, { x: x0 + Math.min(W, s.l * W / GM), width: Math.max(0, Math.min(W - s.l * W / GM, extra * W / GM)), fill: res.offered > 1 ? "var(--bad)" : "var(--s2)" });
        T.set(gT, { text: Math.round(res.offered * 100) + "% of capacity" });
        T.set(pCur, { d: C.path(function (f) { return solve(s.l, f, r, s.pol).success; }, 0, MAXF, 30) });
        T.set(mk, { cx: C.px(s.f), cy: C.py(res.success) });
        T.set(big, { text: (res.success * 100).toFixed(res.success > 0.995 ? 2 : 0) + "% of requests succeed" });
        T.set(sub, { text: "with no retries: " + Math.round(base * 100) + "%  ·  attempts per request: " + (1 + res.rho * res.E).toFixed(2) });
        var d = res.success - base;
        T.set(verdict, { text: r === 0 ? "Baseline: users see every failure" : d > 0.01 ? "Retries help" : d < -0.01 ? "Retries make it worse" : "Retries change little", fill: r === 0 ? "var(--muted)" : d > 0.01 ? "var(--good)" : d < -0.01 ? "var(--bad)" : "var(--warn)" });
        T.set(note, { text: res.offered > 1 ? "Over capacity: attempts time out, and each timeout is retried" : "" });
      };
    }
  });
})(window.Tradeoff);
