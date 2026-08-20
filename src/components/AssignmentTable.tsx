import type { Assignment } from '../types'
import { Dict } from '../i18n'
import EntityIcon, { entityColor } from './EntityIcon'

interface Props {
  assignments: Assignment[]
  onDelete: (id: string) => void
  t: Dict
}

export default function AssignmentTable({ assignments, onDelete, t }: Props) {
  if (assignments.length === 0) {
    return <p className="text-ink3 text-sm py-8 text-center">{t.noMatches}</p>
  }

  const sorted = [...assignments].sort((a, b) => a.startDay - b.startDay)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink3 font-mono text-xs uppercase tracking-wide border-b border-edge">
            <th className="py-2 pr-3">{t.entityLabel}</th>
            <th className="py-2 pr-3">{t.kindLabel}</th>
            <th className="py-2 pr-3">{t.taskLabel}</th>
            <th className="py-2 pr-3">{t.allocationLabel}</th>
            <th className="py-2 pr-3">{t.startDayLabel}</th>
            <th className="py-2 pr-3">{t.durationLabel}</th>
            <th className="py-2 pr-3 text-right">{t.delete}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr key={a.id} className="border-b border-edge hover:bg-surface2/60 transition-colors">
              <td className="py-2.5 pr-3 font-display font-medium">
                <span className="inline-flex items-center gap-1.5" style={{ color: entityColor(a.kind) }}>
                  <EntityIcon kind={a.kind} size={13} />
                  {a.entityName}
                </span>
              </td>
              <td className="py-2.5 pr-3 text-ink3 text-xs">{a.kind === 'personnel' ? t.personnelLabel : t.resourceEntityLabel}</td>
              <td className="py-2.5 pr-3 text-ink2">{a.taskName}</td>
              <td className="py-2.5 pr-3 font-mono">{a.allocationPercent}%</td>
              <td className="py-2.5 pr-3 font-mono text-ink2">{a.startDay}</td>
              <td className="py-2.5 pr-3 font-mono text-ink2">
                {a.durationDays} {t.days}
              </td>
              <td className="py-2.5 pr-3 text-right">
                <button onClick={() => onDelete(a.id)} className="text-silver-400 hover:text-[#EF4444] text-xs font-mono transition-colors">
                  {t.delete}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
