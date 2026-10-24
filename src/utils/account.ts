// No login: one workspace per browser tab.

export const WORKSPACE = 'local'

// Per-visitor data: everything lives in sessionStorage (this tab only) and is
// gone when the tab closes, so a second person on the same device always
// starts with an empty page. Older versions used localStorage (incl. a demo
// login with plain-text passwords); those keys are wiped on start-up.
export function purgeLegacyAccounts(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('rcp-'))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* storage unavailable (private mode) — nothing to clean up */
  }
}

/** Deletes every key this app wrote in this browser: plans, theme, legacy data. */
export function deleteAllLocalData(): void {
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith('rcp-'))
      .forEach((k) => sessionStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}
