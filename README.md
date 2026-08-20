# Resource and Personnel Planner

**Live:** https://projektmanagement.nadin.dev

A planning tool for people and resources. It shows who is overbooked, when, and what rebalancing would fix it. English, German and Arabic.

## Idea

An assignment links one entity, a person or a resource such as a room, vehicle, equipment or license seat, to a task for a period at a share of its capacity. All views are computed from these assignments.

## Features

- Portfolio table of saved plans, plus a panel for conflicts across plans.
- Import a personnel sheet or a resource sheet from PDF (read in the browser) or enter assignments by hand.
- Result view: timeframe, overallocated entities, average utilization, peak load and estimated cost.
- Resource load chart: each entity's daily load against a 100 percent capacity line.
- Recommendations generated from the computed numbers.
- Rebalancing simulator: pick an overbooked resource and a target utilization.
- CSV export with kind and cost columns.
- Demo data: "Try with demo data" loads fictional plans without an account.

## PDF format

One assignment per line, five fields and an optional rate:

```
Entity; Task; Allocation %; Start day; Duration (days) [; Rate per day]
Employee A; Website Design; 60; 1; 15; 420
Resource A; Conference Room Booking; 40; 1; 5
```

With a rate, the cost estimate is rate x allocation x duration.

## Tech

React, TypeScript, Vite, Tailwind CSS and pdf.js. There is no backend: everything lives in the browser's local storage under `rcp-` keys. The local sign in only separates data per name and is not a security feature.

## Structure

```
src/
  components/   views and dialogs
  utils/        allocation engine, conflicts, rebalancing, PDF parser, recommendations
public/
```

## Run locally

```bash
npm install
npm run dev
npm run build
```

Built by Nadin Okil.
