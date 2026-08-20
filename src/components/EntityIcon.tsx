import type { EntityKind } from '../types'

export const PERSONNEL_COLOR = '#FB7185'
export const RESOURCE_COLOR = '#2DD4BF'

export function entityColor(kind: EntityKind) {
  return kind === 'personnel' ? PERSONNEL_COLOR : RESOURCE_COLOR
}

interface Props {
  kind: EntityKind
  size?: number
  className?: string
}

// A real silhouette instead of a text character (☺ / □), small enough to
// sit inline with a name but still immediately readable as "a person" or
// "a thing" even before the color registers.
export default function EntityIcon({ kind, size = 14, className }: Props) {
  const color = entityColor(kind)
  if (kind === 'personnel') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="7.5" r="4" fill={color} opacity={0.9} />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" fill={color} opacity={0.55} />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3.5 7.5 12 3l8.5 4.5-8.5 4.5-8.5-4.5Z" fill={color} opacity={0.55} />
      <path d="M3.5 7.5v9L12 21l8.5-4.5v-9" stroke={color} strokeWidth="1.6" strokeLinejoin="round" opacity={0.9} />
      <path d="M12 12v9" stroke={color} strokeWidth="1.6" opacity={0.9} />
    </svg>
  )
}
