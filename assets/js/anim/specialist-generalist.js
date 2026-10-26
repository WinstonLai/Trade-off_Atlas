// Six people, two kinds of work. Specialists are 1.5x as fast at their own kind but can't do the other; generalists do both at 1x.
(function (T) {
  var N = 6, SKILL = 1.5, MIX = { even: 0.5, skew: 0.8 }, KMAX = 3;
  // max sustainable throughput: limited by total capacity, and by each kind of work's own pool
  function through(k, a, outOne) {
    var sa = k, sb = k, g = N - 2 * k;
    if (outOne) { var fromSpec = Math.min(sa, 1); sa -= fromSpec; g -= 1 - fromSpec; }
    return Math.min(SKILL * (sa + sb) + g, (SKILL * sa + g) / a, (SKILL * sb + g) / (1 - a));
  }
  var f1 = function (v) { return v.toFixed(1); };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A team of six made of specialists and generalists facing two kinds of work, and a chart of throughput against how specialised the team is.",
    vars: [
      { key: "k", label: "Specialists per skill (rest are generalists)", min: 0, max: KMAX, step: 1, value: 0, color: "var(--s1)", fmt: function (v) { var r = Math.round(v); return r + " + " + r + " specialists"; } },
      { key: "mix", label: "Shape of the work", type: "choice", value: "even",
        options: [{ value: "even", label: "Balanced (50 / 50)" }, { value: "skew", label: "Lopsided (80 / 20)" }] }
    ],
    scenario: [
      { caption: "Six generalists: everyone can do anything, but nobody is fast at it.", set: { k: 0, mix: "even" }, hold: 3400 },
      { caption: "Balanced work and all specialists: each person is 1.5× faster and nobody is short of work. Throughput peaks.", set: { k: 3 }, dur: 2000, hold: 3800 },
      { caption: "The same team on lopsided work: most work needs skill A, so the B specialists sit idle and the team gets worse than all generalists.", set: { mix: "skew" }, hold: 4200 },
      { caption: "A few specialists plus generalists who flex to wherever the queue is: the best of both when the work is uneven.", set: { k: 1 }, dur: 1800, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el, px0 = 62, gap = 52;
      el("text", { x: 30, y: 30, "class": "t-label", text: "The team" }, svg);
      var people = [], tags = [];
      for (var i = 0; i < N; i++) {
        people.push(el("circle", { cx: px0 + i * gap, cy: 70, r: 18, stroke: "var(--surface)", "stroke-width": 2 }, svg));
        tags.push(el("text", { x: px0 + i * gap, y: 75, "text-anchor": "middle", "class": "t-label", fill: "var(--surface)" }, svg));
      }
      el("text", { x: 30, y: 122, "class": "t-label", text: "Incoming work" }, svg);
      var wa = el("rect", { x: 30, y: 132, height: 22, rx: 6, fill: "var(--s1)" }, svg);
      var wb = el("rect", { y: 132, height: 22, rx: 6, fill: "var(--s2)" }, svg);
      var wat = el("text", { y: 148, "class": "t-small", fill: "var(--surface)", "font-weight": 700 }, svg);
      var wbt = el("text", { y: 148, "class": "t-small", fill: "var(--surface)", "font-weight": 700 }, svg);

      var tput = el("text", { x: 30, y: 206, "class": "t-big" }, svg);
      el("text", { x: 30, y: 226, "class": "t-small", text: "work done per week (generalist-weeks)" }, svg);
      var out = el("text", { x: 30, y: 268, "class": "t-mid" }, svg);
      el("text", { x: 30, y: 288, "class": "t-small", text: "if one person is out sick for the week" }, svg);

      var C = T.chart(svg, { x: 392, y: 130, w: 218, h: 130, xDomain: [0, KMAX], yDomain: [3, 10], xLabel: "more specialised →", yLabel: "throughput" });
      var line = function (a, outOne) { var d = ""; for (var k = 0; k <= KMAX; k += 0.1) d += (k ? "L" : "M") + C.px(k).toFixed(1) + " " + C.py(through(k, a, outOne)).toFixed(1); return d; };
      var pN = el("path", { fill: "none", stroke: "var(--s1)", "stroke-width": 2.5 }, C.g);
      var pO = el("path", { fill: "none", stroke: "var(--s2)", "stroke-width": 2.5, "stroke-dasharray": "6 5" }, C.g);
      var mkN = el("circle", { r: 6, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      var mkO = el("circle", { r: 6, fill: "var(--s2)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);
      el("text", { x: 392, y: 296, "class": "t-small", fill: "var(--s1)", text: "— normal week" }, svg);
      el("text", { x: 492, y: 296, "class": "t-small", fill: "var(--s2)", text: "┄ one person out" }, svg);
      var lastMix = null;

      return function (s) {
        var a = MIX[s.mix], kr = Math.round(T.clamp(s.k, 0, KMAX)), k = T.clamp(s.k, 0, KMAX);
        for (var i = 0; i < N; i++) {
          var kind = i < kr ? "A" : i >= N - kr ? "B" : "G";
          T.set(people[i], { fill: kind === "A" ? "var(--s1)" : kind === "B" ? "var(--s2)" : "var(--s3)" });
          T.set(tags[i], { text: kind === "G" ? "any" : kind });
        }
        var W = 260, wA = a * W;
        T.set(wa, { width: wA });
        T.set(wb, { x: 30 + wA, width: W - wA });
        T.set(wat, { x: 38, text: "A " + Math.round(a * 100) + "%" });
        T.set(wbt, { x: 38 + wA, text: "B " + Math.round((1 - a) * 100) + "%" });
        if (lastMix !== s.mix) { lastMix = s.mix; T.set(pN, { d: line(a, false) }); T.set(pO, { d: line(a, true) }); }
        var x0 = through(k, a, false), x1 = through(k, a, true);
        T.set(tput, { text: f1(x0) });
        T.set(out, { text: f1(x1) + "  (" + Math.round((1 - x1 / x0) * 100) + "% lower)", fill: x1 / x0 < 0.75 ? "var(--bad)" : x1 / x0 < 0.88 ? "var(--warn)" : "var(--ink)" });
        T.set(mkN, { cx: C.px(k), cy: C.py(x0) });
        T.set(mkO, { cx: C.px(k), cy: C.py(x1) });
      };
    }
  });
})(window.Tradeoff);
