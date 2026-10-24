import { useEffect, useState } from 'react'
import type { Plan, Assignment } from './types'
import { dict, isRtl, Lang } from './i18n'
import { WORKSPACE, purgeLegacyAccounts, deleteAllLocalData } from './utils/account'
import { loadPlans, upsertPlan, deletePlan, newPlan } from './utils/plans'
import { demoPlans } from './utils/demo'
import LegalModal, { type LegalPage } from './components/LegalModal'
import ConfirmDialog from './components/ConfirmDialog'
import PortfolioDashboard from './components/PortfolioDashboard'
import AddPlanModal from './components/AddPlanModal'
import PlanResultScreen from './components/PlanResultScreen'

const THEME_KEY = 'rcp-theme-v1'
const PORTFOLIO_URL = 'https://projektmanagement.nadin.dev'
const accountKey = WORKSPACE

// Runs once per page load, before the first render reads storage.
purgeLegacyAccounts()

function readTheme(): 'night' | 'day' {
  try {
    return (sessionStorage.getItem(THEME_KEY) as 'night' | 'day') ?? 'night'
  } catch {
    return 'night'
  }
}

const LANG_LABEL: Record<Lang, string> = { de: 'DE', en: 'EN', ar: 'AR' }

export default function App() {
  const [lang, setLang] = useState<Lang>('de')
  const t = dict[lang]
  const rtl = isRtl[lang]

  const [theme, setTheme] = useState<'night' | 'day'>(readTheme)
  const [plans, setPlans] = useState<Plan[]>(() => loadPlans(accountKey))
  const [legalPage, setLegalPage] = useState<LegalPage | null>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang, rtl])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      sessionStorage.setItem(THEME_KEY, theme)
    } catch {
      /* private mode */
    }
  }, [theme])

  const activePlan = activePlanId ? plans.find((p) => p.id === activePlanId) ?? null : null

  const handleAddComplete = (assignments: Assignment[], targetPlanId: string | null, pdfName: string | null) => {
    if (targetPlanId) {
      const existing = plans.find((p) => p.id === targetPlanId)
      if (existing) {
        const updated: Plan = {
          ...existing,
          assignments: [...existing.assignments, ...assignments],
          sourcePdfNames: pdfName ? [...existing.sourcePdfNames, pdfName] : existing.sourcePdfNames,
          updatedAt: new Date().toISOString(),
        }
        const next = upsertPlan(accountKey, updated)
        setPlans(next)
        setActivePlanId(updated.id)
      }
    } else {
      const name = pdfName?.replace(/\.pdf$/i, '') || `${t.addPlan} ${new Date().toLocaleDateString()}`
      const plan = newPlan(name, assignments, pdfName ? [pdfName] : [])
      const next = upsertPlan(accountKey, plan)
      setPlans(next)
      setActivePlanId(plan.id)
    }
    setShowAddModal(false)
  }

  const handleSaveResult = (assignments: Assignment[]) => {
    if (!activePlan) return
    const updated: Plan = { ...activePlan, assignments, updatedAt: new Date().toISOString() }
    const next = upsertPlan(accountKey, updated)
    setPlans(next)
  }

  const handleDeletePlan = (id: string) => setPlans(deletePlan(accountKey, id))

  const handleLoadDemo = () => {
    let next = plans
    for (const p of demoPlans()) next = upsertPlan(accountKey, p)
    setPlans(next)
  }

  const handleWipe = () => {
    deleteAllLocalData()
    setPlans([])
    setActivePlanId(null)
    setConfirmWipe(false)
  }

  return (
    <div className="min-h-screen scanlines">
      <header className="max-w-6xl mx-auto px-6 pt-10 pb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Resource &amp; Personnel Planner</h1>
          <a href={PORTFOLIO_URL} className="text-sm text-ink2 underline hover:text-gold-400">
            ← {t.allTools}
          </a>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => setTheme(theme === 'night' ? 'day' : 'night')}
            className="font-mono text-xs border border-fieldEdge rounded-full px-3 py-1.5 text-ink2 hover:border-gold-500 hover:text-gold-400 transition-colors"
          >
            {theme === 'night' ? '☾' : '☀'} {theme === 'night' ? t.night : t.day}
          </button>
          <div className="flex gap-1">
            {(Object.keys(LANG_LABEL) as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`font-mono text-xs border rounded-full px-3 py-1.5 transition-colors ${
                  lang === l ? 'border-gold-500 text-gold-400' : 'border-fieldEdge text-ink3 hover:text-ink hover:border-edge'
                }`}
              >
                {LANG_LABEL[l]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-16">
        {activePlan ? (
          <PlanResultScreen plan={activePlan} allPlans={plans} lang={lang} onSave={handleSaveResult} onBack={() => setActivePlanId(null)} t={t} />
        ) : (
          <PortfolioDashboard plans={plans} onOpen={(id) => setActivePlanId(id)} onAdd={() => setShowAddModal(true)} onDemo={handleLoadDemo} onDelete={handleDeletePlan} t={t} />
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 pb-10 text-sm text-ink2">
        <p className="mb-3">{t.localNote}</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <button className="underline hover:text-gold-400" onClick={() => setLegalPage('imprint')}>{t.imprint}</button>
          <button className="underline hover:text-gold-400" onClick={() => setLegalPage('privacy')}>{t.privacy}</button>
          <button className="underline hover:text-gold-400" onClick={() => setConfirmWipe(true)}>{t.deleteAllData}</button>
          <a className="underline hover:text-gold-400" href={PORTFOLIO_URL}>{t.allTools}</a>
        </nav>
      </footer>

      {legalPage && (
        <LegalModal
          page={legalPage}
          appName="Resource & Personnel Planner"
          localProcessing="Hochgeladene PDFs werden direkt in Ihrem Browser ausgelesen und nicht hochgeladen."
          onClose={() => setLegalPage(null)}
          t={t}
        />
      )}
      {confirmWipe && (
        <ConfirmDialog message={t.confirmDeleteAll} danger onConfirm={handleWipe} onCancel={() => setConfirmWipe(false)} t={t} />
      )}

      {showAddModal && <AddPlanModal plans={plans} onClose={() => setShowAddModal(false)} onComplete={handleAddComplete} t={t} />}
    </div>
  )
}
