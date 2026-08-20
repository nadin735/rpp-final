import type { Assignment } from '../types'
import { computeAllocation } from './allocation'

export interface RebalanceStep {
  assignmentId: string
  taskName: string
  originalPercent: number
  reduceBy: number
  newPercent: number
}

export interface RebalancePlan {
  entityName: string
  targetPercent: number
  startingPeak: number
  achievedPeak: number
  achievable: boolean
  steps: RebalanceStep[]
}

// Same greedy idea as project crashing in the scheduling tool, applied to
// allocation percentage instead of task duration: on whichever day this
// resource is most over the target, trim one percentage point off whichever
// active assignment still has the most room, recompute the whole day-load
// curve (trimming one assignment can change which day is now the worst),
// and repeat until every day is at or under the target or nothing more can
// reasonably be trimmed. A heuristic, not a mathematically optimal
// solution, same honesty as the scheduling tool's crash simulator.
//
// An assignment is never trimmed below 10% of its original allocation, a
// floor standing in for "below some point an assignment isn't meaningful
// work anymore" absent real project constraints.
export function computeRebalancePlan(allAssignments: Assignment[], entityName: string, targetPercent: number): RebalancePlan | null {
  const entityAssignments = allAssignments.filter((a) => a.entityName === entityName)
  if (entityAssignments.length === 0) return null

  const startingResult = computeAllocation(entityAssignments)
  if (!startingResult) return null
  const startingPeak = startingResult.entities[0].peakPercent

  const floor = new Map(entityAssignments.map((a) => [a.id, Math.max(1, Math.ceil(a.allocationPercent * 0.1))]))
  const reductions = new Map<string, number>()
  let working = entityAssignments.map((a) => ({ ...a }))
  let guard = 0
  let peak = startingPeak

  while (peak > targetPercent && guard < 2000) {
    guard++
    const result = computeAllocation(working)
    if (!result) break
    const summary = result.entities[0]
    peak = summary.peakPercent
    if (peak <= targetPercent) break

    const worstDay = summary.dayLoads.reduce((best, d) => (d.totalPercent > best.totalPercent ? d : best), summary.dayLoads[0])
    const candidates = working
      .filter((a) => worstDay.assignmentIds.includes(a.id))
      .map((a) => ({ assignment: a, room: a.allocationPercent - (floor.get(a.id) ?? 1) }))
      .filter((c) => c.room > 0)
      .sort((a, b) => b.room - a.room)

    if (candidates.length === 0) break

    const pick = candidates[0].assignment
    reductions.set(pick.id, (reductions.get(pick.id) ?? 0) + 1)
    working = working.map((a) => (a.id === pick.id ? { ...a, allocationPercent: a.allocationPercent - 1 } : a))
  }

  const finalResult = computeAllocation(working)
  const achievedPeak = finalResult ? finalResult.entities[0].peakPercent : startingPeak

  const steps: RebalanceStep[] = [...reductions.entries()]
    .map(([id, reduceBy]) => {
      const original = entityAssignments.find((a) => a.id === id)!
      return {
        assignmentId: id,
        taskName: original.taskName,
        originalPercent: original.allocationPercent,
        reduceBy,
        newPercent: original.allocationPercent - reduceBy,
      }
    })
    .sort((a, b) => b.reduceBy - a.reduceBy)

  return {
    entityName,
    targetPercent,
    startingPeak,
    achievedPeak,
    achievable: achievedPeak <= targetPercent,
    steps,
  }
}
