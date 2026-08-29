/**
 * Waitlist submission.
 *
 * Posts to a Google Apps Script web app bound to the signup sheet — see
 * scripts/waitlist-appscript.gs. The endpoint is public and writable by anyone
 * who reads the bundle, so every check here is repeated server-side in the
 * script. These exist to keep honest traffic clean, not to secure the endpoint.
 */

/** Minimum time a real person spends on the form before submitting. */
export const MIN_DWELL_MS = 2500

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export interface WaitlistPayload {
  email: string
  name: string
  company: string
  useCase: string
  /** Honeypot. Real users never see this field, so it must arrive empty. */
  website: string
  /** Milliseconds the form was on screen before submission. */
  dwellMs: number
}

export type ValidationResult = { ok: true } | { ok: false; reason: string }

export function validateWaitlist(payload: WaitlistPayload): ValidationResult {
  if (payload.website.trim() !== '') {
    return { ok: false, reason: 'Something went wrong. Please try again.' }
  }
  if (payload.dwellMs < MIN_DWELL_MS) {
    return { ok: false, reason: 'That was quick — give it a moment and try again.' }
  }
  if (!EMAIL_PATTERN.test(payload.email.trim())) {
    return { ok: false, reason: 'Enter a valid email address.' }
  }
  return { ok: true }
}

export function getEndpoint(): string | null {
  const endpoint = import.meta.env.VITE_WAITLIST_ENDPOINT
  return typeof endpoint === 'string' && endpoint.trim() !== '' ? endpoint.trim() : null
}

export type SubmitResult = { ok: true } | { ok: false; reason: string }

export async function submitWaitlist(payload: WaitlistPayload): Promise<SubmitResult> {
  const endpoint = getEndpoint()
  if (!endpoint) {
    return { ok: false, reason: 'The waitlist is not open yet.' }
  }

  const body = new URLSearchParams({
    email: payload.email.trim(),
    name: payload.name.trim(),
    company: payload.company.trim(),
    useCase: payload.useCase,
    website: payload.website,
    dwellMs: String(payload.dwellMs),
  })

  try {
    const response = await fetch(endpoint, { method: 'POST', body })
    if (response.ok) return { ok: true }
    return { ok: false, reason: 'We could not save that. Please try again.' }
  } catch {
    // Apps Script redirects to a second origin, and some browsers refuse to
    // expose that response. The POST itself still lands, so retry opaquely
    // rather than telling the user their signup failed when it did not.
    try {
      await fetch(endpoint, { method: 'POST', mode: 'no-cors', body })
      return { ok: true }
    } catch {
      return { ok: false, reason: 'Network error. Please check your connection and retry.' }
    }
  }
}
