// The negotiator's dilemma. Sharing information and trading across different priorities grows the pie; pressing hard for your share
// claims more of a smaller pie and raises the chance of no deal. Your expected take peaks at a modest claim.
(function (T) {
  var MAXPIE = 140;
  var pie = function (a) { return 100 + 40 * (1 - a); };
  var share = function (a) { return 0.5 + 0.4 * a; };
  var deal = function (a) { return 1 - 0.8 * Math.pow(a, 2.5); };
  var take = function (a) { return deal(a) * pie(a) * share(a); };
  var BEST = (function () { var b = 0, bv = 0; for (var a = 0; a <= 1; a += 0.005) if (take(a) > bv) { bv = take(a); b = a; } return b; })();
  var pc = function (v) { return Math.round(v * 100) + "%"; };
  var label = function (a) { return a < 0.12 ? "Open: share everything" : a < 0.4 ? "Modest claim" : a < 0.75 ? "Firm" : "Hardball"; };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A rectangle whose size is the value created and whose split is each side's share, and curves of the pie size and your expected take against how hard you claim.",
    vars: [
      { key: "a", label: "How hard you push for your share", min: 0, max: 1, step: 0.01, value: 0, color: "var(--s1)", fmt: label }
    ],
    scenario: [
      { caption: "Both sides share what they care about. They find trades each values differently, the pie is big, and it is split evenly.", set: { a: 0 }, hold: 3800 },
      { caption: "Claim a little more once the value has been created. You take a larger slice of a pie that has barely shrunk.", set: { a: BEST }, dur: 2400, hold: 3800 },
      { caption: "Press hard: you hold back information and demand more. The pie shrinks, the other side digs in, and a deal is less likely.", set: { a: 0.7 }, dur: 2400, hold: 4000 },
      { caption: "Pure hardball takes nearly the whole of a small pie, and mostly ends with no deal. Your take is the lowest of all.", set: { a: 1 }, dur: 2200, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, y0 = 70, W = 300, H = 90;
      el("text", { x: x0, y: 40, "class": "t-label", text: "Value created, and who gets it" }, svg);
      el("rect", { x: x0, y: y0, width: W, height: H, rx: 6, fill: "none", stroke: "var(--line)", "stroke-dasharray": "4 4" }, svg);
      el("text", { x: x0 + W, y: y0 + H + 16, "text-anchor": "end", "class": "t-small", text: "outline: the largest pie possible" }, svg);
      var mine = el("rect", { x: x0, y: y0, height: H, rx: 6, fill: "var(--s1)" }, svg);
      var theirs = el("rect", { y: y0, height: H, rx: 6, fill: "var(--s2)" }, svg);
      var mineT = el("text", { y: y0 + H / 2 + 5, "text-anchor": "middle", "class": "t-label", fill: "var(--surface)", text: "you" }, svg);
      var theirsT = el("text", { y: y0 + H / 2 + 5, "text-anchor": "middle", "class": "t-label", fill: "var(--surface)", text: "them" }, svg);

      var big = el("text", { x: x0, y: 222, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 246, "class": "t-small" }, svg);
      var sub2 = el("text", { x: x0, y: 266, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 296, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 400, y: 48, w: 210, h: 190, xDomain: [0, 1], yDomain: [0, 150], xLabel: "how hard you claim →", yLabel: "value" });
      el("path", { d: C.path(pie, 0, 1, 2), fill: "none", stroke: "var(--s2)", "stroke-width": 2.5, "stroke-dasharray": "6 5" }, C.g);
      el("path", { d: C.path(take, 0, 1, 80), fill: "none", stroke: "var(--s1)", "stroke-width": 3 }, C.g);
      el("line", { x1: C.px(BEST), x2: C.px(BEST), y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      el("text", { x: C.px(0.04), y: C.py(pie(0)) - 6, "class": "t-small", fill: "var(--s2)", text: "size of the pie" }, C.g);
      el("text", { x: C.px(0.5), y: C.py(take(0.5)) - 22, "class": "t-small", fill: "var(--s1)", text: "your expected take" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);

      return function (s) {
        var a = s.a, p = pie(a), sh = share(a), t = take(a), tb = take(BEST);
        var w = W * p / MAXPIE;
        T.set(mine, { width: w * sh });
        T.set(theirs, { x: x0 + w * sh, width: w * (1 - sh) });
        T.set(mineT, { x: x0 + w * sh / 2, opacity: w * sh > 40 ? 1 : 0 });
        T.set(theirsT, { x: x0 + w * sh + w * (1 - sh) / 2, opacity: w * (1 - sh) > 44 ? 1 : 0 });
        T.set(mk, { cx: C.px(a), cy: C.py(t) });
        T.set(big, { text: "Your expected take: " + Math.round(t) });
        T.set(sub, { text: "pie " + Math.round(p) + " × your share " + pc(sh) + " × chance of a deal " + pc(deal(a)) });
        T.set(sub2, { text: "the other side gets " + pc(1 - sh) + " of the pie" });
        T.set(verdict, { text: t > tb * 0.97 ? "About the best you can expect" : t > tb * 0.8 ? "Good, but leaving value on the table" : "Well below what's available", fill: t > tb * 0.97 ? "var(--good)" : t > tb * 0.8 ? "var(--warn)" : "var(--bad)" });
      };
    }
  });
})(window.Tradeoff);
