import type { AllocationResult } from '../types'
import { Dict } from '../i18n'
import EntityIcon from './EntityIcon'

interface Props {
  result: AllocationResult
  t: Dict
}

const W = 720
const H = 280
const PAD_L = 40
const PAD_B = 28
const PAD_T = 12
const PAD_R = 12

// Two shade families instead of one shared palette: personnel entities are
// always some shade of the warm rose used for the personnel icon
// throughout the app, resource entities always some shade of the cool
// teal used for the resource icon, so a glance at the chart already tells
// you people-vs-things before you read a single label.
const PERSONNEL_SHADES = ['#FB7185', '#F472B6', '#FDA4AF']
const RESOURCE_SHADES = ['#2DD4BF', '#5EEAD4', '#0F9C8C']

export default function ResourceLoadChart({ result, t }: Props) {
  const { entities, minDay, maxDay } = result
  if (entities.length === 0) return null

  const maxObservedPercent = Math.max(100, ...entities.flatMap((e) => e.dayLoads.map((d) => d.totalPercent)))
  const yMax = Math.ceil(maxObservedPercent / 20) * 20

  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B

  const x = (day: number) => PAD_L + (maxDay === minDay ? 0 : ((day - minDay) / (maxDay - minDay)) * plotW)
  const y = (percent: number) => PAD_T + plotH - (percent / yMax) * plotH

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * yMax))

  let personnelIdx = 0
  let resourceIdx = 0
  const colorFor = (kind: 'personnel' | 'resource') => {
    if (kind === 'personnel') return PERSONNEL_SHADES[personnelIdx++ % PERSONNEL_SHADES.length]
    return RESOURCE_SHADES[resourceIdx++ % RESOURCE_SHADES.length]
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(tick)} y2={y(tick)} stroke="currentColor" className="text-edge" strokeWidth={1} />
            <text x={PAD_L - 8} y={y(tick) + 3} textAnchor="end" fontSize={9} className="fill-ink3 font-mono">
              {tick}%
            </text>
          </g>
        ))}

        {/* 100% capacity reference line, drawn distinctly so overshoot is obvious */}
        <line x1={PAD_L} x2={W - PAD_R} y1={y(100)} y2={y(100)} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.7} />

        {entities.map((e) => {
          const color = colorFor(e.kind)
          const path = e.dayLoads.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(d.day)} ${y(d.totalPercent)}`).join(' ')
          return <path key={e.entityName} d={path} fill="none" stroke={color} strokeWidth={e.isOverallocated ? 2.5 : 1.75} opacity={e.isOverallocated ? 1 : 0.8} />
        })}

        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const day = Math.round(minDay + f * (maxDay - minDay))
          return (
            <text key={f} x={x(day)} y={H - 8} textAnchor="middle" fontSize={9} className="fill-ink3 font-mono">
              {day}
            </text>
          )
        })}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-xs font-mono">
        <span className="flex items-center gap-1.5" style={{ color: '#EF4444' }}>
          <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: '#EF4444', opacity: 0.7 }} /> {t.chartCapacityLine}
        </span>
        {(() => {
          personnelIdx = 0
          resourceIdx = 0
          return entities.map((e) => {
            const color = colorFor(e.kind)
            return (
              <span key={e.entityName} className="flex items-center gap-1.5" style={{ color }}>
                <EntityIcon kind={e.kind} size={11} />
                {e.entityName}
              </span>
            )
          })
        })()}
      </div>
    </div>
  )
}
