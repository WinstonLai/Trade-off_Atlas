// Single source of truth for the home grid, search, related links and prev/next.
window.CATEGORIES = [
  { id: "pm", name: "Project management", blurb: "Planning, staffing and delivering work." },
  { id: "bc", name: "Business communication", blurb: "Getting messages and decisions across." },
  { id: "sw", name: "Software development", blurb: "Designing and evolving systems." },
  { id: "de", name: "Data engineering", blurb: "Moving, modelling and computing on data." },
  { id: "ds", name: "Data science", blurb: "Modelling, measuring and learning from data." }
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
    factors: ["Team size", "Coordination", "Delivery speed"], related: ["project-triangle", "monolith-microservices", "utilization-flow"],
    glyph: '<g stroke="currentColor" stroke-width="1.6" opacity=".55"><path d="M28 8 48 22 41 46 15 46 8 22Z M28 8 41 46 M28 8 15 46 M8 22 48 22 M8 22 41 46 M48 22 15 46"/></g><g fill="currentColor"><circle cx="28" cy="8" r="4.5"/><circle cx="48" cy="22" r="4.5"/><circle cx="41" cy="46" r="4.5"/><circle cx="15" cy="46" r="4.5"/><circle cx="8" cy="22" r="4.5"/></g>'
  },
  {
    slug: "utilization-flow", cat: "pm", title: "Utilization vs. flow",
    summary: "Keeping everyone 100% busy makes queues, and waiting time, explode.",
    factors: ["Utilization", "Wait time", "Responsiveness"], related: ["brooks-law", "wip-focus", "specialist-generalist"],
    glyph: '<path d="M6 48h44" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M8 44C24 42 34 36 40 22 43 15 45 10 46 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><g fill="currentColor" opacity=".35"><rect x="8" y="30" width="7" height="7" rx="1.5"/><rect x="17" y="30" width="7" height="7" rx="1.5"/><rect x="8" y="21" width="7" height="7" rx="1.5"/></g>'
  },
  {
    slug: "specialist-generalist", cat: "pm", title: "Specialist vs. generalist",
    summary: "Specialists are faster at their own kind of work. Generalists keep work flowing when demand shifts or someone is away.",
    factors: ["Depth", "Flexibility", "Resilience"], related: ["utilization-flow", "brooks-law", "project-triangle"],
    glyph: '<path d="M8 12h40M28 12v38" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M8 12v8M48 12v8" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".5"/>'
  },
  {
    slug: "batch-size", cat: "pm", title: "Batch size: setup cost vs. holding cost",
    summary: "Big batches spread the fixed cost of each release, but finished work waits longer. The total cost is lowest in between.",
    factors: ["Setup cost", "Holding cost", "Batch size"], related: ["utilization-flow", "wip-focus", "batch-streaming"],
    glyph: '<path d="M6 8C12 52 44 52 50 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M6 8C8 26 14 36 18 40M50 8C48 26 42 36 38 40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 6" opacity=".5"/><circle cx="28" cy="43" r="4.5" fill="currentColor"/>'
  },
  {
    slug: "wip-focus", cat: "pm", title: "Parallel work vs. focus (WIP limits)",
    summary: "Starting more things at once feels productive, but every switch costs time and delays all of them. Limiting work in progress finishes more, sooner.",
    factors: ["Tasks in flight", "Context switching", "Cycle time"], related: ["utilization-flow", "batch-size", "specialist-generalist"],
    glyph: '<g fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="2.5"><rect x="8" y="30" width="40" height="8" rx="2.5"/><rect x="8" y="41" width="40" height="8" rx="2.5"/></g><rect x="8" y="14" width="40" height="8" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="4 4" opacity=".5"/><path d="M4 26h48" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'
  },
  {
    slug: "commit-optionality", cat: "pm", title: "Commit early vs. keep options open",
    summary: "Waiting gives better information but costs time. How long to wait depends on how expensive it is to undo the decision.",
    factors: ["Information", "Cost of delay", "Reversibility"], related: ["speed-consensus", "project-triangle", "technical-debt"],
    glyph: '<rect x="12" y="6" width="26" height="44" rx="3" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-width="2.5"/><path d="M38 6 52 12v38L38 50Z" fill="currentColor" fill-opacity=".3" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><circle cx="46" cy="30" r="2" fill="currentColor"/>'
  },
  {
    slug: "brevity-completeness", cat: "bc", title: "Brevity vs. completeness",
    summary: "Each extra paragraph adds coverage and loses readers. The best message is as short as the audience allows.",
    factors: ["Length", "Coverage", "Attention"], related: ["candour-diplomacy", "jargon-plain-language", "sync-async"],
    glyph: '<rect x="8" y="6" width="40" height="44" rx="4" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-width="2.5"/><path d="M15 16h26M15 24h26M15 32h18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M15 40h10" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".35"/>'
  },
  {
    slug: "speed-consensus", cat: "bc", title: "Speed vs. consensus",
    summary: "Involving more people builds buy-in but slows the decision. Match inclusion to how reversible the choice is.",
    factors: ["Stakeholders", "Buy-in", "Decision time"], related: ["brooks-law", "candour-diplomacy", "commit-optionality"],
    glyph: '<circle cx="28" cy="28" r="9" fill="currentColor"/><g fill="currentColor" opacity=".45"><circle cx="28" cy="7" r="5"/><circle cx="48" cy="22" r="5"/><circle cx="41" cy="46" r="5"/><circle cx="15" cy="46" r="5"/><circle cx="8" cy="22" r="5"/></g>'
  },
  {
    slug: "candour-diplomacy", cat: "bc", title: "Candour vs. diplomacy",
    summary: "Direct feedback is clear but can strain trust. Caring about the person lets you be direct without damage.",
    factors: ["Directness", "Care", "Clarity"], related: ["brevity-completeness", "speed-consensus", "claim-create"],
    glyph: '<rect x="6" y="6" width="44" height="44" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M28 6v44M6 28h44" stroke="currentColor" stroke-width="2" opacity=".45"/><rect x="28" y="6" width="22" height="22" fill="currentColor" fill-opacity=".2"/><circle cx="40" cy="16" r="5" fill="currentColor"/>'
  },
  {
    slug: "sync-async", cat: "bc", title: "Synchronous vs. asynchronous",
    summary: "Live conversation settles ambiguity fast but needs everyone's attention at once. Writing protects focus but is slower to resolve.",
    factors: ["Immediacy", "Focus", "Record"], related: ["brevity-completeness", "reach-relevance", "utilization-flow"],
    glyph: '<path d="M5 8h28a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H15l-8 8v-8H5a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3Z" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" transform="translate(1 0)"/><path d="M22 32h26a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-3v7l-8-7H22a3 3 0 0 1-3-3V35a3 3 0 0 1 3-3Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="4 4" stroke-linejoin="round" transform="translate(0 -4) scale(.9) translate(3 4)"/>'
  },
  {
    slug: "claim-create", cat: "bc", title: "Claiming vs. creating value",
    summary: "Sharing information grows the pie but exposes you. Pushing hard for your share shrinks the pie and the chance of a deal.",
    factors: ["Value created", "Your share", "Chance of a deal"], related: ["candour-diplomacy", "speed-consensus", "brevity-completeness"],
    glyph: '<circle cx="28" cy="28" r="23" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 4" opacity=".45"/><circle cx="28" cy="28" r="17" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="2.5"/><path d="M28 28V11a17 17 0 0 1 17 17Z" fill="currentColor"/>'
  },
  {
    slug: "jargon-plain-language", cat: "bc", title: "Precision vs. plain language",
    summary: "Technical terms are exact, but only to readers who know them. The right level depends on who is reading.",
    factors: ["Precision", "Comprehension", "Audience"], related: ["brevity-completeness", "candour-diplomacy", "sync-async"],
    glyph: '<path d="M18 8c-6 0-6 4-6 8v5c0 4-3 5-5 7 2 2 5 3 5 7v5c0 4 0 8 6 8M38 8c6 0 6 4 6 8v5c0 4 3 5 5 7-2 2-5 3-5 7v5c0 4 0 8-6 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="28" cy="28" r="4" fill="currentColor"/>'
  },
  {
    slug: "reach-relevance", cat: "bc", title: "Reach vs. relevance (broadcast vs. targeted)",
    summary: "Sending to everyone misses nobody but spends everyone's attention. Targeting protects attention if you know who needs to know.",
    factors: ["Reach", "Relevance", "Attention"], related: ["brevity-completeness", "sync-async", "speed-consensus"],
    glyph: '<g fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="28" cy="28" r="22" opacity=".35"/><circle cx="28" cy="28" r="14" opacity=".65"/><circle cx="28" cy="28" r="6"/></g><circle cx="28" cy="28" r="2.5" fill="currentColor"/><g fill="currentColor" opacity=".4"><circle cx="6" cy="10" r="2.5"/><circle cx="50" cy="8" r="2.5"/><circle cx="52" cy="48" r="2.5"/><circle cx="5" cy="46" r="2.5"/></g>'
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
    factors: ["Consistency", "Availability", "Partition tolerance"], related: ["normalization", "quorum-consistency", "partitioning"],
    glyph: '<circle cx="14" cy="28" r="9" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="3"/><circle cx="42" cy="28" r="9" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="3"/><path d="M23 28h6M33 28h0" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M27 20 31 36" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'
  },
  {
    slug: "flexibility-simplicity", cat: "sw", title: "Flexibility vs. simplicity",
    summary: "Each abstraction makes the change you predicted cheaper and every other change harder to understand.",
    factors: ["Abstraction", "Planned change", "Comprehension"], related: ["technical-debt", "cap-theorem", "brevity-completeness"],
    glyph: '<g stroke="currentColor" stroke-width="2.5" fill="currentColor" fill-opacity=".1"><rect x="10" y="6" width="36" height="9" rx="2.5"/><rect x="14" y="19" width="28" height="9" rx="2.5"/><rect x="18" y="32" width="20" height="9" rx="2.5"/></g><rect x="23" y="45" width="10" height="7" rx="2" fill="currentColor"/>'
  },
  {
    slug: "time-space", cat: "sw", title: "Time vs. space (caching)",
    summary: "Spend memory to remember answers and skip the recomputation. Each extra byte of cache helps less than the last.",
    factors: ["Memory", "Compute time", "Freshness"], related: ["exact-approximate", "normalization", "latency-throughput"],
    glyph: '<circle cx="24" cy="24" r="17" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="3"/><path d="M24 13v11l7 4" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="34" y="34" width="17" height="15" rx="3" fill="currentColor"/>'
  },
  {
    slug: "monolith-microservices", cat: "sw", title: "Monolith vs. microservices",
    summary: "Splitting a system lets teams ship independently, but turns function calls into network calls and adds more to operate.",
    factors: ["Team autonomy", "Operational complexity", "Coordination"], related: ["brooks-law", "flexibility-simplicity", "cap-theorem"],
    glyph: '<rect x="4" y="10" width="22" height="36" rx="3" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="2.5"/><g fill="currentColor"><rect x="33" y="8" width="9" height="9" rx="2"/><rect x="45" y="8" width="9" height="9" rx="2" opacity=".6"/><rect x="33" y="24" width="9" height="9" rx="2" opacity=".6"/><rect x="45" y="24" width="9" height="9" rx="2"/><rect x="33" y="40" width="9" height="9" rx="2"/><rect x="45" y="40" width="9" height="9" rx="2" opacity=".6"/></g>'
  },
  {
    slug: "latency-throughput", cat: "sw", title: "Latency vs. throughput",
    summary: "Batching shares fixed overhead and lets a system do more per second, but every item waits for its batch.",
    factors: ["Latency", "Throughput", "Batch size"], related: ["time-space", "utilization-flow", "batch-streaming"],
    glyph: '<rect x="4" y="16" width="48" height="24" rx="12" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-width="2.5"/><g fill="currentColor"><circle cx="16" cy="28" r="3.5"/><circle cx="26" cy="28" r="3.5"/><circle cx="36" cy="28" r="3.5" opacity=".6"/><circle cx="46" cy="28" r="3.5" opacity=".3"/></g><path d="M20 8h16M20 48h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>'
  },
  {
    slug: "quorum-consistency", cat: "sw", title: "Consistency vs. latency (quorums)",
    summary: "Even with no failures, waiting for more replicas gives fresher reads but slower answers.",
    factors: ["Consistency", "Latency", "Replicas"], related: ["cap-theorem", "optimistic-pessimistic", "normalization"],
    glyph: '<g fill="currentColor"><circle cx="7" cy="16" r="4.5"/><circle cx="17.5" cy="16" r="4.5"/><circle cx="28" cy="16" r="4.5"/><circle cx="38.5" cy="16" r="4.5" opacity=".3"/><circle cx="49" cy="16" r="4.5" opacity=".3"/></g><path d="M5 30h24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M27 40h24" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".55"/><path d="M28 24v22" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/>'
  },
  {
    slug: "optimistic-pessimistic", cat: "sw", title: "Optimistic vs. pessimistic locking",
    summary: "Locking first is safe but makes everyone pay. Checking at the end is cheap when clashes are rare and wasteful when they're common.",
    factors: ["Lock overhead", "Retries", "Contention"], related: ["quorum-consistency", "cap-theorem", "latency-throughput"],
    glyph: '<rect x="12" y="26" width="32" height="24" rx="4" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="2.5"/><path d="M19 26v-7a9 9 0 0 1 18 0v7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="28" cy="36" r="3" fill="currentColor"/><path d="M28 38v5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>'
  },
  {
    slug: "batch-streaming", cat: "de", title: "Batch vs. streaming",
    summary: "Fresher data costs more to run and is harder to get right.",
    factors: ["Latency", "Cost", "Complexity"], related: ["exact-approximate", "utilization-flow", "batch-size"],
    glyph: '<g fill="currentColor"><circle cx="8" cy="16" r="3"/><circle cx="18" cy="16" r="3"/><circle cx="28" cy="16" r="3"/><circle cx="38" cy="16" r="3"/><circle cx="48" cy="16" r="3"/></g><path d="M8 32h40l-4 16H12Z" fill="currentColor" fill-opacity=".15" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><g fill="currentColor" opacity=".6"><circle cx="20" cy="41" r="3"/><circle cx="28" cy="41" r="3"/><circle cx="36" cy="41" r="3"/></g>'
  },
  {
    slug: "normalization", cat: "de", title: "Normalization vs. denormalization",
    summary: "Store each fact once and keep it consistent, or copy it where it's read and get fast reads.",
    factors: ["Write integrity", "Read speed", "Storage"], related: ["row-column", "cap-theorem", "schema-write-read"],
    glyph: '<g stroke="currentColor" stroke-width="2.5" fill="currentColor" fill-opacity=".1"><rect x="4" y="8" width="18" height="16" rx="2.5"/><rect x="34" y="8" width="18" height="16" rx="2.5"/><rect x="10" y="34" width="36" height="16" rx="2.5"/></g><path d="M13 24v10M43 24v10" stroke="currentColor" stroke-width="2.5"/>'
  },
  {
    slug: "exact-approximate", cat: "de", title: "Exact vs. approximate",
    summary: "More data buys more precision, but with diminishing returns. 4× the compute only halves the error.",
    factors: ["Accuracy", "Compute", "Speed"], related: ["batch-streaming", "bias-variance", "privacy-utility"],
    glyph: '<path d="M6 30h44" stroke="currentColor" stroke-width="2" opacity=".4"/><rect x="14" y="22" width="28" height="16" rx="3" fill="currentColor" fill-opacity=".15"/><path d="M28 14v32" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="28" cy="30" r="4.5" fill="currentColor"/>'
  },
  {
    slug: "schema-write-read", cat: "de", title: "Schema-on-write vs. schema-on-read",
    summary: "Validate before storing and consumers get clean data. Store raw and shape it later and you stay flexible, but every reader pays.",
    factors: ["Upfront rigour", "Flexibility", "Data quality"], related: ["normalization", "batch-streaming", "exact-approximate"],
    glyph: '<path d="M6 8h44L34 28v16l-12 6V28Z" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M20 15h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>'
  },
  {
    slug: "row-column", cat: "de", title: "Row vs. column storage",
    summary: "Storing each record together makes single-record work fast. Storing each column together makes scanning a few columns fast.",
    factors: ["Point lookups", "Scan speed", "Write cost"], related: ["normalization", "schema-write-read", "index-read-write"],
    glyph: '<g fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-width="2"><rect x="3" y="12" width="22" height="32" rx="2.5"/><rect x="31" y="12" width="22" height="32" rx="2.5"/></g><rect x="5" y="19" width="18" height="6" rx="1.5" fill="currentColor"/><rect x="38" y="14" width="6" height="28" rx="1.5" fill="currentColor"/><path d="M5 33h18M31 28h4M47 28h4" stroke="currentColor" stroke-width="2" opacity=".5"/>'
  },
  {
    slug: "index-read-write", cat: "de", title: "Indexes: read speed vs. write cost",
    summary: "An index turns a scan into a lookup, but every write must update it, and each extra index helps less than the last.",
    factors: ["Read speed", "Write cost", "Storage"], related: ["time-space", "row-column", "normalization"],
    glyph: '<rect x="6" y="8" width="36" height="40" rx="3.5" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="2.5"/><path d="M13 18h22M13 26h22M13 34h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity=".5"/><g fill="currentColor"><rect x="42" y="12" width="10" height="9" rx="2"/><rect x="42" y="25" width="10" height="9" rx="2" opacity=".6"/><rect x="42" y="38" width="10" height="9" rx="2" opacity=".35"/></g>'
  },
  {
    slug: "partitioning", cat: "de", title: "Hash vs. range partitioning",
    summary: "Splitting by key range keeps neighbours together but concentrates bursts. Splitting by hash spreads load but scatters range queries.",
    factors: ["Even load", "Range queries", "Hot spots"], related: ["cap-theorem", "row-column", "quorum-consistency"],
    glyph: '<rect x="5" y="8" width="46" height="40" rx="3.5" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M17 8v40M28 8v40M39 8v40" stroke="currentColor" stroke-width="2" opacity=".5"/><g fill="currentColor"><rect x="30" y="14" width="8" height="26" rx="1.5" opacity=".35"/><circle cx="11" cy="18" r="3"/><circle cx="23" cy="34" r="3"/><circle cx="45" cy="22" r="3"/><circle cx="34" cy="42" r="3"/></g>'
  },
  {
    slug: "bias-variance", cat: "ds", title: "Bias vs. variance",
    summary: "A simple model misses the pattern. A flexible one memorises the noise. Error on new data is lowest in between.",
    factors: ["Model complexity", "Generalisation", "Data volume"], related: ["accuracy-interpretability", "precision-recall", "flexibility-simplicity"],
    glyph: '<path d="M6 44C14 40 20 14 28 24S44 8 50 12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><g fill="currentColor"><circle cx="11" cy="40" r="3.2"/><circle cx="22" cy="22" r="3.2"/><circle cx="33" cy="28" r="3.2"/><circle cx="44" cy="12" r="3.2"/></g>'
  },
  {
    slug: "precision-recall", cat: "ds", title: "Precision vs. recall",
    summary: "Flag more and you catch more real cases, but more of your flags are wrong. Where to draw the line depends on which mistake costs more.",
    factors: ["Precision", "Recall", "Cost of errors"], related: ["bias-variance", "exact-approximate", "significance-power"],
    glyph: '<path d="M3 46C9 46 12 12 19 12S29 46 36 46" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M20 46C26 46 29 24 36 24S46 46 53 46" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity=".6"/><path d="M30 6v44" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'
  },
  {
    slug: "explore-exploit", cat: "ds", title: "Explore vs. exploit",
    summary: "Keep pulling the arm that looks best, or try another that might be better? Exploring costs reward today. Never exploring locks in a guess.",
    factors: ["Exploration", "Short-term reward", "Time left"], related: ["bias-variance", "speed-consensus", "technical-debt"],
    glyph: '<path d="M28 50V30M28 30 10 14M28 30 46 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".55"/><path d="M28 30V10" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><g fill="currentColor"><circle cx="10" cy="14" r="4"/><circle cx="46" cy="14" r="4"/><circle cx="28" cy="8" r="5"/></g>'
  },
  {
    slug: "significance-power", cat: "ds", title: "Significance vs. power (Type I vs. Type II errors)",
    summary: "A test can raise a false alarm or miss a real effect. Making it stricter against one makes the other more likely, unless you collect more data.",
    factors: ["False alarms", "Missed effects", "Sample size"], related: ["precision-recall", "bias-variance", "exact-approximate"],
    glyph: '<path d="M28 38 20 50h16Z" fill="currentColor"/><path d="M6 36 50 22" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><circle cx="8" cy="30" r="6" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-width="2.5"/><circle cx="48" cy="16" r="6" fill="currentColor"/>'
  },
  {
    slug: "privacy-utility", cat: "ds", title: "Privacy vs. utility (differential privacy)",
    summary: "Adding noise hides any one person but blurs the result. The amount of noise is a dial between privacy and accuracy.",
    factors: ["Privacy", "Accuracy", "Noise"], related: ["exact-approximate", "significance-power", "bias-variance"],
    glyph: '<circle cx="28" cy="20" r="9" fill="currentColor"/><path d="M10 50c0-11 8-17 18-17s18 6 18 17Z" fill="currentColor"/><circle cx="28" cy="30" r="25" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="2 5" stroke-linecap="round" opacity=".6"/>'
  },
  {
    slug: "accuracy-interpretability", cat: "ds", title: "Accuracy vs. interpretability",
    summary: "Flexible models predict better but are harder to explain. How much that matters depends on the stakes of the decision.",
    factors: ["Accuracy", "Explainability", "Stakes"], related: ["bias-variance", "flexibility-simplicity", "jargon-plain-language"],
    glyph: '<rect x="4" y="12" width="24" height="32" rx="3.5" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M10 22h12M10 30h12M10 38h7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity=".6"/><rect x="32" y="12" width="20" height="32" rx="3.5" fill="currentColor"/>'
  }
];
