import type { Plan, CrossPlanConflict } from '../types'

// Every single-plan view in this tool, by design, only ever sees its own
// plan's assignments. That's exactly why the most common real-world
// double-booking slips through: the same person or room gets assigned in
// two completely separate plans, each of which looks perfectly healthy on
// its own. This walks every plan in the portfolio together and asks the
// one question a single plan can't: does this entity's combined load
// across ALL of them ever cross 100% on the same day.
//
// Honesty note, since this can't be hidden in the math: day numbers here
// are relative offsets from each plan's own start (there's no calendar
// date field anywhere in this tool), so "day 5" is only treated as the
// same day across plans as a simplifying assumption, not a verified
// shared calendar date. Good enough to catch the pattern for a demo or an
// early warning, not a substitute for real calendar-based scheduling.
export function findCrossPlanConflicts(plans: Plan[]): CrossPlanConflict[] {
  const byEntity = new Map<string, { planId: string; planName: string; kind: 'personnel' | 'resource'; startDay: number; durationDays: number; allocationPercent: number }[]>()

  for (const plan of plans) {
    for (const a of plan.assignments) {
      const list = byEntity.get(a.entityName) ?? []
      list.push({ planId: plan.id, planName: plan.name, kind: a.kind, startDay: a.startDay, durationDays: a.durationDays, allocationPercent: a.allocationPercent })
      byEntity.set(a.entityName, list)
    }
  }

  const conflicts: CrossPlanConflict[] = []

  for (const [entityName, entries] of byEntity) {
    // BUGFIX: this used to de-duplicate by plan NAME, which meant two
    // genuinely different plans that happened to share a name (very
    // plausible with the auto-generated "Add plan <date>" fallback name,
    // or simply two projects both called "Website Redesign") collapsed
    // into a single entry and the conflict between them went undetected.
    // Plans are only ever the same plan if they share an id.
    const planIds = new Set(entries.map((e) => e.planId))
    if (planIds.size < 2) continue // only appears in one plan, not a cross-plan case

    const minDay = Math.min(...entries.map((e) => e.startDay))
    const maxDay = Math.max(...entries.map((e) => e.startDay + e.durationDays - 1))

    let worstDay = minDay
    let worstPercent = 0
    let worstPlanIds = new Set<string>()

    for (let day = minDay; day <= maxDay; day++) {
      const active = entries.filter((e) => day >= e.startDay && day < e.startDay + e.durationDays)
      const activePlanIds = new Set(active.map((e) => e.planId))
      if (activePlanIds.size < 2) continue // conflict must span at least two different plans
      const total = active.reduce((sum, e) => sum + e.allocationPercent, 0)
      if (total > worstPercent) {
        worstPercent = total
        worstDay = day
        worstPlanIds = activePlanIds
      }
    }

    if (worstPercent > 100) {
      const worstPlanNames = [...new Set(entries.filter((e) => worstPlanIds.has(e.planId)).map((e) => e.planName))]
      conflicts.push({
        entityName,
        kind: entries[0].kind,
        planNames: worstPlanNames,
        overlapDay: worstDay,
        combinedPercent: worstPercent,
      })
    }
  }

  return conflicts.sort((a, b) => b.combinedPercent - a.combinedPercent)
}
