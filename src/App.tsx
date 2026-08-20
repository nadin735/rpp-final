import { useEffect, useState } from 'react'
import type { Plan, Assignment } from './types'
import { dict, isRtl, Lang } from './i18n'
import { getSession, getAccountDisplayName, logout } from './utils/account'
import { loadPlans, upsertPlan, deletePlan, newPlan } from './utils/plans'
import LoginScreen from './components/LoginScreen'
import PortfolioDashboard from './components/PortfolioDashboard'
import AddPlanModal from './components/AddPlanModal'
import PlanResultScreen from './components/PlanResultScreen'

const THEME_KEY = 'rcp-theme-v1'
const LANG_LABEL: Record<Lang, string> = { de: 'DE', en: 'EN', ar: 'AR' }

export default function App() {
  const [lang, setLang] = useState<Lang>('de')
  const t = dict[lang]
  const rtl = isRtl[lang]

  const [theme, setTheme] = useState<'night' | 'day'>(() => (localStorage.getItem(THEME_KEY) as 'night' | 'day') ?? 'night')
  const [accountKey, setAccountKey] = useState<string | null>(() => getSession())
  const [plans, setPlans] = useState<Plan[]>(() => {
    const session = getSession()
    return session ? loadPlans(session) : []
  })
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang, rtl])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  if (!accountKey) {
    return (
      <LoginScreen
        t={t}
        onLogin={(key) => {
          setAccountKey(key)
          setPlans(loadPlans(key))
          setActivePlanId(null)
        }}
      />
    )
  }

  const displayName = getAccountDisplayName(accountKey)
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

  return (
    <div className="min-h-screen scanlines">
      <header className="max-w-6xl mx-auto px-6 pt-10 pb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full border border-gold-500 bg-field px-2 py-1 text-[11px] font-mono text-ink2">{displayName}</span>
          <span
            className="text-[11px] font-mono text-ink3 underline cursor-pointer hover:text-gold-400"
            onClick={() => {
              logout()
              setAccountKey(null)
            }}
          >
            {t.logout}
          </span>
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
          <PortfolioDashboard plans={plans} onOpen={(id) => setActivePlanId(id)} onAdd={() => setShowAddModal(true)} onDelete={handleDeletePlan} t={t} />
        )}
      </main>

      {showAddModal && <AddPlanModal plans={plans} onClose={() => setShowAddModal(false)} onComplete={handleAddComplete} t={t} />}
    </div>
  )
}
