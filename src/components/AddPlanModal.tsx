import { useRef, useState } from 'react'
import type { Plan, Assignment, EntityKind } from '../types'
import { extractPdfText, parseAssignmentLines, ParsedAssignmentRow } from '../utils/pdfParser'
import { Dict } from '../i18n'
import EntityIcon from './EntityIcon'

interface Props {
  plans: Plan[]
  initialTargetId?: string
  onClose: () => void
  onComplete: (assignments: Assignment[], targetPlanId: string | null, pdfName: string | null) => void
  t: Dict
}

interface EditableRow extends ParsedAssignmentRow {
  include: boolean
}

type Step = 'target' | 'kind' | 'method' | 'scanning' | 'review' | 'manual'

export default function AddPlanModal({ plans, initialTargetId, onClose, onComplete, t }: Props) {
  const [step, setStep] = useState<Step>(initialTargetId ? 'kind' : plans.length > 0 ? 'target' : 'kind')
  const [targetId, setTargetId] = useState<string>(initialTargetId ?? 'new')
  const [kind, setKind] = useState<EntityKind>('personnel')
  const [readError, setReadError] = useState(false)
  const [rows, setRows] = useState<EditableRow[] | null>(null)
  const [pdfName, setPdfName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // manual entry draft
  const [manualRows, setManualRows] = useState<Assignment[]>([])
  const [mEntity, setMEntity] = useState('')
  const [mTask, setMTask] = useState('')
  const [mAllocation, setMAllocation] = useState(50)
  const [mStartDay, setMStartDay] = useState(1)
  const [mDuration, setMDuration] = useState(5)
  const [mRate, setMRate] = useState('')

  const handleFile = async (file: File) => {
    setStep('scanning')
    setReadError(false)
    setPdfName(file.name)
    try {
      const text = await extractPdfText(file)
      const parsed = parseAssignmentLines(text, kind)
      setRows(parsed.map((p) => ({ ...p, include: true })))
      setStep('review')
    } catch {
      setReadError(true)
      setRows([])
      setStep('review')
    }
  }

  const updateRow = (id: string, patch: Partial<EditableRow>) => {
    setRows((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, ...patch } : r)) : prev))
  }

  const confirmImport = () => {
    if (!rows) return
    const included = rows.filter((r) => r.include)
    const assignments: Assignment[] = included.map((r) => ({
      id: crypto.randomUUID(),
      entityName: r.entityName,
      kind: r.kind,
      taskName: r.taskName,
      allocationPercent: r.allocationPercent,
      startDay: r.startDay,
      durationDays: r.durationDays,
      ratePerDay: r.ratePerDay,
    }))
    onComplete(assignments, targetId === 'new' ? null : targetId, pdfName)
  }

  const addManualRow = () => {
    if (!mEntity.trim() || !mTask.trim()) return
    const rate = mRate.trim() ? Number(mRate) : undefined
    setManualRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        entityName: mEntity.trim(),
        kind,
        taskName: mTask.trim(),
        allocationPercent: Math.min(100, Math.max(1, mAllocation)),
        startDay: Math.max(1, mStartDay),
        durationDays: Math.max(1, mDuration),
        ratePerDay: rate,
      },
    ])
    setMTask('')
  }

  const removeManualRow = (id: string) => setManualRows((prev) => prev.filter((x) => x.id !== id))

  const confirmManual = () => onComplete(manualRows, targetId === 'new' ? null : targetId, null)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface2 border border-edge rounded-xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold text-ink">{t.addModalTitle}</h2>
          <button onClick={onClose} className="text-ink3 hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>

        {step === 'target' && (
          <div>
            <label className="block mb-6">
              <span className="text-xs font-mono text-ink2 uppercase tracking-wide">{t.whichPlan}</span>
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full mt-1 bg-field border border-fieldEdge rounded px-3 py-2 text-sm text-ink">
                <option value="new">{t.createNew}</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-mono text-ink2 hover:text-ink">
                {t.cancel}
              </button>
              <button onClick={() => setStep('kind')} className="px-4 py-2 text-sm font-mono bg-gold-500 text-inkOnGold rounded hover:bg-gold-400 font-semibold">
                {t.continueLabel}
              </button>
            </div>
          </div>
        )}

        {step === 'kind' && (
          <div>
            <p className="text-xs font-mono text-ink2 uppercase tracking-wide mb-3">{t.whichSheet}</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setKind('personnel')}
                className={`text-left border rounded-lg p-4 transition-colors ${kind === 'personnel' ? 'border-[#FB7185] bg-[#FB718515]' : 'border-fieldEdge hover:border-edge'}`}
              >
                <EntityIcon kind="personnel" size={20} className="mb-2" />
                <span className="block font-display font-semibold text-ink mb-1">{t.personnelSheet}</span>
                <span className="text-xs text-ink3 leading-relaxed">{t.personnelSheetHint}</span>
              </button>
              <button
                onClick={() => setKind('resource')}
                className={`text-left border rounded-lg p-4 transition-colors ${kind === 'resource' ? 'border-[#2DD4BF] bg-[#2DD4BF15]' : 'border-fieldEdge hover:border-edge'}`}
              >
                <EntityIcon kind="resource" size={20} className="mb-2" />
                <span className="block font-display font-semibold text-ink mb-1">{t.resourceSheet}</span>
                <span className="text-xs text-ink3 leading-relaxed">{t.resourceSheetHint}</span>
              </button>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => (initialTargetId ? onClose() : setStep(plans.length > 0 ? 'target' : 'kind'))}
                className="px-4 py-2 text-sm font-mono border border-fieldEdge rounded text-ink2 hover:text-ink"
              >
                {t.back}
              </button>
              <button onClick={() => setStep('method')} className="px-4 py-2 text-sm font-mono bg-gold-500 text-inkOnGold rounded hover:bg-gold-400 font-semibold">
                {t.continueLabel}
              </button>
            </div>
          </div>
        )}

        {step === 'method' && (
          <div>
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full border-2 border-dashed border-gold-500/50 rounded-lg py-10 flex flex-col items-center gap-3 hover:border-gold-500 transition-colors"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gold-400" strokeWidth="1.8">
                <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-gold-400 font-medium text-sm">
                {t.choosePdf} ({kind === 'personnel' ? t.personnelSheet : t.resourceSheet})
              </span>
              <span className="text-ink3 text-xs">{kind === 'personnel' ? t.choosePdfHintPersonnel : t.choosePdfHintResource}</span>
            </button>
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />

            <button onClick={() => setStep('manual')} className="text-xs font-mono text-ink2 hover:text-gold-400 mt-4">
              {t.enterManually}
            </button>

            <div className="flex justify-end mt-6">
              <button onClick={() => setStep('kind')} className="px-4 py-2 text-sm font-mono border border-fieldEdge rounded text-ink2 hover:text-ink">
                {t.back}
              </button>
            </div>
          </div>
        )}

        {step === 'scanning' && (
          <div className="py-10 flex items-center justify-center gap-3">
            <span className="inline-block w-5 h-5 rounded-full border-2 border-gold-500 border-t-transparent animate-spin" />
            <span className="text-ink2 text-sm">{t.analyzing}</span>
          </div>
        )}

        {step === 'review' && rows && rows.length === 0 && (
          <div>
            <p className="text-sm text-ink2 py-4">{readError ? t.pdfReadError : t.noMatches}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setStep('method')} className="px-4 py-2 text-sm font-mono text-ink2 hover:text-ink">
                {t.back}
              </button>
            </div>
          </div>
        )}

        {step === 'review' && rows && rows.length > 0 && (
          <div>
            <p className="text-xs text-ink2 mb-3 flex items-center gap-1.5">
              <span className="text-gold-400">▤</span> {rows.length} {t.itemsDetected}
            </p>
            <div className="max-h-72 overflow-y-auto space-y-2 mb-4">
              {rows.map((r) => (
                <div key={r.id} className="border border-edge rounded-md p-2.5 flex items-start gap-2.5">
                  <input type="checkbox" checked={r.include} onChange={(e) => updateRow(r.id, { include: e.target.checked })} className="mt-1.5 accent-gold-500" />
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-1.5">
                    <input
                      value={r.entityName}
                      onChange={(e) => updateRow(r.id, { entityName: e.target.value })}
                      className="col-span-2 bg-field border border-fieldEdge rounded px-2 py-1 text-sm text-ink font-medium"
                    />
                    <input
                      value={r.taskName}
                      onChange={(e) => updateRow(r.id, { taskName: e.target.value })}
                      className="col-span-2 bg-field border border-fieldEdge rounded px-2 py-1 text-xs text-ink2"
                    />
                    <label className="text-[11px] text-ink3 flex items-center gap-1">
                      {t.allocationLabel}
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={r.allocationPercent}
                        onChange={(e) => updateRow(r.id, { allocationPercent: Math.min(100, Math.max(1, Number(e.target.value))) })}
                        className="w-14 bg-field border border-fieldEdge rounded px-1.5 py-0.5 text-ink"
                      />
                      %
                    </label>
                    <label className="text-[11px] text-ink3 flex items-center gap-1">
                      {t.startDayLabel}
                      <input
                        type="number"
                        min={1}
                        value={r.startDay}
                        onChange={(e) => updateRow(r.id, { startDay: Math.max(1, Number(e.target.value)) })}
                        className="w-14 bg-field border border-fieldEdge rounded px-1.5 py-0.5 text-ink"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-mono text-ink2 hover:text-ink">
                {t.cancel}
              </button>
              <button onClick={confirmImport} className="px-4 py-2 text-sm font-mono bg-gold-500 text-inkOnGold rounded hover:bg-gold-400 font-semibold">
                {t.import}
              </button>
            </div>
          </div>
        )}

        {step === 'manual' && (
          <div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                value={mEntity}
                onChange={(e) => setMEntity(e.target.value)}
                placeholder={kind === 'personnel' ? t.personnelLabel : t.resourceEntityLabel}
                className="bg-field border border-fieldEdge rounded px-3 py-2 text-sm text-ink"
              />
              <input value={mTask} onChange={(e) => setMTask(e.target.value)} placeholder={t.taskLabel} className="bg-field border border-fieldEdge rounded px-3 py-2 text-sm text-ink" />
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              <label className="text-[11px] text-ink3">
                {t.allocationLabel} (%)
                <input type="number" min={1} max={100} value={mAllocation} onChange={(e) => setMAllocation(Number(e.target.value))} className="w-full mt-1 bg-field border border-fieldEdge rounded px-2 py-1.5 text-sm text-ink" />
              </label>
              <label className="text-[11px] text-ink3">
                {t.startDayLabel}
                <input type="number" min={1} value={mStartDay} onChange={(e) => setMStartDay(Number(e.target.value))} className="w-full mt-1 bg-field border border-fieldEdge rounded px-2 py-1.5 text-sm text-ink" />
              </label>
              <label className="text-[11px] text-ink3">
                {t.durationLabel}
                <input type="number" min={1} value={mDuration} onChange={(e) => setMDuration(Number(e.target.value))} className="w-full mt-1 bg-field border border-fieldEdge rounded px-2 py-1.5 text-sm text-ink" />
              </label>
              <label className="text-[11px] text-ink3">
                {t.rateLabel}
                <input type="number" min={0} value={mRate} onChange={(e) => setMRate(e.target.value)} placeholder="—" className="w-full mt-1 bg-field border border-fieldEdge rounded px-2 py-1.5 text-sm text-ink" />
              </label>
            </div>

            <button onClick={addManualRow} className="px-3 py-2 text-sm font-mono border border-fieldEdge rounded text-ink2 hover:text-gold-400 hover:border-gold-500 mb-4">
              + {t.addAssignment}
            </button>

            {manualRows.length > 0 && (
              <div className="mb-4 space-y-1.5">
                {manualRows.map((mr) => (
                  <div key={mr.id} className="flex items-center justify-between gap-3 text-sm border border-edge rounded px-3 py-1.5">
                    <div className="min-w-0">
                      <span className="text-ink">{mr.entityName}</span>
                      <span className="block text-[11px] text-ink3 truncate">
                        {mr.taskName} · {mr.allocationPercent}% · {t.startDayLabel} {mr.startDay}
                        {mr.ratePerDay ? ` · ${mr.ratePerDay}/${t.days.slice(0, -1)}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-ink3 font-mono text-xs">
                        {mr.durationDays} {t.days}
                      </span>
                      <button onClick={() => removeManualRow(mr.id)} className="text-ink3 hover:text-ink text-xs font-mono">
                        {t.delete}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setStep('method')} className="px-4 py-2 text-sm font-mono text-ink2 hover:text-ink">
                {t.back}
              </button>
              <button
                onClick={confirmManual}
                disabled={manualRows.length === 0}
                className="px-4 py-2 text-sm font-mono bg-gold-500 text-inkOnGold rounded hover:bg-gold-400 font-semibold disabled:opacity-30"
              >
                {t.import}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
