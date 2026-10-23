// No login: all plans live in one local workspace in this browser.
//
// Earlier versions had a demo "login" that stored names and passwords in
// plain text in localStorage. That is gone. On start-up we migrate the last
// signed-in user's plans into the local workspace and then delete every
// stored name/password, so no credentials remain in the browser.

export const WORKSPACE = 'local'

const LEGACY_ACCOUNTS_KEY = 'rcp-accounts-v1'
const LEGACY_SESSION_KEY = 'rcp-session-v1'

const plansKey = (key: string) => `rcp-plans-${key}-v1`

export function purgeLegacyAccounts(): void {
  try {
    const session = localStorage.getItem(LEGACY_SESSION_KEY)
    if (session && !localStorage.getItem(plansKey(WORKSPACE))) {
      const legacy = localStorage.getItem(plansKey(session))
      if (legacy) localStorage.setItem(plansKey(WORKSPACE), legacy)
    }
    localStorage.removeItem(LEGACY_ACCOUNTS_KEY)
    localStorage.removeItem(LEGACY_SESSION_KEY)
  } catch {
    /* storage unavailable (private mode) — nothing to clean up */
  }
}

/** Deletes every key this app wrote in this browser: plans, theme, legacy data. */
export function deleteAllLocalData(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('rcp-'))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}
