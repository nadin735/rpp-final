import type { AllocationResult } from '../types'
import { findAvailability } from '../utils/availability'
import { Dict } from '../i18n'
import EntityIcon, { entityColor } from './EntityIcon'

interface Props {
  result: AllocationResult
  t: Dict
}

export default function AvailabilityPanel({ result, t }: Props) {
  const entries = findAvailability(result).slice(0, 8)

  return (
    <div className="border border-edge bg-surface2 rounded-lg p-5 mb-6">
      <h3 className="font-display font-semibold text-ink mb-1">{t.availabilityTitle}</h3>
      <p className="text-xs text-ink3 mb-4 max-w-2xl leading-relaxed">{t.availabilityHint}</p>

      {entries.length === 0 ? (
        <p className="text-sm text-ink2">{t.availabilityNone}</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.entityName} className="flex items-center gap-3 text-sm">
              <EntityIcon kind={e.kind} className="shrink-0" />
              <span className="w-28 shrink-0 font-mono truncate" style={{ color: entityColor(e.kind) }}>
                {e.entityName}
              </span>
              <div className="flex-1 h-2 bg-field rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#34D399]" style={{ width: `${e.headroomPercent}%` }} />
              </div>
              <span className="w-24 shrink-0 text-right text-xs font-mono text-ink2">
                {e.headroomPercent}% {t.availabilityHeadroom}
              </span>
              <span className="w-20 shrink-0 text-right text-[11px] font-mono text-ink3">
                {e.freeDays} {t.availabilityFreeDays}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
