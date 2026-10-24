import { useEffect, useRef } from 'react'
import type { Dict } from '../i18n'

// Impressum (§ 18 Abs. 1 MStV) and a short privacy notice for a private,
// non-commercial portfolio project. Legal texts stay German on purpose.

export type LegalPage = 'imprint' | 'privacy'

const OWNER = {
  name: 'Nadin Okil',
  // TODO: ladungsfähige Anschrift eintragen (Pflicht nach § 18 MStV)
  street: '[Straße und Hausnummer]',
  city: '[PLZ Ort]',
  email: 'nadinokil.contact@gmail.com',
}

interface Props {
  page: LegalPage
  appName: string
  /** One sentence on what the app processes locally, e.g. PDF parsing. */
  localProcessing: string
  onClose: () => void
  t: Dict
}

export default function LegalModal({ page, appName, localProcessing, onClose, t }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-title"
        lang="de"
        dir="ltr"
        className="bg-surface2 text-ink rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {page === 'imprint' ? (
          <section className="space-y-3 text-sm leading-relaxed">
            <h2 id="legal-title" className="font-display text-xl font-semibold">Impressum</h2>
            <p>Angaben gemäß § 18 Abs. 1 MStV</p>
            <p>
              {OWNER.name}
              <br />
              {OWNER.street}
              <br />
              {OWNER.city}
            </p>
            <p>
              E-Mail: <a className="underline" href={`mailto:${OWNER.email}`}>{OWNER.email}</a>
            </p>
            <p className="text-ink2">
              {appName} ist ein privates, nicht-kommerzielles Portfolio-Projekt. Es gibt keine Werbung, keine Einnahmen und
              keine Konten.
            </p>
          </section>
        ) : (
          <section className="space-y-3 text-sm leading-relaxed">
            <h2 id="legal-title" className="font-display text-xl font-semibold">Datenschutzerklärung</h2>
            <h3 className="font-semibold pt-2">Verantwortlich</h3>
            <p>
              {OWNER.name}, {OWNER.street}, {OWNER.city}, {OWNER.email}
            </p>
            <h3 className="font-semibold pt-2">Hosting</h3>
            <p>
              Die Seite wird von Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789, USA) ausgeliefert. Beim Aufruf
              verarbeitet Vercel technisch notwendige Daten (IP-Adresse, Zeitpunkt, angeforderte Datei, Browser-Kennung) in
              Server-Logs, um die Seite sicher auszuliefern. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Für
              Übermittlungen in die USA stützt sich Vercel auf das EU-US Data Privacy Framework und
              Standardvertragsklauseln.
            </p>
            <h3 className="font-semibold pt-2">Ihre Eingaben</h3>
            <p>
              Es gibt kein Login und keine Datenbank. Ihre Eingaben werden nur im sessionStorage dieses Browser-Tabs gespeichert,
              nie an mich oder Dritte übertragen und beim Schließen des Tabs automatisch gelöscht. Jede Person, die den
              Link öffnet, startet daher mit einer leeren Seite. {localProcessing} Mit „{t.deleteAllData}“ unten
              auf der Seite löschen Sie alles sofort; alternativ über die Browser-Einstellungen.
            </p>
            <h3 className="font-semibold pt-2">Keine Cookies, kein Tracking</h3>
            <p>
              Es werden keine Cookies gesetzt, keine Analyse- oder Tracking-Dienste eingesetzt und keine externen Schriften
              oder Skripte geladen. Daher ist kein Cookie-Banner nötig.
            </p>
            <h3 className="font-semibold pt-2">Ihre Rechte</h3>
            <p>
              Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Widerspruch und
              Datenübertragbarkeit (Art. 15–21 DSGVO) sowie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu
              beschweren (Art. 77 DSGVO).
            </p>
          </section>
        )}
        <div className="mt-6 flex justify-end">
          <button
            ref={closeRef}
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gold-500 text-inkOnGold rounded hover:bg-gold-400 font-semibold"
          >
            {t.legalClose}
          </button>
        </div>
      </div>
    </div>
  )
}
