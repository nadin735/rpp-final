import { useMemo, useState } from 'react'
import type { Plan } from '../types'
import { computeAllocation } from '../utils/allocation'
import { findCrossPlanConflicts } from '../utils/crossPlanConflicts'
import { computeSeverity, SEVERITY_COLOR } from '../utils/recommend'
import { Dict } from '../i18n'
import ConfirmDialog from './ConfirmDialog'
import CrossPlanConflicts from './CrossPlanConflicts'
import EntityIcon from './EntityIcon'

interface Props {
  plans: Plan[]
  onOpen: (id: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  t: Dict
}

type SortKey = 'name' | 'overallocated' | 'utilization' | 'entities' | 'updated'
type SortDir = 'asc' | 'desc'

function Sparkline({ result }: { result: ReturnType<typeof computeAllocation> }) {
  if (!result || result.entities.length === 0) return <span className="text-ink3 text-xs">—</span>
  const points = result.entities.map((e) => e.peakPercent).sort((a, b) => a - b)
  const max = Math.max(...points, 100)
  const w = 70
  const h = 24
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / Math.max(points.length - 1, 1)) * w} ${h - (p / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <line x1={0} x2={w} y1={h - (100 / max) * h} y2={h - (100 / max) * h} stroke="currentColor" className="text-ink3" strokeWidth={0.5} strokeDasharray="2 2" />
      <path d={path} fill="none" stroke="currentColor" className="text-gold-500" strokeWidth={1.5} />
    </svg>
  )
}

