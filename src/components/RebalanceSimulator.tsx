import { useEffect, useState } from 'react'
import type { Assignment } from '../types'
import { computeRebalancePlan, RebalancePlan } from '../utils/rebalance'
import { Dict } from '../i18n'

interface Props {
  assignments: Assignment[]
  entityNames: string[]
  overallocatedEntityNames: string[]
  onApplyPlan: (steps: RebalancePlan['steps']) => void
  t: Dict
}

export default function RebalanceSimulator({ assignments, entityNames, overallocatedEntityNames, onApplyPlan, t }: Props) {
  const [entity, setEntity] = useState<string>(overallocatedEntityNames[0] ?? entityNames[0] ?? '')
  const [target, setTarget] = useState<number>(100)
  const [plan, setPlan] = useState<RebalancePlan | null>(null)

  // Same staleness guard as the scheduling tool's target date simulator: a
  // computed plan that stays on screen after the underlying assignments
  // changed would show numbers that no longer match what's displayed above
  // it. Clears on any real change instead.
  useEffect(() => {
    setPlan(null)
  }, [assignments])

  useEffect(() => {
    if (!entityNames.includes(entity) && entityNames.length > 0) {
      setEntity(overallocatedEntityNames[0] ?? entityNames[0])
    }
  }, [entityNames, overallocatedEntityNames, entity])

  const run = () => {
    if (!entity) return
    setPlan(computeRebalancePlan(assignments, entity, target))
  }

  if (entityNames.length === 0) return null

  return (
    <div className="border border-edge bg-surface2 rounded-lg p-5 mb-6">
      <h3 className="font-display font-semibold text-ink mb-1">{t.rebalanceTitle}</h3>
      <p className="text-xs text-ink3 mb-4 max-w-lg">{t.rebalanceHint}</p>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="block">
          <span className="text-xs font-mono text-ink2 uppercase tracking-wide block mb-1">{t.rebalanceEntityLabel}</span>
          <select value={entity} onChange={(e) => setEntity(e.target.value)} className="bg-field border border-fieldEdge rounded px-3 py-2 text-sm text-ink min-w-[160px]">
            {entityNames.map((name) => (
              <option key={name} value={name}>
                {name}
                {overallocatedEntityNames.includes(name) ? ' ⚠' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-mono text-ink2 uppercase tracking-wide block mb-1">{t.rebalanceTargetLabel}</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={100}
              value={target}
              onChange={(e) => setTarget(Math.max(10, Math.min(100, Number(e.target.value))))}
              className="w-24 bg-field border border-fieldEdge rounded px-3 py-2 text-sm text-ink"
            />
            <span className="text-xs text-ink3">%</span>
          </div>
        </label>
        <button onClick={run} className="px-4 py-2 text-sm font-mono bg-gold-500 text-inkOnGold rounded hover:bg-gold-400 font-semibold">
          {t.rebalanceRun}
        </button>
      </div>

      {plan && (
        <div>
          {plan.steps.length === 0 && plan.achievable && <p className="text-sm text-ink2">{t.rebalanceAlreadyMet}</p>}

          {plan.steps.length > 0 && (
            <>
              <div
                className="rounded-md border px-3 py-2 mb-4 text-sm"
                style={{
                  borderColor: plan.achievable ? '#34D39955' : '#EF444455',
                  backgroundColor: plan.achievable ? '#34D39915' : '#EF444415',
                  color: plan.achievable ? '#34D399' : '#EF4444',
                }}
              >
                {plan.achievable
                  ? `${t.rebalanceAchievable} ${plan.achievedPeak}%.`
                  : `${t.rebalanceNotFullyAchievable} ${plan.achievedPeak}% (${t.rebalanceTargetWas} ${plan.targetPercent}%).`}
              </div>

              <p className="text-xs font-mono text-ink3 uppercase tracking-wide mb-2">{t.rebalancePlanTitle}</p>
              <div className="space-y-2 mb-4">
                {plan.steps.map((step) => (
                  <div key={step.assignmentId} className="flex items-center justify-between text-sm border border-edge rounded px-3 py-2">
                    <span className="text-ink truncate">{step.taskName}</span>
                    <span className="font-mono text-xs text-ink2 shrink-0 ml-3">
                      {step.originalPercent}% → {step.newPercent}%<span className="text-gold-400 ml-1.5">(−{step.reduceBy})</span>
                    </span>
                  </div>
                ))}
              </div>

              <button onClick={() => onApplyPlan(plan.steps)} className="px-4 py-2 text-sm font-mono border border-fieldEdge rounded text-ink2 hover:text-gold-400 hover:border-gold-500">
                {t.rebalanceApplyPlan}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
