# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

No build, lint or test tooling, and no dependencies. Plain HTML/CSS/JS served statically (GitHub Pages; `.nojekyll` is present).

```bash
python3 -m http.server 8765        # serve at http://localhost:8765
python3 tools/gen.py .             # regenerate tradeoffs/*.html from tools/content/*.html (run from repo root)
```

Verification is manual: load the page in a browser and watch the animation, sliders and console.

## Architecture

**Generated pages are committed.** `tradeoffs/<slug>.html` is output of `tools/gen.py`, built from the `TEMPLATE` string in that script plus `tools/content/<slug>.html`. Never hand-edit `tradeoffs/*.html`: change the content fragment (or the template in `gen.py`) and re-run the generator, then commit both. A template change touches every page. `gen.py` rewrites every page on each run.

**Content fragment format.** Line 1 of `tools/content/<slug>.html` is `<!--meta {json}-->` with `title`, `cat` (`pm|sw|de|bc|ds`), `lede` and `vs` (the two opposing factors). The `lede` is inserted into the page as raw HTML but HTML-escaped for the `<meta description>`. The rest is `<section>` blocks (The trade-off / How to use it / Example / Watch out for).

**`assets/js/catalog.js` is the single source of truth** for the home grid, search, the category hash filter, related links and prev/next pager (`window.CATALOG`, `window.CATEGORIES`). `site.js` consumes it on every page, which is why `gen.py` loads `catalog.js` before `site.js`. A new trade-off needs a catalog entry (including `related` slugs and an SVG `glyph` in a 56x56 box using `currentColor`) in addition to its content file and animation. Keep each category's entries contiguous in `CATALOG`, and in the same category order as `window.CATEGORIES` (soft to technical: pm, bc, sw, de, ds): the home grid groups by category, but the prev/next pager follows array order. A new entry's `related` slugs must exist, and a few existing entries should link back (swap one of their three `related` slugs rather than growing the list).

**Adding a category** touches five places that must stay in sync (the README category table too, and keep the header nav order identical to `window.CATEGORIES`; the home intro text and `<meta description>` in `index.html` also name every category): `window.CATEGORIES` in `catalog.js`; `CATS` in `gen.py`; the hard-coded header nav links in both `index.html` and the `TEMPLATE` in `gen.py` (they are not generated from the catalog); the `--<id>` accent token in all three theme blocks of `site.css` (light, dark `@media`, and `[data-theme="dark"]`); and a `.cat-<id> { --c: var(--<id>); }` rule. Re-run `gen.py` afterwards since the nav is part of the template. The home page has no chip row: the header nav is the only category filter, and it works by URL hash (`index.html#ds` shows only that category), so test the home page with no hash to see every section.

**Animation engine (`assets/js/engine.js`).** Exposes `window.Tradeoff` (`T`). Each `assets/js/anim/<slug>.js` calls `T.mount(document.getElementById("anim"), spec)`. The spec (documented in the engine's header comment) declares `vars` (sliders or `choice` segments), an optional `relate(state, changedKey, lockedKey)` that rebalances dependent variables, a `scenario` of captioned keyframes, and `setup(svg, T)` which draws the SVG once and returns a `draw(state, timeMs, lockedKey)` called every animation frame. Notes:
- Scenario steps tween `set` values with easing, calling `relate` on each tick unless the step has `direct: true`. `choice` vars switch instantly. Jumping to a step (`go`) replays earlier steps' end states, so keyframes must be deterministic.
- Any user input pauses autoplay. `prefers-reduced-motion` disables autoplay and tweening.
- `draw` should mutate existing SVG nodes via `T.set` rather than rebuild them. `T.set` routes `fill/stroke/opacity` through `style` (so CSS variables work) and `text` through `textContent`.
- `T.chart` is the shared axis-and-curve helper.
- Script load order on each page: `catalog.js`, `site.js`, `engine.js`, `anim/<slug>.js`. The anim file name must equal the slug.

**Styling.** All in `assets/css/site.css`: light/dark design tokens, with the theme toggled through `data-theme` on `<html>` (persisted in `localStorage`, applied by an inline script in `<head>` to avoid a flash). The body class `cat-<id>` selects the category accent color. Animations use CSS variables (`--s1`, `--s2`, `--ink`, `--muted`, `--line`, `--surface`) rather than hard-coded colors so both themes work.

**Paths.** Pages in `tradeoffs/` set `data-root=".."` on `<body>`, and `site.js` builds links from it. The home page uses `.`. Keep asset and link paths relative so the site works under the `/Trade-off_Atlas/` GitHub Pages subpath.
