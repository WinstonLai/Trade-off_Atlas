/*
 * Tradeoff engine: auto-playing scenario + sliders for a small model.
 *
 * spec = {
 *   viewBox: "0 0 640 340",
 *   vars: [{ key, label, min, max, step, value, color, fmt(v) }  // range slider
 *          | { key, label, type: "choice", options: [{ value, label }], value }],
 *   lockable: ["scope", "time", "cost"],        // optional "hold constant" control
 *   relate(state, changedKey, lockedKey) -> state  // rebalance after a change (optional)
 *   scenario: [{ caption, set: { key: value }, lock, direct, dur, hold }],
 *   setup(svg, T) -> draw(state, timeMs, lockedKey)
 * }
 */
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var STYLE_KEYS = { fill: 1, stroke: 1, opacity: 1, "fill-opacity": 1, "stroke-opacity": 1 };
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    set(n, attrs);
    if (parent) parent.appendChild(n);
    return n;
  }
  function set(n, attrs) {
    if (!attrs) return n;
    for (var k in attrs) {
      if (attrs[k] == null) continue;
      if (k === "text") { if (n.textContent !== String(attrs[k])) n.textContent = attrs[k]; }
      else if (STYLE_KEYS[k]) n.style.setProperty(k, attrs[k]);
      else n.setAttribute(k, attrs[k]);
    }
    return n;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  // Axis-and-curve helper used by most visuals.
  function chart(parent, o) {
    var g = el("g", { transform: "translate(" + o.x + "," + o.y + ")" }, parent);
    var w = o.w, h = o.h, xd = o.xDomain, yd = o.yDomain;
    var px = function (x) { return (x - xd[0]) / (xd[1] - xd[0]) * w; };
    var py = function (y) { return h - (y - yd[0]) / (yd[1] - yd[0]) * h; };
    el("path", { d: "M0 0V" + h + "H" + w, fill: "none", stroke: "var(--line)", "stroke-width": 1.5 }, g);
    if (o.xLabel) el("text", { x: w, y: h + 18, "text-anchor": "end", "class": "t-small", text: o.xLabel }, g);
    if (o.yLabel) el("text", { x: 0, y: -8, "class": "t-small", text: o.yLabel }, g);
    return {
      g: g, px: px, py: py, w: w, h: h,
      path: function (fn, a, b, n) {
        a = a == null ? xd[0] : a; b = b == null ? xd[1] : b; n = n || 80;
        var d = "";
        for (var i = 0; i <= n; i++) {
          var x = a + (b - a) * i / n;
          var y = clamp(fn(x), yd[0], yd[1]);
          d += (i ? "L" : "M") + px(x).toFixed(1) + " " + py(y).toFixed(1);
        }
        return d;
      }
    };
  }

  function mount(host, spec) {
    var state = {}, varsByKey = {}, lock = null;
    spec.vars.forEach(function (v) { state[v.key] = v.value; varsByKey[v.key] = v; });
    var relate = spec.relate || function (s) { return s; };
    var initial = Object.assign({}, state);

    // ---- DOM ----
    host.innerHTML = "";
    var stage = document.createElement("div"); stage.className = "anim-stage";
    var svg = el("svg", { viewBox: spec.viewBox || "0 0 640 340", role: "img", "aria-label": spec.label || "Animated diagram of the trade-off" });
    stage.appendChild(svg);
    var cap = document.createElement("div"); cap.className = "anim-caption"; cap.setAttribute("aria-live", "polite");
    var bar = document.createElement("div"); bar.className = "anim-bar";
    var controls = document.createElement("div"); controls.className = "anim-controls";
    host.appendChild(stage); host.appendChild(cap); host.appendChild(bar); host.appendChild(controls);

    var ICON = {
      play: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l9-5.5z"/></svg>',
      pause: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2.5" width="3.5" height="11" rx="1"/><rect x="9.5" y="2.5" width="3.5" height="11" rx="1"/></svg>',
      prev: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M12 2.5v11L4 8z"/><rect x="2.5" y="2.5" width="2" height="11" rx="1"/></svg>',
      next: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11L12 8z"/><rect x="11.5" y="2.5" width="2" height="11" rx="1"/></svg>'
    };
    function button(html, label) {
      var b = document.createElement("button"); b.type = "button"; b.className = "btn"; b.innerHTML = html; b.setAttribute("aria-label", label); bar.appendChild(b); return b;
    }
    var bPrev = button(ICON.prev, "Previous step");
    var bPlay = button("", "Play");
    var bNext = button(ICON.next, "Next step");
    var progress = document.createElement("div"); progress.className = "progress"; bar.appendChild(progress);
    var dots = (spec.scenario || []).map(function (k, i) {
      var d = document.createElement("button"); d.type = "button"; d.setAttribute("aria-label", "Step " + (i + 1));
      d.addEventListener("click", function () { go(i); });
      progress.appendChild(d); return d;
    });

    // Sliders and choice controls
    var inputs = {};
    spec.vars.forEach(function (v) {
      var wrap = document.createElement("div"); wrap.className = "ctl";
      var id = "v-" + v.key + "-" + Math.random().toString(36).slice(2, 7);
      if (v.type === "choice") {
        var lab = document.createElement("div"); lab.className = "ctl-label"; lab.textContent = v.label; wrap.appendChild(lab);
        var seg = document.createElement("div"); seg.className = "seg"; seg.setAttribute("role", "group"); seg.setAttribute("aria-label", v.label);
        v.options.forEach(function (o) {
          var b = document.createElement("button"); b.type = "button"; b.textContent = o.label; b.dataset.value = o.value;
          b.addEventListener("click", function () { userSet(v.key, o.value); });
          seg.appendChild(b);
        });
        wrap.appendChild(seg);
        inputs[v.key] = { wrap: wrap, seg: seg };
      } else {
        var label = document.createElement("label"); label.setAttribute("for", id);
        label.innerHTML = '<span>' + (v.color ? '<span class="swatch" style="background:' + v.color + '"></span>' : "") + v.label + '</span><output></output>';
        var input = document.createElement("input"); input.type = "range"; input.id = id;
        input.min = v.min; input.max = v.max; input.step = v.step || (v.max - v.min) / 100;
        input.addEventListener("input", function () { userSet(v.key, parseFloat(input.value)); });
        wrap.appendChild(label); wrap.appendChild(input);
        if (v.hint) { var h = document.createElement("div"); h.className = "ctl-hint"; h.textContent = v.hint; wrap.appendChild(h); }
        inputs[v.key] = { wrap: wrap, input: input, out: label.querySelector("output") };
      }
      controls.appendChild(wrap);
    });
    var lockSeg = null;
    if (spec.lockable) {
      var lw = document.createElement("div"); lw.className = "ctl";
      lw.innerHTML = '<div class="ctl-label">Hold constant</div>';
      lockSeg = document.createElement("div"); lockSeg.className = "seg"; lockSeg.setAttribute("role", "group"); lockSeg.setAttribute("aria-label", "Hold constant");
      [null].concat(spec.lockable).forEach(function (k) {
        var b = document.createElement("button"); b.type = "button"; b.dataset.value = k || "";
        b.textContent = k ? varsByKey[k].label : "Nothing";
        b.addEventListener("click", function () { pause(); lock = k; syncUI(); });
        lockSeg.appendChild(b);
      });
      lw.appendChild(lockSeg);
      var hint = document.createElement("div"); hint.className = "ctl-hint"; hint.textContent = "Lock one factor, then drag another and watch the rest react.";
      lw.appendChild(hint);
      controls.insertBefore(lw, controls.firstChild);
    }

    function fmt(v, val) { return v.fmt ? v.fmt(val) : (Math.round(val * 10) / 10).toString(); }
    function syncUI() {
      spec.vars.forEach(function (v) {
        var c = inputs[v.key];
        if (c.seg) {
          c.seg.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.value === String(state[v.key]))); });
        } else {
          if (document.activeElement !== c.input) c.input.value = state[v.key];
          c.out.textContent = fmt(v, state[v.key]);
          var locked = lock === v.key;
          c.input.disabled = locked;
          c.wrap.classList.toggle("is-locked", locked);
        }
      });
      if (lockSeg) lockSeg.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.value === (lock || ""))); });
      dots.forEach(function (d, i) { if (i === idx) d.setAttribute("aria-current", "step"); else d.removeAttribute("aria-current"); });
      bPlay.innerHTML = playing ? ICON.pause + "Pause" : ICON.play + "Play";
      bPlay.setAttribute("aria-label", playing ? "Pause" : "Play");
    }

    // ---- Scenario playback ----
    var scen = spec.scenario || [];
    var idx = 0, phase = "tween", phaseStart = 0, from = null, playing = !reduced && scen.length > 0;
    var now = 0;

    function setCaption(i) {
      var k = scen[i];
      cap.innerHTML = k ? '<span class="step-no">' + (i + 1) + "/" + scen.length + "</span><span>" + k.caption + "</span>" : "";
    }
    function startKey(i) {
      idx = (i + scen.length) % scen.length;
      var k = scen[idx];
      from = Object.assign({}, state);
      if ("lock" in k) lock = k.lock;
      // choice values switch immediately
      Object.keys(k.set || {}).forEach(function (key) {
        if (varsByKey[key].type === "choice") state[key] = k.set[key];
      });
      phase = "tween"; phaseStart = now;
      setCaption(idx);
      syncUI();
    }
    function applyTween(p) {
      var k = scen[idx], e = ease(p);
      Object.keys(k.set || {}).forEach(function (key) {
        var v = varsByKey[key];
        if (v.type === "choice") return;
        state[key] = lerp(from[key], k.set[key], e);
        if (!k.direct) state = relate(state, key, lock);
      });
    }
    // Jumping to a step: replay the earlier steps' end states so the jump lands
    // where the scenario would have been, then tween the chosen step as usual.
    function go(i) {
      i = (i + scen.length) % scen.length;
      var s = Object.assign({}, initial), l = null;
      for (var j = 0; j < i; j++) {
        var k = scen[j];
        if ("lock" in k) l = k.lock;
        Object.keys(k.set || {}).forEach(function (key) {
          s[key] = k.set[key];
          if (!k.direct && varsByKey[key].type !== "choice") s = relate(s, key, l);
        });
      }
      state = s; lock = l;
      startKey(i);
    }
    function pause() { playing = false; phase = "done"; syncUI(); }

    function userSet(key, val) {
      pause();
      state[key] = val;
      state = relate(state, key, lock);
      syncUI();
    }
    bPlay.addEventListener("click", function () {
      playing = !playing;
      if (playing) startKey(phase === "done" ? idx + 1 : idx);
      syncUI();
    });
    bPrev.addEventListener("click", function () { go(idx - 1); });
    bNext.addEventListener("click", function () { go(idx + 1); });

    var draw = spec.setup(svg, T);

    function frame(t) {
      now = t;
      if (scen.length && phase !== "done") {
        var k = scen[idx], dur = reduced ? 0 : (k.dur != null ? k.dur : 1600), hold = k.hold || 2400;
        var el2 = t - phaseStart;
        if (phase === "tween") {
          applyTween(dur ? Math.min(1, el2 / dur) : 1);
          if (el2 >= dur) { phase = "hold"; phaseStart = t; }
          syncUI();
        } else if (phase === "hold" && el2 >= hold) {
          if (playing) startKey(idx + 1); else phase = "done";
        }
      }
      draw(state, reduced ? 0 : t, lock);
    }
    function loop(t) { frame(t); requestAnimationFrame(loop); }

    if (scen.length) startKey(0); else syncUI();
    requestAnimationFrame(loop);

    return { state: state };
  }

  var T = { el: el, set: set, clamp: clamp, lerp: lerp, ease: ease, chart: chart, mount: mount, reduced: reduced };
  window.Tradeoff = T;
})();
