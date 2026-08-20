import * as pdfjsLib from 'pdfjs-dist'
// @ts-ignore - Vite-specific asset URL import for the pdf.js worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { EntityKind } from '../types'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

// pdf.js prints an internal "Setting up fake worker" notice whenever it
// falls back to processing a PDF on the main thread instead of a
// background worker. This is a known, harmless pdf.js behavior, not an
// error and not something this app's own code produces, PDF scanning
// still works correctly either way. It is filtered here purely so it
// doesn't show up as an alarming-looking line in the browser console.
const originalWarn = console.warn
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Setting up fake worker')) return
  originalWarn(...args)
}

export async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    // Group text items by their y-position rather than naively joining
    // everything on the page into one line, otherwise multi-row documents
    // collapse into a single unparseable block of text.
    let lastY: number | null = null
    let line = ''
    for (const item of content.items as { str: string; transform: number[] }[]) {
      const y = item.transform ? item.transform[5] : null
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
        text += line.trim() + '\n'
        line = ''
      }
      line += item.str + ' '
      lastY = y
    }
    text += line.trim() + '\n'
  }
  return text
}

export interface ParsedAssignmentRow {
  id: string
  entityName: string
  kind: EntityKind
  taskName: string
  allocationPercent: number
  startDay: number
  durationDays: number
  ratePerDay?: number
  rawLine: string
}

// Expected format per line, five fields required, a sixth (day rate) optional:
// Entity; Task; Allocation%; Start day; Duration [; Rate per day]
// e.g. "Nadin Okil; Website Design; 60; 1; 15" or with a rate: "...; 15; 450"
// `kind` is passed in by the caller rather than parsed from the text,
// because a whole sheet is either a personnel sheet or a resource sheet,
// not a per-row distinction.
export function parseAssignmentLines(rawText: string, kind: EntityKind): ParsedAssignmentRow[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const rows: ParsedAssignmentRow[] = []
  const pattern6 =
    /^(.{2,60}?)\s*[;|\t]\s*(.{2,60}?)\s*[;|\t]\s*(\d{1,3})\s*%?\s*[;|\t]\s*(\d{1,4})\s*[;|\t]\s*(\d{1,4})\s*[;|\t]\s*(\d{1,6})\s*$/
  const pattern5 =
    /^(.{2,60}?)\s*[;|\t]\s*(.{2,60}?)\s*[;|\t]\s*(\d{1,3})\s*%?\s*[;|\t]\s*(\d{1,4})\s*[;|\t]\s*(\d{1,4})\s*$/

  let i = 0
  for (const line of lines) {
    let entityName = '',
      taskName = '',
      allocationPercent = 0,
      startDay = 0,
      durationDays = 0,
      ratePerDay: number | undefined

    const m6 = line.match(pattern6)
    if (m6) {
      entityName = m6[1].trim()
      taskName = m6[2].trim()
      allocationPercent = parseInt(m6[3], 10)
      startDay = parseInt(m6[4], 10)
      durationDays = Math.max(1, parseInt(m6[5], 10))
      ratePerDay = parseInt(m6[6], 10)
    } else {
      const m5 = line.match(pattern5)
      if (!m5) continue
      entityName = m5[1].trim()
      taskName = m5[2].trim()
      allocationPercent = parseInt(m5[3], 10)
      startDay = parseInt(m5[4], 10)
      durationDays = Math.max(1, parseInt(m5[5], 10))
    }

    if (!entityName || !taskName) continue
    if (allocationPercent <= 0 || allocationPercent > 100) continue
    if (/^(resource|entity|employee|personnel|name|ressource|mitarbeiter|مورد|موظف)$/i.test(entityName)) continue

    rows.push({ id: `scan-${i}`, entityName, kind, taskName, allocationPercent, startDay, durationDays, ratePerDay, rawLine: line })
    i++
  }
  return rows
}
