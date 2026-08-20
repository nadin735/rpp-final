// Two distinct entity kinds, because a company's capacity constraints
// aren't just "people": a conference room, a fleet vehicle, a pool of
// laptops, or a shared license seat all have the exact same "can't be
// double-booked past 100%" problem, just for a thing instead of a person.
// Keeping both on the same load-percentage engine (below) means the same
// math catches both kinds of conflict, while the UI and PDF import keep
// them as two clearly separate sheets so a plan reads like a real
// resourcing document, not one undifferentiated list.
export type EntityKind = 'personnel' | 'resource'

// An "Assignment" is one entity (a person or a non-human resource) working
// on one task for a stretch of the timeline, at a given percentage of that
// entity's capacity. An entity can have several assignments that overlap
// in time, which is exactly the situation this tool is built to surface:
// whether the sum of those overlapping percentages ever exceeds 100 on any
// given day.
export interface Assignment {
  id: string
  entityName: string
  kind: EntityKind
  taskName: string
  allocationPercent: number // 0-100+, % of that entity's capacity this assignment consumes
  startDay: number // day offset from plan start, inclusive
  durationDays: number // length in days, minimum 1
  ratePerDay?: number // cost per day at 100% allocation, optional, drives the cost stat card
}

export interface Plan {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  assignments: Assignment[]
  sourcePdfNames: string[]
}

// Per-day load for a single entity: how many assignments are active that
// day and what they sum to. Computed across the whole span of the plan.
export interface EntityDayLoad {
  day: number
  totalPercent: number
  assignmentIds: string[]
}

export interface EntitySummary {
  entityName: string
  kind: EntityKind
  assignments: Assignment[]
  dayLoads: EntityDayLoad[] // one entry per day in [minDay, maxDay]
  peakPercent: number
  peakDay: number
  averagePercent: number // average load across days this entity has ANY assignment active
  overallocatedDays: number // count of days where totalPercent > 100
  isOverallocated: boolean
  totalCost: number // sum of ratePerDay-driven cost across this entity's assignments, 0 if no rates given
}

export interface AllocationResult {
  entities: EntitySummary[]
  minDay: number
  maxDay: number
  totalEntities: number
  personnelCount: number
  resourceCount: number
  overallocatedEntityCount: number
  averageUtilization: number // mean of each entity's averagePercent
  totalCost: number
}

// A cross-plan conflict: the same named entity is overallocated once you
// account for assignments in a DIFFERENT plan too, something a single
// plan's own view can never catch on its own since each plan only sees
// its own assignments. This is deliberately portfolio-level.
export interface CrossPlanConflict {
  entityName: string
  kind: EntityKind
  planNames: string[] // the plans this entity appears in with overlapping load
  overlapDay: number
  combinedPercent: number
}