function SortHeader({ label, active, dir, onClick }: { label: string; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1 hover:text-ink transition-colors ${active ? 'text-gold-400' : ''}`}>
      {label}
      {active && <span className="text-[9px]">{dir === 'asc' ? '▲' : '▼'}</span>}
    </button>
  )
}

export function StatusBadge({ result, t }: { result: ReturnType<typeof computeAllocation>; t: Dict }) {
  const severity = computeSeverity(result) ?? 'healthy'
  const label = severity === 'critical' ? t.severityCritical : severity === 'watch' ? t.severityWatch : t.severityHealthy
  const color = SEVERITY_COLOR[severity]
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono w-fit" style={{ backgroundColor: `${color}22`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

export default function PortfolioDashboard({ plans, onOpen, onAdd, onDelete, t }: Props) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('updated')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const totalAssignments = plans.reduce((sum, p) => sum + p.assignments.length, 0)
  const crossPlanConflicts = useMemo(() => findCrossPlanConflicts(plans), [plans])

  const enriched = useMemo(
    () =>
      plans.map((p) => {
        const result = computeAllocation(p.assignments)
        return { plan: p, result, overallocatedCount: result?.overallocatedEntityCount ?? 0 }
      }),
    [plans],
  )

  const filtered = useMemo(() => enriched.filter((e) => e.plan.name.toLowerCase().includes(query.trim().toLowerCase())), [enriched, query])

  const sorted = useMemo(() => {
    const dirMul = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.plan.name.localeCompare(b.plan.name) * dirMul
        case 'overallocated':
          return (a.overallocatedCount - b.overallocatedCount) * dirMul
        case 'utilization':
          return ((a.result?.averageUtilization ?? 0) - (b.result?.averageUtilization ?? 0)) * dirMul
        case 'entities':
          return ((a.result?.totalEntities ?? 0) - (b.result?.totalEntities ?? 0)) * dirMul
        default:
          return a.plan.updatedAt.localeCompare(b.plan.updatedAt) * dirMul
      }
    })
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
        <div>
          <p className="text-xs font-mono text-ink3 uppercase tracking-wide">{t.title}</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">{t.portfolioTitle}</h2>
        </div>
        {plans.length > 0 && (
          <div className="flex gap-8 text-right">
            <div>
              <p className="text-[10px] font-mono text-ink3 uppercase tracking-wide">{t.totalPlans}</p>
              <p className="font-mono text-lg text-ink">{plans.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-ink3 uppercase tracking-wide">{t.totalAssignments}</p>
              <p className="font-mono text-lg text-ink">{totalAssignments}</p>
            </div>
          </div>
        )}
      </div>
      <div className="h-px bg-gold-500 mb-6" />

      {plans.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gold-500 text-3xl mb-3">▤</div>
          <p className="font-display text-lg font-semibold text-ink mb-2">{t.portfolioEmpty}</p>
          <p className="text-sm text-ink3 max-w-md mx-auto mb-6">{t.portfolioEmptyHint}</p>
          <button onClick={onAdd} className="px-5 py-2.5 text-sm font-mono bg-gold-500 text-inkOnGold rounded hover:bg-gold-400 font-semibold">
            {t.addPlan}
          </button>
        </div>
      ) : (
        <div>
          {plans.length > 1 && <CrossPlanConflicts conflicts={crossPlanConflicts} t={t} />}

          {plans.length > 3 && (
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlans}
              className="w-full sm:w-72 mb-3 bg-field border border-fieldEdge rounded px-3 py-2 text-sm text-ink"
            />
          )}

          <div className="border border-edge rounded-lg overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2.5 border-b border-edge text-[10px] font-mono uppercase tracking-wide text-ink3">
              <SortHeader label={t.colPlan} active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')} />
              <span>{t.colStatus}</span>
              <SortHeader label={t.colOverallocated} active={sortKey === 'overallocated'} dir={sortDir} onClick={() => toggleSort('overallocated')} />
              <SortHeader label={t.statUtilization} active={sortKey === 'utilization'} dir={sortDir} onClick={() => toggleSort('utilization')} />
              <SortHeader label={t.colEntities} active={sortKey === 'entities'} dir={sortDir} onClick={() => toggleSort('entities')} />
              <span>{t.colTrend}</span>
              <span />
            </div>

            {sorted.length === 0 && <p className="text-sm text-ink3 text-center py-8">{t.noSearchResults}</p>}

            {sorted.map(({ plan: p, result, overallocatedCount }) => (
              <div
                key={p.id}
                onClick={() => onOpen(p.id)}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-3.5 border-b border-edge items-center cursor-pointer hover:bg-surface2/60 transition-colors"
              >
                <span className="font-display font-medium text-ink truncate">{p.name}</span>
                <StatusBadge result={result} t={t} />
                <span className="font-mono text-sm text-ink">
                  {overallocatedCount}/{result?.totalEntities ?? 0}
                </span>
                <span className="font-mono text-sm text-ink">{result ? `${result.averageUtilization}%` : '—'}</span>
                <span className="font-mono text-sm text-ink flex items-center gap-3">
                  <span className="inline-flex items-center gap-1" style={{ color: '#FB7185' }}>
                    <EntityIcon kind="personnel" size={12} /> {result?.personnelCount ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1" style={{ color: '#2DD4BF' }}>
                    <EntityIcon kind="resource" size={12} /> {result?.resourceCount ?? 0}
                  </span>
                </span>
                <Sparkline result={result} />
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPendingDeleteId(p.id)
                    }}
                    className="text-ink3 hover:text-[#EF4444] transition-colors p-1 -m-1 rounded"
                    aria-label={t.delete}
                    title={t.delete}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 6h18" strokeLinecap="round" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M19 6l-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
                    </svg>
                  </button>
                  <span className="text-ink3">›</span>
                </div>
              </div>
            ))}
            <button onClick={onAdd} className="w-full px-4 py-3 text-sm font-mono text-ink2 hover:text-gold-400 border-t border-dashed border-fieldEdge">
              + {t.addPlan}
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-[11px] text-ink3 mt-10">{t.madeBy}</p>

      {pendingDeleteId && (
        <ConfirmDialog
          message={t.confirmDeletePlan}
          danger
          onConfirm={() => {
            onDelete(pendingDeleteId)
            setPendingDeleteId(null)
          }}
          onCancel={() => setPendingDeleteId(null)}
          t={t}
        />
      )}
    </div>
  )
}
