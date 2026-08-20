import type { Plan, Assignment } from '../types'

function plansKey(accountKey: string) {
  return `rcp-plans-${accountKey}-v1`
}

export function loadPlans(accountKey: string): Plan[] {
  try {
    const raw = localStorage.getItem(plansKey(accountKey))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function savePlans(accountKey: string, plans: Plan[]) {
  localStorage.setItem(plansKey(accountKey), JSON.stringify(plans))
}

export function upsertPlan(accountKey: string, plan: Plan): Plan[] {
  const plans = loadPlans(accountKey)
  const exists = plans.some((p) => p.id === plan.id)
  const next = exists ? plans.map((p) => (p.id === plan.id ? plan : p)) : [...plans, plan]
  savePlans(accountKey, next)
  return next
}

export function deletePlan(accountKey: string, planId: string): Plan[] {
  const plans = loadPlans(accountKey).filter((p) => p.id !== planId)
  savePlans(accountKey, plans)
  return plans
}

export function newPlan(name: string, assignments: Assignment[], sourcePdfNames: string[]): Plan {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    assignments,
    sourcePdfNames,
  }
}
