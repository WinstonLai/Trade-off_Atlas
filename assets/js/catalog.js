// Single source of truth for the home grid, search, related links and prev/next.
window.CATEGORIES = [
  { id: "pm", name: "Project management", blurb: "Planning, staffing and delivering work." },
  { id: "sw", name: "Software development", blurb: "Designing and evolving systems." },
  { id: "de", name: "Data engineering", blurb: "Moving, modelling and computing on data." },
  { id: "bc", name: "Business communication", blurb: "Getting messages and decisions across." }
];

// Glyphs are drawn in a 56x56 box with currentColor.
window.CATALOG = [
  {
    slug: "project-triangle", cat: "pm", title: "Project management triangle",
    summary: "Scope, time and cost are linked. Fix one and changing another forces the third to move.",
    factors: ["Scope", "Time", "Cost"], related: ["brooks-law", "technical-debt", "utilization-flow"],
    glyph: '<path d="M28 8 50 46H6Z" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="28" cy="8" r="4" fill="currentColor"/><circle cx="50" cy="46" r="4" fill="currentColor"/><circle cx="6" cy="46" r="4" fill="currentColor"/>'
  },
  {
    slug: "brooks-law", cat: "pm", title: "Brooks's law",
    summary: "Adding people to a late project can make it later, because coordination grows faster than headcount.",
    factors: ["Team size", "Coordination", "Delivery speed"], related: ["project-triangle", "speed-consensus", "utilization-flow"],
    glyph: '<g stroke="currentColor" stroke-width="1.6" opacity=".55"><path d="M28 8 48 22 41 46 15 46 8 22Z M28 8 41 46 M28 8 15 46 M8 22 48 22 M8 22 41 46 M48 22 15 46"/></g><g fill="currentColor"><circle cx="28" cy="8" r="4.5"/><circle cx="48" cy="22" r="4.5"/><circle cx="41" cy="46" r="4.5"/><circle cx="15" cy="46" r="4.5"/><circle cx="8" cy="22" r="4.5"/></g>'
  },
  {
    slug: "utilization-flow", cat: "pm", title: "Utilization vs. flow",
    summary: "Keeping everyone 100% busy makes queues, and waiting time, explode.",
    factors: ["Utilization", "Wait time", "Responsiveness"], related: ["brooks-law", "batch-streaming", "project-triangle"],
    glyph: '<path d="M6 48h44" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M8 44C24 42 34 36 40 22 43 15 45 10 46 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><g fill="currentColor" opacity=".35"><rect x="8" y="30" width="7" height="7" rx="1.5"/><rect x="17" y="30" width="7" height="7" rx="1.5"/><rect x="8" y="21" width="7" height="7" rx="1.5"/></g>'
  },
  {
    slug: "technical-debt", cat: "sw", title: "Technical debt",
    summary: "Shortcuts buy speed today and charge interest later. Every future change gets slower.",
    factors: ["Speed now", "Speed later", "Quality"], related: ["flexibility-simplicity", "project-triangle", "normalization"],
    glyph: '<path d="M6 48h44M6 48V8" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".5"/><path d="M8 44 48 12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M8 44C16 26 26 20 48 22" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="4 4" stroke-linecap="round" opacity=".6"/>'
  },
  {
    slug: "cap-theorem", cat: "sw", title: "CAP theorem",
    summary: "When the network splits, a distributed system must choose between consistent answers and always answering.",
    factors: ["Consistency", "Availability", "Partition tolerance"], related: ["normalization", "batch-streaming", "flexibility-simplicity"],
    glyph: '<circle cx="14" cy="28" r="9" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="3"/><circle cx="42" cy="28" r="9" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="3"/><path d="M23 28h6M33 28h0" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M27 20 31 36" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'
  },
  {
    slug: "flexibility-simplicity", cat: "sw", title: "Flexibility vs. simplicity",
    summary: "Each abstraction makes the change you predicted cheaper and every other change harder to understand.",
    factors: ["Abstraction", "Planned change", "Comprehension"], related: ["technical-debt", "cap-theorem", "brevity-completeness"],
    glyph: '<g stroke="currentColor" stroke-width="2.5" fill="currentColor" fill-opacity=".1"><rect x="10" y="6" width="36" height="9" rx="2.5"/><rect x="14" y="19" width="28" height="9" rx="2.5"/><rect x="18" y="32" width="20" height="9" rx="2.5"/></g><rect x="23" y="45" width="10" height="7" rx="2" fill="currentColor"/>'
  },
  {
    slug: "batch-streaming", cat: "de", title: "Batch vs. streaming",
    summary: "Fresher data costs more to run and is harder to get right.",
    factors: ["Latency", "Cost", "Complexity"], related: ["exact-approximate", "utilization-flow", "normalization"],
    glyph: '<g fill="currentColor"><circle cx="8" cy="16" r="3"/><circle cx="18" cy="16" r="3"/><circle cx="28" cy="16" r="3"/><circle cx="38" cy="16" r="3"/><circle cx="48" cy="16" r="3"/></g><path d="M8 32h40l-4 16H12Z" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><g fill="currentColor" opacity=".6"><circle cx="20" cy="41" r="3"/><circle cx="28" cy="41" r="3"/><circle cx="36" cy="41" r="3"/></g>'
  },
  {
    slug: "normalization", cat: "de", title: "Normalization vs. denormalization",
    summary: "Store each fact once and keep it consistent, or copy it where it's read and get fast reads.",
    factors: ["Write integrity", "Read speed", "Storage"], related: ["batch-streaming", "cap-theorem", "exact-approximate"],
    glyph: '<g stroke="currentColor" stroke-width="2.5" fill="currentColor" fill-opacity=".1"><rect x="4" y="8" width="18" height="16" rx="2.5"/><rect x="34" y="8" width="18" height="16" rx="2.5"/><rect x="10" y="34" width="36" height="16" rx="2.5"/></g><path d="M13 24v10M43 24v10" stroke="currentColor" stroke-width="2.5"/>'
  },
  {
    slug: "exact-approximate", cat: "de", title: "Exact vs. approximate",
    summary: "More data buys more precision, but with diminishing returns. 4× the compute only halves the error.",
    factors: ["Accuracy", "Compute", "Speed"], related: ["batch-streaming", "normalization", "brevity-completeness"],
    glyph: '<path d="M6 30h44" stroke="currentColor" stroke-width="2" opacity=".4"/><rect x="14" y="22" width="28" height="16" rx="3" fill="currentColor" fill-opacity=".15"/><path d="M28 14v32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="28" cy="30" r="4.5" fill="currentColor"/>'
  },
  {
    slug: "brevity-completeness", cat: "bc", title: "Brevity vs. completeness",
    summary: "Each extra paragraph adds coverage and loses readers. The best message is as short as the audience allows.",
    factors: ["Length", "Coverage", "Attention"], related: ["candour-diplomacy", "speed-consensus", "flexibility-simplicity"],
    glyph: '<rect x="8" y="6" width="40" height="44" rx="4" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-width="2.5"/><path d="M15 16h26M15 24h26M15 32h18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M15 40h10" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".35"/>'
  },
  {
    slug: "speed-consensus", cat: "bc", title: "Speed vs. consensus",
    summary: "Involving more people builds buy-in but slows the decision. Match inclusion to how reversible the choice is.",
    factors: ["Stakeholders", "Buy-in", "Decision time"], related: ["brooks-law", "candour-diplomacy", "brevity-completeness"],
    glyph: '<circle cx="28" cy="28" r="9" fill="currentColor"/><g fill="currentColor" opacity=".45"><circle cx="28" cy="7" r="5"/><circle cx="48" cy="22" r="5"/><circle cx="41" cy="46" r="5"/><circle cx="15" cy="46" r="5"/><circle cx="8" cy="22" r="5"/></g>'
  },
  {
    slug: "candour-diplomacy", cat: "bc", title: "Candour vs. diplomacy",
    summary: "Direct feedback is clear but can strain trust. Caring about the person lets you be direct without damage.",
    factors: ["Directness", "Care", "Clarity"], related: ["brevity-completeness", "speed-consensus", "brooks-law"],
    glyph: '<rect x="6" y="6" width="44" height="44" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M28 6v44M6 28h44" stroke="currentColor" stroke-width="2" opacity=".45"/><rect x="28" y="6" width="22" height="22" fill="currentColor" fill-opacity=".2"/><circle cx="40" cy="16" r="5" fill="currentColor"/>'
  }
];
