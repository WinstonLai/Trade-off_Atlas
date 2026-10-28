(function () {
  var root = document.body.getAttribute("data-root") || ".";
  var cats = {};
  window.CATEGORIES.forEach(function (c) { cats[c.id] = c; });

  function href(slug) { return root + "/tradeoffs/" + slug + ".html"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]; }); }

  function card(t) {
    return '<a class="card cat-' + t.cat + '" href="' + href(t.slug) + '">' +
      '<svg class="glyph" viewBox="0 0 56 56" aria-hidden="true">' + t.glyph + "</svg>" +
      "<h3>" + esc(t.title) + "</h3><p>" + esc(t.summary) + "</p>" +
      '<div class="factors">' + t.factors.map(function (f) { return "<span>" + esc(f) + "</span>"; }).join("") + "</div></a>";
  }

  // ---- Theme toggle ----
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  var toggle = document.querySelector(".theme-toggle");
  function paintToggle() {
    if (!toggle) return;
    toggle.innerHTML = isDark() ? SUN : MOON;
    toggle.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      paintToggle();
    });
    paintToggle();
  }

  // ---- Home: grouped grid, hash filter, search ----
  var home = document.getElementById("home-grid");
  if (home) {
    var search = document.getElementById("search");
    var active = (location.hash || "").replace("#", "");
    if (!cats[active]) active = "all";

    home.innerHTML = window.CATEGORIES.map(function (c) {
      var items = window.CATALOG.filter(function (t) { return t.cat === c.id; });
      return '<section class="cat-section cat-' + c.id + '" id="sec-' + c.id + '" data-cat="' + c.id + '">' +
        '<div class="cat-head"><h2>' + esc(c.name) + "</h2><p>" + esc(c.blurb) + "</p></div>" +
        '<div class="grid">' + items.map(card).join("") + "</div></section>";
    }).join("") + '<p class="empty" id="empty" hidden>No trade-offs match that search.</p>';

    var render = function () {
      var q = (search.value || "").trim().toLowerCase();
      var any = false;
      home.querySelectorAll(".cat-section").forEach(function (sec) {
        var catOk = active === "all" || sec.getAttribute("data-cat") === active;
        var shown = 0;
        sec.querySelectorAll(".card").forEach(function (cardEl, i) {
          var t = window.CATALOG.filter(function (x) { return x.cat === sec.getAttribute("data-cat"); })[i];
          var hay = (t.title + " " + t.summary + " " + t.factors.join(" ")).toLowerCase();
          var ok = catOk && (!q || hay.indexOf(q) !== -1);
          cardEl.hidden = !ok;
          cardEl.style.display = ok ? "" : "none";
          if (ok) shown++;
        });
        sec.hidden = shown === 0;
        if (shown) any = true;
      });
      document.getElementById("empty").hidden = any;
    };

    search.addEventListener("input", render);
    window.addEventListener("hashchange", function () {
      var h = location.hash.replace("#", "");
      if (cats[h]) { active = h; render(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== search) { e.preventDefault(); search.focus(); }
    });
    render();
  }

  // ---- Trade-off page: related + prev/next ----
  var slug = document.body.getAttribute("data-slug");
  if (slug) {
    var idx = window.CATALOG.findIndex(function (t) { return t.slug === slug; });
    var me = window.CATALOG[idx];
    var rel = document.getElementById("related");
    if (rel && me) {
      var items = me.related.map(function (s) { return window.CATALOG.find(function (t) { return t.slug === s; }); }).filter(Boolean);
      rel.innerHTML = "<h2>Related trade-offs</h2><div class=\"grid\">" + items.map(card).join("") + "</div>";
    }
    var pager = document.getElementById("pager");
    if (pager && me) {
      var n = window.CATALOG.length;
      var prev = window.CATALOG[(idx - 1 + n) % n], next = window.CATALOG[(idx + 1) % n];
      pager.innerHTML =
        '<a class="prev" href="' + href(prev.slug) + '"><small>← Previous</small>' + esc(prev.title) + "</a>" +
        '<a class="next" href="' + href(next.slug) + '"><small>Next →</small>' + esc(next.title) + "</a>";
    }
  }
})();
