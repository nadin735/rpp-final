import type { Assignment, EntityKind, Plan } from '../types'

// Fictional sample plans for "Try with demo data — no login".
// Names, rates and dates are illustrative only.

type Row = [string, EntityKind, string, number, number, number, number?]

function assignments(rows: Row[]): Assignment[] {
  return rows.map(([entityName, kind, taskName, allocationPercent, startDay, durationDays, ratePerDay]) => ({
    id: crypto.randomUUID(),
    entityName,
    kind,
    taskName,
    allocationPercent,
    startDay,
    durationDays,
    ratePerDay,
  }))
}

export function demoPlans(): Plan[] {
  const now = new Date().toISOString()
  return [
    {
      id: crypto.randomUUID(),
      name: 'Demo: App-Launch Q3 (fiktiv)',
      createdAt: now,
      updatedAt: now,
      sourcePdfNames: [],
      assignments: assignments([
        ['Anna Becker', 'personnel', 'Projektleitung', 50, 0, 60, 720],
        ['Anna Becker', 'personnel', 'Stakeholder-Workshops', 40, 10, 15, 720],
        ['Anna Becker', 'personnel', 'Release-Planung', 30, 20, 10, 720],
        ['Jonas Weber', 'personnel', 'Backend-API', 80, 5, 30, 650],
        ['Jonas Weber', 'personnel', 'Code-Reviews', 30, 15, 20, 650],
        ['Lea Schmidt', 'personnel', 'UI-Design', 60, 0, 20, 600],
        ['Lea Schmidt', 'personnel', 'Usability-Tests', 40, 25, 10, 600],
        ['Mehmet Yilmaz', 'personnel', 'Frontend', 100, 15, 35, 620],
        ['Mehmet Yilmaz', 'personnel', 'Bugfixing Altsystem', 20, 20, 10, 620],
        ['Sofia Rossi', 'personnel', 'QA & Testautomatisierung', 70, 30, 25, 580],
        ['Testgeräte-Pool', 'resource', 'Gerätetests', 100, 35, 15, 40],
        ['Testgeräte-Pool', 'resource', 'Usability-Tests', 50, 25, 15, 40],
        ['Besprechungsraum 2', 'resource', 'Sprint-Reviews', 40, 0, 60],
      ]),
    },
    {
      id: crypto.randomUUID(),
      name: 'Demo: Büroumzug (fiktiv)',
      createdAt: now,
      updatedAt: now,
      sourcePdfNames: [],
      assignments: assignments([
        ['Anna Becker', 'personnel', 'Umzugskoordination', 40, 10, 20, 720],
        ['Tim Hoffmann', 'personnel', 'IT-Infrastruktur', 80, 5, 20, 560],
        ['Tim Hoffmann', 'personnel', 'Netzwerk neuer Standort', 50, 15, 10, 560],
        ['Clara Neumann', 'personnel', 'Facility & Möbel', 60, 0, 25, 480],
        ['Transporter', 'resource', 'Möbeltransport', 100, 20, 5, 150],
        ['Laptop-Pool', 'resource', 'Arbeitsplatz-Setup', 70, 18, 7, 25],
      ]),
    },
  ]
}
