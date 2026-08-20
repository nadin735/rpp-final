import type { AllocationResult } from '../types'
import type { Dict } from '../i18n'

export type Severity = 'healthy' | 'watch' | 'critical'

export const SEVERITY_COLOR: Record<Severity, string> = {
  healthy: '#34D399',
  watch: '#F59E0B',
  critical: '#EF4444',
}

export interface Analysis {
  severity: Severity
  body: string
  tips: string[]
  outlook: string
}

// Cheap, always-available classification, independent of the fuller prose
// analysis below. Used for status badges so "status" reflects real
// capacity risk rather than a meaningless "computed successfully" label.
export function computeSeverity(result: AllocationResult | null): Severity | null {
  if (!result || result.totalEntities === 0) return null
  if (result.overallocatedEntityCount > 0) return 'critical'
  if (result.averageUtilization >= 85) return 'watch'
  return 'healthy'
}

function money(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

// This is a rule based generator over the allocation numbers already
// computed in the browser, not a live call to a language model. The
// underlying math (per-day load, overallocation, utilization, cost) is
// real, the prose around it is templated. Documented here and in the
// README so nobody mistakes it for a live AI call that isn't happening.
export function buildAnalysis(result: AllocationResult, t: Dict, lang: 'de' | 'en' | 'ar'): Analysis | null {
  if (result.totalEntities === 0) return null

  const severity = computeSeverity(result) as Severity
  const overallocated = result.entities.filter((e) => e.isOverallocated)
  const worst = overallocated[0] ?? result.entities[0]
  const mostHeadroom = [...result.entities].sort((a, b) => a.averagePercent - b.averagePercent)[0]

  const body =
    lang === 'de'
      ? `${overallocated.length} von ${result.totalEntities} Einheiten (${result.personnelCount} Personal, ${result.resourceCount} Ressourcen) ${overallocated.length === 1 ? 'ist' : 'sind'} an mindestens einem Tag über 100% ausgelastet. "${worst.entityName}" liegt an der Spitze mit ${worst.peakPercent}% am stärksten belasteten Tag${worst.overallocatedDays > 0 ? ` (${worst.overallocatedDays} ${worst.overallocatedDays === 1 ? 'Tag' : 'Tage'} über Kapazität)` : ''}. Durchschnittliche Auslastung: ${result.averageUtilization}%.`
      : lang === 'ar'
        ? `${overallocated.length} من ${result.totalEntities} عنصراً (${result.personnelCount} موظفين، ${result.resourceCount} موارد) محمل بأكثر من 100% في يوم واحد على الأقل. "${worst.entityName}" هو الأعلى بنسبة ${worst.peakPercent}%${worst.overallocatedDays > 0 ? ` (${worst.overallocatedDays} يوم فوق الطاقة)` : ''}. متوسط الاستخدام هو ${result.averageUtilization}%.`
        : `${overallocated.length} of ${result.totalEntities} entities (${result.personnelCount} personnel, ${result.resourceCount} resources) ${overallocated.length === 1 ? 'is' : 'are'} loaded above 100% on at least one day. "${worst.entityName}" leads at ${worst.peakPercent}% on their busiest day${worst.overallocatedDays > 0 ? ` (${worst.overallocatedDays} ${worst.overallocatedDays === 1 ? 'day' : 'days'} over capacity)` : ''}. Average utilization sits at ${result.averageUtilization}%.`

  const tips: string[] = []
  if (overallocated.length > 0) {
    tips.push(
      lang === 'de'
        ? `Prüfe zuerst "${worst.entityName}", ${worst.peakPercent}% am Tag ${worst.peakDay} ist der schärfste Engpass im Plan.`
        : lang === 'ar'
          ? `تحقق أولاً من "${worst.entityName}"، ${worst.peakPercent}% في اليوم ${worst.peakDay} هو أكبر عائق في الخطة.`
          : `Check "${worst.entityName}" first, ${worst.peakPercent}% on day ${worst.peakDay} is the sharpest bottleneck in the plan.`,
    )
  }
  if (mostHeadroom && mostHeadroom.entityName !== worst.entityName) {
    tips.push(
      lang === 'de'
        ? `"${mostHeadroom.entityName}" hat mit ${mostHeadroom.averagePercent}% durchschnittlicher Auslastung am meisten Luft, ein guter Kandidat für weitere Arbeit.`
        : lang === 'ar'
          ? `"${mostHeadroom.entityName}" لديه أكبر هامش بمتوسط استخدام ${mostHeadroom.averagePercent}%، مرشح جيد لتولي مزيد من العمل.`
          : `"${mostHeadroom.entityName}" has the most headroom at ${mostHeadroom.averagePercent}% average utilization, a good candidate to pick up more work.`,
    )
  }
  if (overallocated.length > 1) {
    tips.push(
      lang === 'de'
        ? `${overallocated.length - 1} weitere Einheit${overallocated.length - 1 === 1 ? '' : 'en'} ${overallocated.length - 1 === 1 ? 'ist' : 'sind'} ebenfalls über Kapazität, kein Einzelfall.`
        : lang === 'ar'
          ? `${overallocated.length - 1} عنصر إضافي محمل بأكثر من طاقته أيضاً، ليست حالة معزولة.`
          : `${overallocated.length - 1} more ${overallocated.length - 1 === 1 ? 'entity is' : 'entities are'} also over capacity, not an isolated case.`,
    )
  }
  if (result.totalCost > 0) {
    tips.push(
      lang === 'de'
        ? `Geschätzte Gesamtkosten dieses Plans: ${money(result.totalCost)}, basierend auf den hinterlegten Tagessätzen.`
        : lang === 'ar'
          ? `التكلفة الإجمالية المقدرة لهذه الخطة: ${money(result.totalCost)}، بناءً على المعدلات اليومية المدخلة.`
          : `Estimated total cost of this plan: ${money(result.totalCost)}, based on the day rates entered.`,
    )
  }
  tips.push(
    lang === 'de'
      ? `Durchschnitt ${result.averageUtilization}% über den gesamten Planungszeitraum.`
      : lang === 'ar'
        ? `المتوسط ${result.averageUtilization}% عبر فترة التخطيط بأكملها.`
        : `Average ${result.averageUtilization}% across the whole planning span.`,
  )

  const outlook =
    lang === 'de'
      ? overallocated.length > 0
        ? `Ohne Umverteilung bleibt "${worst.entityName}" an ${worst.overallocatedDays} ${worst.overallocatedDays === 1 ? 'Tag' : 'Tagen'} überbucht. Eine Verschiebung oder Reduktion einer der Zuweisungen würde das direkt lösen.`
        : `Aktuell ist nichts überbucht, im Schnitt bleiben ${100 - result.averageUtilization}% Kapazität ungenutzt.`
      : lang === 'ar'
        ? overallocated.length > 0
          ? `بدون إعادة توزيع، يبقى "${worst.entityName}" محملاً بأكثر من طاقته لمدة ${worst.overallocatedDays} يوم. تأجيل أو تقليل أحد التكليفات سيحل ذلك مباشرة.`
          : `لا شيء محمل حالياً بأكثر من طاقته، يبقى ${100 - result.averageUtilization}% من الطاقة غير مستخدم في المتوسط.`
        : overallocated.length > 0
          ? `Without rebalancing, "${worst.entityName}" stays overbooked on ${worst.overallocatedDays} ${worst.overallocatedDays === 1 ? 'day' : 'days'}. Shifting or trimming one of their assignments would resolve it directly.`
          : `Nothing is currently overbooked, ${100 - result.averageUtilization}% of capacity sits unused on average.`

  return { severity, body, tips, outlook }
}
