import type { Assignment, AllocationResult, EntityDayLoad, EntitySummary } from '../types'

// This is the real computation behind the whole tool: for every entity
// (person or resource), walk every day of the plan and sum the allocation
// percentage of every assignment active that day. If that sum ever
// exceeds 100, the entity is overbooked on that day, the same way a
// person can't actually work 60% on one thing and 70% on another at the
// same time, or a single conference room can't host two 60%-day meetings
// that overlap, even though both numbers look fine in isolation. This is
// the resource-planning analogue of the critical path calculation in the
// scheduling tool: same idea of walking a timeline and finding where the
// real constraint gets violated.
export function computeAllocation(assignments: Assignment[]): AllocationResult | null {
  if (assignments.length === 0) return null

  const minDay = Math.min(...assignments.map((a) => a.startDay))
  const maxDay = Math.max(...assignments.map((a) => a.startDay + a.durationDays - 1))

  const byEntity = new Map<string, Assignment[]>()
  for (const a of assignments) {
    const list = byEntity.get(a.entityName) ?? []
    list.push(a)
    byEntity.set(a.entityName, list)
  }

  const entities: EntitySummary[] = []

  for (const [entityName, list] of byEntity) {
    const dayLoads: EntityDayLoad[] = []
    for (let day = minDay; day <= maxDay; day++) {
      const active = list.filter((a) => day >= a.startDay && day < a.startDay + a.durationDays)
      const totalPercent = active.reduce((sum, a) => sum + a.allocationPercent, 0)
      dayLoads.push({ day, totalPercent, assignmentIds: active.map((a) => a.id) })
    }

    const activeDayLoads = dayLoads.filter((d) => d.totalPercent > 0)
    const averagePercent = activeDayLoads.length
      ? Math.round(activeDayLoads.reduce((sum, d) => sum + d.totalPercent, 0) / activeDayLoads.length)
      : 0
    const peak = dayLoads.reduce((best, d) => (d.totalPercent > best.totalPercent ? d : best), dayLoads[0])
    const overallocatedDays = dayLoads.filter((d) => d.totalPercent > 100).length

    const totalCost = list.reduce((sum, a) => sum + (a.ratePerDay ? a.ratePerDay * (a.allocationPercent / 100) * a.durationDays : 0), 0)

    entities.push({
      entityName,
      kind: list[0].kind,
      assignments: list,
      dayLoads,
      peakPercent: peak.totalPercent,
      peakDay: peak.day,
      averagePercent,
      overallocatedDays,
      isOverallocated: overallocatedDays > 0,
      totalCost,
    })
  }

  entities.sort((a, b) => b.peakPercent - a.peakPercent)

  const overallocatedEntityCount = entities.filter((e) => e.isOverallocated).length
  const averageUtilization = entities.length ? Math.round(entities.reduce((sum, e) => sum + e.averagePercent, 0) / entities.length) : 0
  const totalCost = entities.reduce((sum, e) => sum + e.totalCost, 0)

  return {
    entities,
    minDay,
    maxDay,
    totalEntities: entities.length,
    personnelCount: entities.filter((e) => e.kind === 'personnel').length,
    resourceCount: entities.filter((e) => e.kind === 'resource').length,
    overallocatedEntityCount,
    averageUtilization,
    totalCost,
  }
}
