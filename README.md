# Trade-off Atlas

Animated mental models of the trade-offs that keep coming up in project management, business communication, software development, data engineering and data science.

Each trade-off has its own page with an animation that auto-plays a short scenario, sliders to explore it yourself, and a short guide: what pulls against what, how to use it, an example, and what to watch out for.

**Live site:** https://winstonlai.github.io/Trade-off_Atlas/

## What's inside

| Category | Trade-offs |
|---|---|
| Project management | Project management triangle · Brooks's law · Utilization vs. flow · Specialist vs. generalist · Batch size · Parallel work vs. focus (WIP limits) · Commit early vs. keep options open |
| Business communication | Brevity vs. completeness · Speed vs. consensus · Candour vs. diplomacy · Synchronous vs. asynchronous · Claiming vs. creating value · Precision vs. plain language · Reach vs. relevance |
| Software development | Technical debt · CAP theorem · Flexibility vs. simplicity · Time vs. space (caching) · Monolith vs. microservices · Latency vs. throughput · Consistency vs. latency (quorums) · Optimistic vs. pessimistic locking |
| Data engineering | Batch vs. streaming · Normalization vs. denormalization · Exact vs. approximate · Schema-on-write vs. schema-on-read · Row vs. column storage · Indexes: read speed vs. write cost · Hash vs. range partitioning |
| Data science | Bias vs. variance · Precision vs. recall · Explore vs. exploit · Significance vs. power · Privacy vs. utility · Accuracy vs. interpretability |

Categories run from soft skills to technical ones, in the same order as the header nav and the home grid.

## Run locally

Plain HTML, CSS and JavaScript. No build step and no dependencies.

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.

## Project layout

```
index.html                 Home: search, card grid grouped by category (header nav filters via URL hash)
tradeoffs/<slug>.html      One page per trade-off (generated, see below)
assets/css/site.css        Design tokens (light/dark) and all styles
assets/js/catalog.js       List of trade-offs: titles, categories, summaries, related links
assets/js/site.js          Theme toggle, home hash filter/search, related + prev/next links
assets/js/engine.js        Shared animation engine: scenario playback, sliders, "hold constant"
assets/js/anim/<slug>.js   One small model + SVG drawing per trade-off
tools/gen.py               Builds tradeoffs/*.html from tools/content/*.html
tools/content/<slug>.html  Written content for each trade-off page
```

## Adding a trade-off

1. Add an entry to `assets/js/catalog.js`.
2. Write `tools/content/<slug>.html` (copy an existing one; the first line holds the title, category, lede and factors).
3. Write `assets/js/anim/<slug>.js`, using an existing animation as a template. A spec lists the variables (sliders or choices), an optional `relate` function that rebalances them, a `scenario` of captioned keyframes, and a `setup` that draws the SVG.
4. Run `python3 tools/gen.py .` to regenerate the pages.

Keep a category's entries together in `catalog.js` (the prev/next pager follows array order), and add the new slug to the `related` list of one or two existing entries so it is linked both ways.

### Adding a category

Update all of these, then re-run `tools/gen.py`:

- `window.CATEGORIES` in `assets/js/catalog.js`
- `CATS` and the header nav links in `tools/gen.py`
- the header nav links in `index.html` (nav, `CATEGORIES` and the table below share one order)
- an accent colour `--<id>` in each of the three theme blocks of `assets/css/site.css`, plus a `.cat-<id>` rule
- the category table above

The models are simplified on purpose. They are for framing a decision, not for forecasting.
