import type { CrossPlanConflict } from '../types'
import { Dict } from '../i18n'
import EntityIcon from './EntityIcon'

interface Props {
  conflicts: CrossPlanConflict[]
  t: Dict
}

export default function CrossPlanConflicts({ conflicts, t }: Props) {
  return (
    <div className="border border-edge bg-surface2 rounded-lg p-5 mb-6">
      <h3 className="font-display font-semibold text-ink mb-1">{t.crossPlanTitle}</h3>
      <p className="text-xs text-ink3 mb-4 max-w-2xl leading-relaxed">{t.crossPlanHint}</p>

      {conflicts.length === 0 ? (
        <p className="text-sm text-ink2">{t.crossPlanNone}</p>
      ) : (
        <div className="space-y-2">
          {conflicts.map((c) => (
            <div key={c.entityName} className="flex items-center gap-3 border border-[#EF444455] bg-[#EF444415] rounded-md px-3 py-2.5 text-sm">
              <EntityIcon kind={c.kind} size={15} className="shrink-0" />
              <span className="text-ink">
                <strong className="font-display">{c.entityName}</strong> {t.crossPlanConflictLine}{' '}
                <strong className="font-mono" style={{ color: '#EF4444' }}>
                  {c.combinedPercent}%
                </strong>{' '}
                {t.crossPlanConflictLineEnd} <strong className="font-display">{c.planNames.join(', ')}</strong>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
