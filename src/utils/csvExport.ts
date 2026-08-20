import type { Assignment, AllocationResult } from '../types'

function csvCell(value: string | number): string {
  const str = String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportAssignmentsAsCsv(planName: string, assignments: Assignment[], result: AllocationResult | null) {
  const headers = ['Entity', 'Kind', 'Task', 'Allocation %', 'Start Day', 'Duration (days)', 'Rate/day', 'Cost', 'Peak load on entity (%)', 'Entity overallocated']
  const summaryByEntity = new Map(result?.entities.map((e) => [e.entityName, e]) ?? [])

  const rows = assignments.map((a) => {
    const summary = summaryByEntity.get(a.entityName)
    const cost = a.ratePerDay ? Math.round(a.ratePerDay * (a.allocationPercent / 100) * a.durationDays) : ''
    return [
      a.entityName,
      a.kind,
      a.taskName,
      a.allocationPercent,
      a.startDay,
      a.durationDays,
      a.ratePerDay ?? '',
      cost,
      summary?.peakPercent ?? '',
      summary?.isOverallocated ? 'yes' : 'no',
    ]
  })

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${planName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-assignments.csv`
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
