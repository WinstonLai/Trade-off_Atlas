"""Render content fragments into static trade-off pages.
Usage (from the repo root): python3 tools/gen.py .
Each tools/content/<slug>.html starts with <!--meta {json}--> then the prose sections,
and is written to tradeoffs/<slug>.html.
"""
import html, json, os, re, sys

here = os.path.dirname(os.path.abspath(__file__))
root = sys.argv[1]
CATS = {"pm": "Project management", "sw": "Software development", "de": "Data engineering", "bc": "Business communication", "ds": "Data science"}

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} · Trade-off Atlas</title>
  <meta name="description" content="{desc}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap">
  <link rel="stylesheet" href="../assets/css/site.css">
  <script>try {{ var t = localStorage.getItem("theme"); if (t) document.documentElement.setAttribute("data-theme", t); }} catch (e) {{}}</script>
</head>
<body class="cat-{cat}" data-root=".." data-slug="{slug}">
  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="../index.html">
        <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M14 3 25 23H3Z" fill="none" stroke="var(--pm)" stroke-width="2.6" stroke-linejoin="round"/><circle cx="14" cy="16" r="3.4" fill="var(--sw)"/></svg>
        Trade-off Atlas
      </a>
      <div class="site-nav">
        <button class="theme-toggle" type="button" aria-label="Toggle theme"></button>
      </div>
    </div>
    <nav class="cat-nav" aria-label="Browse by topic">
      <div class="wrap">
        <a href="../index.html">All topics</a>
        <a class="cat-pm" href="../index.html#pm"><span class="dot"></span>Project management</a>
        <a class="cat-bc" href="../index.html#bc"><span class="dot"></span>Business communication</a>
        <a class="cat-sw" href="../index.html#sw"><span class="dot"></span>Software development</a>
        <a class="cat-de" href="../index.html#de"><span class="dot"></span>Data engineering</a>
        <a class="cat-ds" href="../index.html#ds"><span class="dot"></span>Data science</a>
      </div>
    </nav>
  </header>

  <main class="page">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">All trade-offs</a> / <a href="../index.html#{cat}">{catname}</a></nav>
    <header class="hero">
      <span class="tag">{catname}</span>
      <h1>{title}</h1>
      <p class="lede">{lede}</p>
      <div class="vs">{vs}</div>
    </header>

    <figure class="anim" id="anim"><noscript><p style="padding:20px">Turn on JavaScript to see the animation.</p></noscript></figure>

    <article class="prose">
{body}
    </article>

    <nav class="related" id="related" aria-label="Related trade-offs"></nav>
    <nav class="pager" id="pager" aria-label="More trade-offs"></nav>
  </main>

  <footer class="site-footer">
    <div class="wrap"><p>Trade-off Atlas: mental models for better decisions. Models are simplified on purpose. Use them to frame the conversation, not to forecast.</p></div>
  </footer>

  <script src="../assets/js/catalog.js"></script>
  <script src="../assets/js/site.js"></script>
  <script src="../assets/js/engine.js"></script>
  <script src="../assets/js/anim/{slug}.js"></script>
</body>
</html>
"""

os.makedirs(os.path.join(root, "tradeoffs"), exist_ok=True)
cdir = os.path.join(here, "content")
for fn in sorted(os.listdir(cdir)):
    if not fn.endswith(".html"):
        continue
    slug = fn[:-5]
    src = open(os.path.join(cdir, fn)).read()
    m = re.match(r"\s*<!--meta (.*?)-->\s*", src, re.S)
    meta = json.loads(m.group(1))
    body = src[m.end():].rstrip()
    vs = '<i>vs.</i>'.join("<span>%s</span>" % html.escape(f) for f in meta["vs"])
    out = TEMPLATE.format(
        title=html.escape(meta["title"]), desc=html.escape(meta["lede"]), cat=meta["cat"],
        catname=CATS[meta["cat"]], slug=slug, lede=meta["lede"], vs=vs,
        body="\n".join("      " + l if l.strip() else "" for l in body.splitlines()))
    open(os.path.join(root, "tradeoffs", slug + ".html"), "w").write(out)
    print("wrote", slug)
