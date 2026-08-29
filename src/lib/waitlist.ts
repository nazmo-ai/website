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
/** Deliberately permissive: international formats vary far too much to police. */
const PHONE_DIGITS = /\d/g
const PHONE_ALLOWED = /^[\d\s+()./-]+$/

export type WaitlistField = 'name' | 'company' | 'role' | 'location' | 'email' | 'phone'

export interface WaitlistPayload {
  name: string
  company: string
  /** Role or position within the company. */
  role: string
  /** Where the person is based. */
  location: string
  email: string
  /** Optional. */
  phone: string
  /** Honeypot. Real users never see this field, so it must arrive empty. */
  website: string
  /** Milliseconds the form was on screen before submission. */
  dwellMs: number
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; field: WaitlistField | null; reason: string }

/** Every field the form requires, with the label used in its error message. */
const REQUIRED: { field: WaitlistField; label: string }[] = [
  { field: 'name', label: 'your name' },
  { field: 'company', label: 'your company' },
  { field: 'role', label: 'your role' },
  { field: 'location', label: 'your location' },
]

export function validateWaitlist(payload: WaitlistPayload): ValidationResult {
  if (payload.website.trim() !== '') {
    return { ok: false, field: null, reason: 'Something went wrong. Please try again.' }
  }
  if (payload.dwellMs < MIN_DWELL_MS) {
    return { ok: false, field: null, reason: 'That was quick — give it a moment and try again.' }
  }

  for (const { field, label } of REQUIRED) {
    if (payload[field].trim() === '') {
      return { ok: false, field, reason: `Please enter ${label}.` }
    }
  }

  if (!EMAIL_PATTERN.test(payload.email.trim())) {
    return { ok: false, field: 'email', reason: 'Enter a valid email address.' }
  }

  // Optional, but if given it should at least look like a phone number.
  const phone = payload.phone.trim()
  if (phone !== '') {
    const digits = phone.match(PHONE_DIGITS)?.length ?? 0
    if (!PHONE_ALLOWED.test(phone) || digits < 7 || digits > 15) {
      return { ok: false, field: 'phone', reason: 'Enter a valid phone number, or leave it blank.' }
    }
  }

  return { ok: true }
}

/**
 * Apps Script web-app deployment URLs have exactly one shape.
 *
 * This is checked because the submit path cannot tell a broken endpoint from a
 * working one: a cross-origin 404 carries no CORS headers, so `fetch` throws
 * rather than reporting `ok: false`, and the opaque retry below then looks like
 * success. Rejecting a malformed URL up front turns the most likely
 * misconfiguration into a visible "waitlist closed" state instead of a form
 * that silently discards every signup.
 */
const ENDPOINT_PATTERN = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/

export function isValidEndpoint(url: string): boolean {
  return ENDPOINT_PATTERN.test(url.trim())
}

export function getEndpoint(): string | null {
  const endpoint = import.meta.env.VITE_WAITLIST_ENDPOINT
  if (typeof endpoint !== 'string') return null
  const trimmed = endpoint.trim()
  if (trimmed === '') return null

  if (!isValidEndpoint(trimmed)) {
    console.warn(
      '[waitlist] VITE_WAITLIST_ENDPOINT is not an Apps Script /exec URL; the form will stay closed.',
    )
    return null
  }
  return trimmed
}

export type SubmitResult = { ok: true } | { ok: false; reason: string }

export async function submitWaitlist(payload: WaitlistPayload): Promise<SubmitResult> {
  const endpoint = getEndpoint()
  if (!endpoint) {
    return { ok: false, reason: 'The waitlist is not open yet.' }
  }

  const body = new URLSearchParams({
    name: payload.name.trim(),
    company: payload.company.trim(),
    role: payload.role.trim(),
    location: payload.location.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
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
      // An opaque response carries no status, so this cannot prove the write
      // landed. Surface it in the console so a broken deployment is at least
      // diagnosable rather than invisible.
      console.warn('[waitlist] Response was not readable; assuming the POST landed.')
      return { ok: true }
    } catch {
      return { ok: false, reason: 'Network error. Please check your connection and retry.' }
    }
  }
}
