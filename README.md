# Resource & Personnel Planner

Third tool in the project management portfolio series, after the budget tool (money) and the Critical Path Scanner (time). This one covers the third classic constraint: people and resource capacity. Same structure throughout on purpose: sign in, land on a portfolio table, add a resource plan through a single modal (PDF scan or manual entry, review before import), then open a full analysis view with stat cards, a rule based recommendations panel, a rebalancing simulator, a load-over-time chart, and a per-resource breakdown.

No pre-filled results anywhere. A new account opens on an empty portfolio, a new plan starts with zero assignments until a PDF is scanned or an assignment is added by hand.

Built with React, TypeScript, Vite, Tailwind CSS, and pdfjs-dist for in-browser PDF text extraction. No backend, everything lives in the browser's local storage.

## The core idea

An "assignment" is one entity, either a **person** (personnel) or a **non-human resource** (a room, a vehicle, a piece of equipment, a license seat), working on one task for a stretch of time, at a percentage of that entity's capacity. Both kinds share the exact same overallocation math on purpose: a shared conference room double-booked at 60%+50% overlapping is exactly as real a conflict as a person double-booked the same way. Two separate sheet types keep this honest in the UI and the PDF import (a whole PDF is either a personnel sheet or a resource sheet, not a per-row mix), while the underlying engine, chart, and breakdown treat both consistently.

## Flow

1. **Sign in** with a name and password, first sign in creates a local account automatically. Same local-only demo login as the other two tools in the series, not a real security system.
2. **Portfolio**: a table of every saved plan, plus a **cross-plan conflicts panel** (see below) sitting above it once there's more than one plan.
3. **Add to plan** (modal): first choose whether you're importing a **personnel sheet** or a **resource sheet**, then pick a PDF or switch to manual entry. A short "Analyzing PDF..." state runs inline, followed by an editable review table before anything is imported. Add both sheet types into the same plan by using "Add another PDF" a second time.
4. **Result view**: five stat cards (timeframe, overallocated count, average utilization, highest peak load, **estimated cost**), an info banner, a recommendations panel, a rebalancing simulator, a utilization chart, and a per-entity breakdown showing personnel and resources together (marked with a small ☺ / □ icon).
5. Add another PDF into the same plan, delete individual assignments, or save changes back to the portfolio at any point.
6. **Export as CSV** for the full assignment breakdown, including kind and cost columns.
7. The portfolio table is searchable and every column header is clickable to sort.

## PDF scan format

One assignment per line, five fields required, a sixth optional:

```
Entity; Task; Allocation %; Start day; Duration (days) [; Rate per day]
Employee A; Website Design; 60; 1; 15; 420
Employee A; Client Calls; 30; 5; 10; 420
Resource A; Conference Room Booking; 40; 1; 5
```

The rate field is optional and, when present, drives the cost estimate shown on the result screen and in the CSV export (`rate × allocation% × duration`).

## About the cross-plan conflicts panel

Every other view in this tool, by design, only ever sees one plan's own assignments. That's exactly why the most common real double-booking slips through in practice: the same person or resource gets assigned in two completely separate plans, each of which looks perfectly healthy on its own. This checks every plan in the portfolio together and flags any entity whose *combined* load across plans crosses 100% on the same day, something no single plan's own view could ever catch by itself. Honesty note: day numbers are relative offsets from each plan's own start (there's no calendar date field anywhere in this tool), so "day 5" is treated as the same day across plans as a simplifying assumption, good enough to catch the pattern, not a substitute for real calendar-based scheduling.

## About the "Recommendations with forecast" panel

A rule based generator (`src/utils/recommend.ts`) that reads the already-computed allocation numbers (peak load, overallocated days, team average) and writes templated prose and a numbered tip list around them. It is not a live call to a language model, there is no API key or network request involved. The math behind every number is real, the sentences around it are templated. Documented here and in the code so it's never mistaken for a live AI call that isn't happening.

## About the Rebalancing Simulator

The direct "what would it take" answer for an overbooked resource. Pick the resource and a target utilization, and the tool runs the same greedy idea as the scheduling tool's project-crashing simulator, just applied to allocation percentage instead of task duration: on whichever day this resource is most over the target, trim one percentage point off whichever active assignment still has the most room, recompute the whole day-load curve (trimming one assignment can shift which day is now the worst), and repeat until the target is met or nothing more can reasonably be trimmed. It returns an exact list of which assignments to trim and by how many points, not just "this person needs less work." A heuristic, not a mathematically optimal solution, same honesty as the scheduling tool.

## About the resource load chart

Plots every resource's daily load percentage as its own line against a dashed 100% capacity reference line. A resource crossing above that line on the chart is the same overallocation the stat cards and banner already flagged, just visible across the whole timeline at once, which helps spot near-misses that a peak number alone doesn't show as clearly.

## Account and storage, read this before using real data

- **Login is a local demo, not real security.** Name and password are stored in plain text in the browser's own storage, there is no server.
- **Portfolio data lives in the browser.** Clearing site data or switching browsers/devices means starting over with an empty portfolio, there is no sync.
- Everything is namespaced under `rcp-` prefixed `localStorage` keys.

## Local development

```bash
npm install
npm run dev
```

## Deploying to Vercel

1. Push this folder to a new GitHub repository
2. Go to vercel.com, choose "Add New Project," and import that repository
3. Vercel auto detects the Vite framework preset, no extra configuration needed
4. Deploy

See `GITHUB_SETUP.md` for exact, click-by-click GitHub upload steps if the command line route is unfamiliar.

## Project structure

```
src/
  components/
    LoginScreen.tsx           name + password, demo account creation
    PortfolioDashboard.tsx    table of saved plans, cross-plan conflicts, search + sort
    AddPlanModal.tsx          personnel/resource sheet choice, PDF scan or manual entry
    PlanResultScreen.tsx      stat cards, recommendations, simulator, chart, breakdown
    RebalanceSimulator.tsx    "what if we cap this entity at X%" simulator
    ResourceLoadChart.tsx     per-entity load lines against a 100% capacity line
    ResourceBreakdown.tsx     per-entity peak/average bars, personnel/resource icon
    CrossPlanConflicts.tsx    entities double-booked across different plans
    AssignmentTable.tsx       full assignment list with kind and delete
    ConfirmDialog.tsx         on-brand delete confirmation, no native confirm()
  utils/
    allocation.ts             the core engine: per-day load per entity, overallocation, cost
    rebalance.ts              greedy trim-plan algorithm for the simulator
    crossPlanConflicts.ts     portfolio-level double-booking detector
    recommend.ts              rule based analysis text generator
    pdfParser.ts              PDF text extraction, kind-aware, optional rate field
    csvExport.ts              CSV download
    account.ts                local demo account system
    plans.ts                  per-account plan storage
  i18n.ts                     German, English, Arabic text
  types.ts                    shared TypeScript types (Assignment, Plan, EntityKind)
  App.tsx                     account state, theme, RTL, screen routing
```
