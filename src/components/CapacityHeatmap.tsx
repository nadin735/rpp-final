import type { AllocationResult } from '../types'
import { Dict } from '../i18n'
import EntityIcon, { entityColor } from './EntityIcon'

interface Props {
  result: AllocationResult
  t: Dict
}

// Continuous color from empty through teal (light load) to amber (near
// capacity) to solid red (over capacity), the classic heatmap "temperature"
// people expect from a resource calendar, distinct from the line-chart
// timeline in the tool above it, and from anything the scheduling tool
// shows since a Gantt-style critical path has no equivalent concept.
function cellColor(percent: number): string {
  if (percent === 0) return 'transparent'
  if (percent > 100) return '#EF4444'
  if (percent >= 85) return '#F59E0B'
  const t = Math.min(1, percent / 85)
  // interpolate from a faint teal to a fuller teal as load rises
  const alpha = 0.18 + t * 0.62
  return `rgba(45, 212, 191, ${alpha.toFixed(2)})`
}

export default function CapacityHeatmap({ result, t }: Props) {
  const { entities, minDay, maxDay } = result
  if (entities.length === 0) return null
  const sorted = [...entities].sort((a, b) => b.peakPercent - a.peakPercent)
  const days = Array.from({ length: maxDay - minDay + 1 }, (_, i) => minDay + i)

  return (
    <div className="border border-edge bg-surface2 rounded-lg p-5 mb-6">
      <h3 className="font-display font-semibold text-ink mb-1">{t.heatmapTitle}</h3>
      <p className="text-xs text-ink3 mb-4 max-w-2xl leading-relaxed">{t.heatmapHint}</p>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex gap-[3px] mb-1 pl-32">
            {days.map((d) => (
              <div key={d} className="w-[18px] shrink-0 text-center text-[9px] font-mono text-ink3">
                {(d - minDay) % 5 === 0 ? d : ''}
              </div>
            ))}
          </div>
          {sorted.map((e) => (
            <div key={e.entityName} className="flex items-center gap-[3px] mb-[3px]">
              <div className="w-32 shrink-0 flex items-center gap-1.5 pr-2">
                <EntityIcon kind={e.kind} size={12} />
                <span className="text-xs font-mono truncate" style={{ color: entityColor(e.kind) }}>
                  {e.entityName}
                </span>
              </div>
              {days.map((d) => {
                const load = e.dayLoads.find((dl) => dl.day === d)
                const percent = load?.totalPercent ?? 0
                return (
                  <div
                    key={d}
                    title={`${e.entityName} · ${t.days === 'days' ? 'day' : t.days.slice(0, -1)} ${d}: ${percent}%`}
                    className="w-[18px] h-[18px] shrink-0 rounded-sm border border-edge"
                    style={{ backgroundColor: cellColor(percent) }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-edge text-[11px] font-mono text-ink3">
        <span>{t.heatmapLegendLow}</span>
        <span className="flex gap-[3px]">
          {[0, 25, 50, 75, 100, 130].map((p) => (
            <span key={p} className="w-[14px] h-[14px] rounded-sm border border-edge" style={{ backgroundColor: cellColor(p) }} />
          ))}
        </span>
        <span>{t.heatmapLegendHigh}</span>
      </div>
    </div>
  )
}
