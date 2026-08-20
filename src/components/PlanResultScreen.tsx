import { useEffect, useMemo, useState } from 'react'
import type { Plan, Assignment } from '../types'
import { computeAllocation } from '../utils/allocation'
import { buildAnalysis, SEVERITY_COLOR } from '../utils/recommend'
import { exportAssignmentsAsCsv } from '../utils/csvExport'
import { Dict, Lang } from '../i18n'
import AssignmentTable from './AssignmentTable'
import RebalanceSimulator from './RebalanceSimulator'
import ResourceLoadChart from './ResourceLoadChart'
import CapacityHeatmap from './CapacityHeatmap'
import AvailabilityPanel from './AvailabilityPanel'
import ResourceBreakdown from './ResourceBreakdown'
import AddPlanModal from './AddPlanModal'
import { StatusBadge } from './PortfolioDashboard'
import ConfirmDialog from './ConfirmDialog'

interface Props {
  plan: Plan
  allPlans: Plan[]
  lang: Lang
  onSave: (assignments: Assignment[]) => void
  onBack: () => void
  t: Dict
}

const SEVERITY_LABEL_KEY = { healthy: 'severityHealthy', watch: 'severityWatch', critical: 'severityCritical' } as const

export default function PlanResultScreen({ plan, allPlans, lang, onSave, onBack, t }: Props) {
  const [assignments, setAssignments] = useState<Assignment[]>(plan.assignments)
  const [showAddPdf, setShowAddPdf] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [analysisRun, setAnalysisRun] = useState(false)

  const result = useMemo(() => computeAllocation(assignments), [assignments])
  const analysis = useMemo(() => (analysisRun && result ? buildAnalysis(result, t, lang) : null), [analysisRun, result, t, lang])

  useEffect(() => {
    setAnalysisRun(false)
  }, [assignments])

  const markDirty = () => setDirty(true)
  const handleDelete = (id: string) => setPendingDeleteId(id)

  const confirmDelete = () => {
    if (!pendingDeleteId) return
    setAssignments((prev) => prev.filter((a) => a.id !== pendingDeleteId))
    setPendingDeleteId(null)
    markDirty()
  }

  const handleApplyRebalance = (steps: { assignmentId: string; newPercent: number }[]) => {
    const byId = new Map(steps.map((s) => [s.assignmentId, s.newPercent]))
    setAssignments((prev) => prev.map((a) => (byId.has(a.id) ? { ...a, allocationPercent: byId.get(a.id)! } : a)))
    markDirty()
  }

  const entityNames = useMemo(() => [...new Set(assignments.map((a) => a.entityName))], [assignments])
  const overallocatedEntityNames = useMemo(() => result?.entities.filter((e) => e.isOverallocated).map((e) => e.entityName) ?? [], [result])
  const peakEntity = result ? [...result.entities].sort((a, b) => b.peakPercent - a.peakPercent)[0] : undefined

  return (
    <div>
      <button onClick={onBack} className="text-xs font-mono text-ink2 hover:text-gold-400 mb-4">
        ← {t.backToPortfolio}
      </button>

      <p className="text-xs font-mono text-ink3 uppercase tracking-wide mb-1">
        {t.statTimeframe}: {result ? `${result.maxDay - result.minDay + 1} ${t.days}` : '—'}
      </p>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">{plan.name}</h2>
        <StatusBadge result={result} t={t} />
      </div>
      <div className="h-px bg-gold-500 mb-6" />

      {!result ? (
        <p className="text-sm text-ink3 mb-6">{t.noMatches}</p>
      ) : (
        <>
          {/* stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
            <div className="border border-edge bg-surface2 rounded-lg p-4">
              <p className="text-[10px] font-mono text-ink3 uppercase tracking-wide">{t.statTimeframe}</p>
              <p className="font-mono text-2xl font-bold text-ink mt-1">
                {result.maxDay - result.minDay + 1} <span className="text-sm font-normal text-ink3">{t.days}</span>
              </p>
            </div>
            <div className="border border-edge bg-surface2 rounded-lg p-4">
              <p className="text-[10px] font-mono text-ink3 uppercase tracking-wide">{t.statOverallocated}</p>
              <p className="font-mono text-2xl font-bold text-ink mt-1">
                {result.overallocatedEntityCount}
                <span className="text-sm font-normal text-ink3">/{result.totalEntities}</span>
              </p>
            </div>
            <div className="border border-edge bg-surface2 rounded-lg p-4">
              <p className="text-[10px] font-mono text-ink3 uppercase tracking-wide">{t.statUtilization}</p>
              <p className="font-mono text-2xl font-bold text-ink mt-1">{result.averageUtilization}%</p>
            </div>
            <div className="border border-edge bg-surface2 rounded-lg p-4">
              <p className="text-[10px] font-mono text-ink3 uppercase tracking-wide">{t.statPeakEntity}</p>
              <p className="font-mono text-lg font-bold text-gold-400 mt-1 truncate">{peakEntity?.entityName ?? '—'}</p>
              <p className="text-xs text-ink3 font-mono">{peakEntity?.peakPercent ?? 0}%</p>
            </div>
            <div className="border border-edge bg-surface2 rounded-lg p-4">
              <p className="text-[10px] font-mono text-ink3 uppercase tracking-wide">{t.statCost}</p>
              <p className="font-mono text-2xl font-bold text-ink mt-1">{result.totalCost > 0 ? result.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}</p>
            </div>
          </div>

          {/* info banner */}
          <div className="border border-edge bg-surface2 rounded-lg px-4 py-3 mb-6 flex items-start gap-2.5 text-sm text-ink2">
            <span className="text-gold-400">↗</span>
            {result.overallocatedEntityCount > 0 ? (
              <span>
                {result.overallocatedEntityCount}/{result.totalEntities} {t.bannerA}
              </span>
            ) : (
              <span>{t.bannerAllHealthy}</span>
            )}
          </div>

          {/* recommendations panel */}
          <div className="border border-edge bg-surface2 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="font-display font-semibold text-ink">{t.recTitle}</h3>
              <button
                onClick={() => setAnalysisRun(true)}
                className="px-3 py-1.5 text-xs font-mono border border-fieldEdge rounded text-ink2 hover:text-gold-400 hover:border-gold-500 flex items-center gap-1.5"
              >
                ↗ {analysisRun ? t.tryAgain : t.recTitle}
              </button>
            </div>

            {!analysis && <p className="text-sm text-ink3">{t.noAnalysis}</p>}

            {analysis && (
              <div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono mb-4"
                  style={{ backgroundColor: `${SEVERITY_COLOR[analysis.severity]}22`, color: SEVERITY_COLOR[analysis.severity] }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SEVERITY_COLOR[analysis.severity] }} />
                  {t[SEVERITY_LABEL_KEY[analysis.severity]]}
                </span>

                <p className="text-sm text-ink2 leading-relaxed mb-4">{analysis.body}</p>

                <h4 className="font-display font-semibold text-ink mb-2">{t.tipsTitle}</h4>
                <div className="space-y-3 mb-5">
                  {analysis.tips.map((tip, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="text-gold-400 font-mono shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-ink2 leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>

                <h4 className="font-display font-semibold text-ink mb-2">{t.outlookTitle}</h4>
                <p className="text-sm text-ink2 leading-relaxed">{analysis.outlook}</p>
              </div>
            )}
          </div>

          {/* rebalancing simulator */}
          <RebalanceSimulator assignments={assignments} entityNames={entityNames} overallocatedEntityNames={overallocatedEntityNames} onApplyPlan={handleApplyRebalance} t={t} />

          {/* utilization chart */}
          <div className="border border-edge bg-surface2 rounded-lg p-5 mb-6">
            <h3 className="font-display font-semibold text-ink mb-4">{t.chartTitle}</h3>
            <ResourceLoadChart result={result} t={t} />
          </div>

          {/* capacity heatmap, the industry-standard calendar view */}
          <CapacityHeatmap result={result} t={t} />

          {/* who has room, the direct opposite signal from every overallocation check */}
          <AvailabilityPanel result={result} t={t} />

          {/* per-entity breakdown */}
          <ResourceBreakdown result={result} t={t} />
        </>
      )}

      {/* actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => {
            onSave(assignments)
            setDirty(false)
          }}
          className="px-4 py-2 text-sm font-mono bg-gold-500 text-inkOnGold rounded hover:bg-gold-400 font-semibold"
        >
          {dirty ? t.saveChanges : t.savedToPortfolio}
        </button>
        <button onClick={() => setShowAddPdf(true)} className="px-4 py-2 text-sm font-mono border border-fieldEdge rounded text-ink2 hover:text-gold-400 hover:border-gold-500">
          {t.addMoreAssignments}
        </button>
        <div className="ml-auto flex gap-3">
          <button
            onClick={() => exportAssignmentsAsCsv(plan.name, assignments, result)}
            disabled={assignments.length === 0}
            className="px-4 py-2 text-sm font-mono border border-fieldEdge rounded text-ink2 hover:text-gold-400 hover:border-gold-500 disabled:opacity-30"
          >
            {t.exportCsv}
          </button>
        </div>
      </div>

      <button onClick={onBack} className="text-xs font-mono text-ink2 hover:text-gold-400 underline mb-6 block">
        ← {t.backToPortfolio}
      </button>

      <div className="border border-edge bg-surface2 rounded-lg p-4">
        <AssignmentTable assignments={assignments} onDelete={handleDelete} t={t} />
      </div>

      {showAddPdf && (
        <AddPlanModal
          plans={allPlans}
          initialTargetId={plan.id}
          onClose={() => setShowAddPdf(false)}
          onComplete={(imported) => {
            setAssignments((prev) => [...prev, ...imported])
            setShowAddPdf(false)
            markDirty()
          }}
          t={t}
        />
      )}

      {pendingDeleteId && <ConfirmDialog message={t.confirmDeleteAssignment} danger onConfirm={confirmDelete} onCancel={() => setPendingDeleteId(null)} t={t} />}
    </div>
  )
}
