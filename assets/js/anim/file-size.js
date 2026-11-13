// A 1 TB table stored as files of size S. A query opens files (a fixed overhead each) and reads whole files.
// Selective lookups want a few rows from many places, so large files make it read far more than it needs.
// Broad scans want half the table, so small files just pay the overhead many times.
(function (T) {
  var D = 1e6, T0 = 0.2, R = 100, MAXV = 12;
  var WL = { sel: { useful: 2000, k: 100 }, broad: { useful: 500000, k: 10 } };
  var filesRead = function (S, w) { return WL[w].useful / S + WL[w].k; };
  var qtime = function (S, w) { return filesRead(S, w) * T0 + (WL[w].useful + WL[w].k * S) / R; };
  var bestV = function (w) { var bv = 0, bt = Infinity; for (var v = 0; v <= MAXV; v += 0.02) { var t = qtime(Math.pow(2, v), w); if (t < bt) { bt = t; bv = v; } } return bv; };
  var BEST = { sel: bestV("sel"), broad: bestV("broad") };
  var ratio = function (v, w) { return qtime(Math.pow(2, v), w) / qtime(Math.pow(2, BEST[w]), w); };
  var size = function (m) { return m >= 1024 ? (m / 1024).toFixed(m >= 10240 ? 0 : 1).replace(".0", "") + " GB" : (m < 10 ? m.toFixed(1).replace(".0", "") : Math.round(m)) + " MB"; };
  var commas = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); };

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "A zoomed-in strip of a table cut into files of the chosen size, the rows a query wants and the whole files it must read, and a curve of query time against file size.",
    vars: [
      { key: "v", label: "File size", min: 0, max: MAXV, step: 0.5, value: 0, color: "var(--s1)", fmt: function (v) { return size(Math.pow(2, v)); } },
      { key: "w", label: "What do the queries do?", type: "choice", value: "sel",
        options: [{ value: "sel", label: "Selective lookups" }, { value: "broad", label: "Broad scans" }] }
    ],
    scenario: [
      { caption: "Selective lookups on a million 1 MB files: each query opens thousands of files, and opening a file costs more than reading it.", set: { v: 0, w: "sel" }, hold: 4000 },
      { caption: "Compact into files of about 20 MB. They are small enough to skip precisely and big enough that the opening cost fades.", set: { v: 4.5 }, dur: 2600, hold: 4000 },
      { caption: "At 1 GB the query needs a few rows but has to read whole files to get them. Wasted reading dominates.", set: { v: 10 }, dur: 2600, hold: 4000 },
      { caption: "Switch to scans that read half the table. Now big files are right: there is little to skip, and the opening cost is paid rarely.", set: { w: "broad" }, hold: 4400 },
      { caption: "And small files are the problem again: at 4 MB there are a quarter of a million files to open.", set: { v: 2 }, dur: 2600, hold: 4000 }
    ],
    setup: function (svg) {
      var el = T.el, x0 = 30, W = 330, SLICE = 16384, PX = W / SLICE;
      var defs = el("defs", {}, svg);
      var pat = el("pattern", { id: "fs-pat", patternUnits: "userSpaceOnUse", x: x0, y: 0, height: 40 }, defs);
      el("line", { x1: 0.5, x2: 0.5, y1: 0, y2: 40, stroke: "var(--ink-2)", "stroke-width": 1 }, pat);
      el("text", { x: x0, y: 30, "class": "t-label", text: "A 16 GB slice of the table, zoomed in" }, svg);
      var need = [], read = [], POS = [0.1, 0.38, 0.6, 0.85];
      for (var i = 0; i < POS.length; i++) need.push(el("rect", { y: 42, height: 10, rx: 2, fill: "var(--s1)" }, svg));
      el("rect", { x: x0, y: 58, width: W, height: 36, rx: 3, fill: "var(--surface-2)" }, svg);
      var strip = el("rect", { x: x0, y: 58, width: W, height: 36, rx: 3, fill: "url(#fs-pat)", stroke: "var(--line)", "stroke-width": 1.5 }, svg);
      for (var j = 0; j < POS.length; j++) read.push(el("rect", { y: 100, height: 10, rx: 2, fill: "var(--s2)" }, svg));
      el("text", { x: x0, y: 130, "class": "t-small", text: "blue = rows wanted · orange = files read" }, svg);

      var big = el("text", { x: x0, y: 190, "class": "t-big" }, svg);
      var sub = el("text", { x: x0, y: 214, "class": "t-small" }, svg);
      var sub2 = el("text", { x: x0, y: 232, "class": "t-small" }, svg);
      var verdict = el("text", { x: x0, y: 270, "class": "t-mid" }, svg);

      var C = T.chart(svg, { x: 392, y: 48, w: 218, h: 190, xDomain: [0, MAXV], yDomain: [0, 1.5], yLabel: "query time vs. the best" });
      el("text", { x: 0, y: C.h + 16, "class": "t-small", text: "1 MB" }, C.g);
      el("text", { x: C.px(7), y: C.h + 16, "text-anchor": "middle", "class": "t-small", text: "128 MB" }, C.g);
      el("text", { x: C.w, y: C.h + 16, "text-anchor": "end", "class": "t-small", text: "4 GB" }, C.g);
      el("text", { x: C.w, y: C.h + 32, "text-anchor": "end", "class": "t-small", text: "file size (log scale) →" }, C.g);
      el("text", { x: 4, y: C.py(0) - 4, "class": "t-small", text: "1×" }, C.g);
      el("text", { x: 4, y: C.py(1) - 4, "class": "t-small", text: "10×" }, C.g);
      var pQ = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 3 }, C.g);
      var bestLine = el("line", { y1: 0, y2: C.h, stroke: "var(--good)", "stroke-width": 2, "stroke-dasharray": "4 4" }, C.g);
      var mk = el("circle", { r: 6.5, fill: "var(--ink)", stroke: "var(--surface)", "stroke-width": 2.5 }, C.g);

      return function (s) {
        var v = s.v, w = s.w, S = Math.pow(2, v), fw = S * PX, ra = ratio(v, w), wid = w === "sel" ? 3 : 56;
        T.set(pat, { width: Math.max(fw, 1.5) });
        POS.forEach(function (p, i) {
          var xs = x0 + p * W - (w === "sel" ? 0 : wid / 2), a = xs, b = xs + wid;
          if (fw > wid) { a = x0 + Math.floor((xs - x0) / fw) * fw; b = x0 + Math.ceil((xs + wid - x0) / fw) * fw; }
          T.set(need[i], { x: xs, width: wid });
          T.set(read[i], { x: a, width: Math.max(b - a, wid) });
        });
        T.set(pQ, { d: C.path(function (x) { return Math.log10(ratio(x, w)); }, 0, MAXV, 96) });
        T.set(bestLine, { x1: C.px(BEST[w]), x2: C.px(BEST[w]) });
        T.set(mk, { cx: C.px(v), cy: C.py(Math.log10(ra)) });
        T.set(big, { text: ra < 1.1 ? "About the best possible" : "Query takes " + (ra < 10 ? ra.toFixed(1) : Math.round(ra)) + "× the best" });
        T.set(sub, { text: "Files in the table: " + commas(D / S) });
        T.set(sub2, { text: "Files opened per query: " + commas(filesRead(S, w)) });
        T.set(verdict, { text: ra > 4 ? "Far from the best (about " + size(Math.pow(2, BEST[w])) + ")" : ra > 1.3 ? "Close to the best (about " + size(Math.pow(2, BEST[w])) + ")" : "Near the best file size", fill: ra > 4 ? "var(--bad)" : ra > 1.3 ? "var(--warn)" : "var(--good)" });
      };
    }
  });
})(window.Tradeoff);
