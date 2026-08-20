import type { AllocationResult, EntitySummary } from '../types'

export interface AvailabilityEntry {
  entityName: string
  kind: EntitySummary['kind']
  freeDays: number // days across the plan span with zero allocation at all
  lightestDays: number // days with load under 50%, spare capacity even while active
  headroomPercent: number // 100 - average load, the practical "how much more could we give them"
  totalDays: number
}

// Every panel elsewhere in this tool answers "who is overloaded". This
// answers the opposite, equally practical question a staffing decision
// actually needs: if a new task shows up tomorrow, who genuinely has room
// for it. Built from the exact same day-by-day load data the overallocation
// check already computes, just read from the other direction.
export function findAvailability(result: AllocationResult): AvailabilityEntry[] {
  const totalDays = result.maxDay - result.minDay + 1

  return result.entities
    .map((e) => {
      const freeDays = e.dayLoads.filter((d) => d.totalPercent === 0).length
      const lightestDays = e.dayLoads.filter((d) => d.totalPercent > 0 && d.totalPercent < 50).length
      const headroomPercent = Math.max(0, 100 - e.averagePercent)
      return { entityName: e.entityName, kind: e.kind, freeDays, lightestDays, headroomPercent, totalDays }
    })
    .filter((e) => !result.entities.find((x) => x.entityName === e.entityName)?.isOverallocated) // overbooked entities aren't "available", they're the opposite problem
    .sort((a, b) => b.headroomPercent - a.headroomPercent)
}
