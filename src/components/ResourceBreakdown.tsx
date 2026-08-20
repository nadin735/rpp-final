import type { AllocationResult } from '../types'
import { Dict } from '../i18n'
import EntityIcon, { entityColor } from './EntityIcon'

interface Props {
  result: AllocationResult
  t: Dict
}

export default function ResourceBreakdown({ result, t }: Props) {
  const sorted = [...result.entities].sort((a, b) => b.peakPercent - a.peakPercent)

  return (
    <div className="border border-edge bg-surface2 rounded-lg p-5 mb-6">
      <h3 className="font-display font-semibold text-ink mb-4">{t.breakdownTitle}</h3>
      <div className="space-y-3">
        {sorted.map((e) => {
          // The bar itself stays risk-colored (that's the actionable
          // signal), while the icon and name carry the personnel/resource
          // color, two separate, deliberately non-overlapping signals:
          // who or what this is, and how much trouble it's in.
          const barColor = e.isOverallocated ? '#EF4444' : e.averagePercent >= 85 ? '#F59E0B' : '#2DD4BF'
          const widthPercent = Math.min(100, e.peakPercent)
          return (
            <div key={e.entityName} className="flex items-center gap-3">
              <EntityIcon kind={e.kind} className="shrink-0" />
              <span className="w-28 shrink-0 text-sm font-mono truncate" style={{ color: entityColor(e.kind) }}>
                {e.entityName}
              </span>
              <div className="flex-1 h-2.5 bg-field rounded-full overflow-hidden relative">
                <div className="h-full rounded-full" style={{ width: `${widthPercent}%`, backgroundColor: barColor }} />
                {e.peakPercent > 100 && <div className="absolute top-0 h-full w-0.5 bg-ink" style={{ left: '100%' }} />}
              </div>
              <span className="w-16 shrink-0 text-right text-xs font-mono text-ink2">
                {t.peakLabel} {e.peakPercent}%
              </span>
              <span className="w-14 shrink-0 text-right text-xs font-mono text-ink3">
                {t.avgLabel} {e.averagePercent}%
              </span>
              {e.overallocatedDays > 0 && (
                <span className="shrink-0 text-[11px] font-mono" style={{ color: '#EF4444' }}>
                  {e.overallocatedDays} {t.overDays}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-edge text-[11px] font-mono text-ink3">
        <span className="flex items-center gap-1.5">
          <EntityIcon kind="personnel" size={12} /> {t.personnelLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <EntityIcon kind="resource" size={12} /> {t.resourceEntityLabel}
        </span>
      </div>
    </div>
  )
}
