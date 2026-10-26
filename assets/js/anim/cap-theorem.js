// Each cycle: Alice writes to node A, A replicates to B, Bob reads from B.
(function (T) {
  var PERIOD = 4200;

  T.mount(document.getElementById("anim"), {
    viewBox: "0 0 640 330",
    label: "Two database nodes with a network link. When the link breaks, the system either refuses requests or serves stale data.",
    vars: [
      { key: "net", label: "Network", type: "choice", value: "ok", options: [{ value: "ok", label: "Connected" }, { value: "split", label: "Partitioned" }] },
      { key: "mode", label: "During a partition, prefer", type: "choice", value: "cp", options: [{ value: "cp", label: "Consistency (CP)" }, { value: "ap", label: "Availability (AP)" }] }
    ],
    scenario: [
      { caption: "Normally every write is copied to both nodes, so everyone sees the same balance.", set: { net: "ok", mode: "cp" }, dur: 0, hold: 8400 },
      { caption: "The network splits. A CP system refuses what it can't guarantee: always correct, sometimes unavailable.", set: { net: "split", mode: "cp" }, dur: 0, hold: 8400 },
      { caption: "An AP system keeps answering. Alice's write succeeds, but Bob reads a stale balance.", set: { net: "split", mode: "ap" }, dur: 0, hold: 8400 },
      { caption: "When the link heals, the nodes sync up and agree again.", set: { net: "ok", mode: "ap" }, dur: 0, hold: 8400 }
    ],
    setup: function (svg) {
      var el = T.el;
      var P = { alice: [70, 70], a: [200, 160], b: [440, 160], bob: [570, 250] };
      function person(p, name) {
        var g = el("g", { transform: "translate(" + p[0] + "," + p[1] + ")" }, svg);
        el("circle", { cy: -8, r: 9, fill: "var(--ink-2)" }, g);
        el("path", { d: "M-15 18a15 13 0 0 1 30 0Z", fill: "var(--ink-2)" }, g);
        el("text", { y: 36, "text-anchor": "middle", "class": "t-label", text: name }, g);
        return g;
      }
      el("line", { x1: P.alice[0], y1: P.alice[1], x2: P.a[0], y2: P.a[1], stroke: "var(--line)", "stroke-width": 2 }, svg);
      el("line", { x1: P.b[0], y1: P.b[1], x2: P.bob[0], y2: P.bob[1], stroke: "var(--line)", "stroke-width": 2 }, svg);
      var link1 = el("line", { x1: P.a[0], y1: P.a[1], x2: 310, y2: P.a[1], stroke: "var(--ink-2)", "stroke-width": 3 }, svg);
      var link2 = el("line", { x1: 330, y1: P.a[1], x2: P.b[0], y2: P.b[1], stroke: "var(--ink-2)", "stroke-width": 3 }, svg);
      var cut = el("g", { transform: "translate(320," + P.a[1] + ")" }, svg);
      el("path", { d: "M-9 -9 9 9M9 -9-9 9", stroke: "var(--bad)", "stroke-width": 4, "stroke-linecap": "round" }, cut);
      el("text", { y: -18, "text-anchor": "middle", "class": "t-small", text: "network partition", fill: "var(--bad)" }, cut);

      function node(p, name) {
        var g = el("g", { transform: "translate(" + p[0] + "," + p[1] + ")" }, svg);
        var box = el("rect", { x: -56, y: -34, width: 112, height: 68, rx: 12, fill: "var(--surface-2)", stroke: "var(--line)", "stroke-width": 2 }, g);
        el("text", { y: -12, "text-anchor": "middle", "class": "t-small", text: name }, g);
        var v = el("text", { y: 16, "text-anchor": "middle", "class": "t-big t-mono" }, g);
        return { box: box, v: v };
      }
      var A = node(P.a, "Node A"), B = node(P.b, "Node B");
      person(P.alice, "Alice (writes)");
      person(P.bob, "Bob (reads)");
      var pkt = el("circle", { r: 7, fill: "var(--s1)" }, svg);
      var aliceMsg = el("text", { x: P.alice[0] + 32, y: P.alice[1] - 6, "class": "t-label" }, svg);
      var bobMsg = el("text", { x: P.bob[0] - 32, y: P.bob[1] - 10, "text-anchor": "end", "class": "t-label" }, svg);
      var verdict = el("text", { x: 320, y: 312, "text-anchor": "middle", "class": "t-mid" }, svg);

      var aVal = 100, bVal = 100, lastCycle = -1, lastPhase = 0, rejected = false, pending = 100;
      var lerp2 = function (p, q, f) { return [T.lerp(p[0], q[0], f), T.lerp(p[1], q[1], f)]; };

      return function (s, t) {
        var split = s.net === "split", cp = s.mode === "cp";
        var cycle = Math.floor(t / PERIOD), ph = (t % PERIOD) / PERIOD;
        if (cycle !== lastCycle) { lastCycle = cycle; lastPhase = 0; pending = 100 + ((cycle % 9) + 1) * 10; rejected = false; }
        if (lastPhase < 0.3 && ph >= 0.3) { if (split && cp) rejected = true; else aVal = pending; }
        if (lastPhase < 0.6 && ph >= 0.6 && !split) bVal = aVal;
        lastPhase = ph;

        var pos, show = true, col = "var(--s1)";
        if (ph < 0.3) pos = lerp2(P.alice, P.a, T.ease(ph / 0.3));
        else if (ph < 0.6) {
          var f = T.ease((ph - 0.3) / 0.3);
          if (split) { f = Math.min(f, 0.45); col = "var(--bad)"; }
          if (rejected) show = false;
          pos = lerp2(P.a, P.b, f);
        } else if (ph < 0.75) show = false, pos = P.b;
        else pos = lerp2(P.b, P.bob, T.ease((ph - 0.75) / 0.25)), col = split && cp ? "var(--bad)" : split ? "var(--warn)" : "var(--s3)";
        pkt.style.display = show ? "" : "none";
        T.set(pkt, { cx: pos[0], cy: pos[1], fill: col });

        T.set(A.v, { text: "$" + aVal });
        T.set(B.v, { text: "$" + bVal, fill: aVal !== bVal ? "var(--warn)" : "var(--ink)" });
        T.set(B.box, { stroke: aVal !== bVal ? "var(--warn)" : "var(--line)" });
        cut.style.display = split ? "" : "none";
        [link1, link2].forEach(function (l) { T.set(l, { stroke: split ? "var(--bad)" : "var(--ink-2)", "stroke-dasharray": split ? "6 6" : "none" }); });

        T.set(aliceMsg, ph < 0.3 ? { text: "write $" + pending + "…", fill: "var(--ink-2)" } :
          rejected ? { text: "✗ rejected: can't reach B", fill: "var(--bad)" } : { text: "✓ saved $" + pending, fill: "var(--good)" });
        if (ph < 0.75) T.set(bobMsg, { text: "", fill: "var(--ink-2)" });
        else if (split && cp) T.set(bobMsg, { text: "✗ unavailable", fill: "var(--bad)" });
        else if (bVal !== aVal) T.set(bobMsg, { text: "reads $" + bVal + " (stale!)", fill: "var(--warn)" });
        else T.set(bobMsg, { text: "✓ reads $" + bVal, fill: "var(--good)" });

        T.set(verdict, !split ? { text: "Consistent and available", fill: "var(--good)" } :
          cp ? { text: "Consistent, but not available", fill: "var(--bad)" } : { text: "Available, but not consistent", fill: "var(--warn)" });
      };
    }
  });
})(window.Tradeoff);
