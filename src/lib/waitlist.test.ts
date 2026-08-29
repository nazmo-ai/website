import { describe, expect, it } from 'vitest'
import { MIN_DWELL_MS, validateWaitlist, type WaitlistPayload } from './waitlist'

function payload(overrides: Partial<WaitlistPayload> = {}): WaitlistPayload {
  return {
    email: 'ada@example.com',
    name: 'Ada Lovelace',
    company: 'Acme',
    useCase: 'AI / ML pipelines',
    website: '',
    dwellMs: MIN_DWELL_MS + 1000,
    ...overrides,
  }
}

describe('validateWaitlist', () => {
  it('accepts a well-formed submission', () => {
    expect(validateWaitlist(payload())).toEqual({ ok: true })
  })

  it('accepts a submission with only an email', () => {
    const result = validateWaitlist(payload({ name: '', company: '', useCase: '' }))
    expect(result.ok).toBe(true)
  })

  it('rejects anything that filled the honeypot', () => {
    expect(validateWaitlist(payload({ website: 'http://spam.example' })).ok).toBe(false)
  })

  it('treats a whitespace-only honeypot as empty', () => {
    expect(validateWaitlist(payload({ website: '   ' })).ok).toBe(true)
  })

  it('rejects submissions faster than a person could manage', () => {
    expect(validateWaitlist(payload({ dwellMs: MIN_DWELL_MS - 1 })).ok).toBe(false)
  })

  it('accepts a submission exactly at the dwell threshold', () => {
    expect(validateWaitlist(payload({ dwellMs: MIN_DWELL_MS })).ok).toBe(true)
  })

  it.each([
    ['', 'empty'],
    ['not-an-email', 'no @'],
    ['no@domain', 'no TLD'],
    ['no@domain.c', 'single-character TLD'],
    ['spaces in@example.com', 'whitespace'],
    ['@example.com', 'no local part'],
  ])('rejects %j (%s)', (email) => {
    expect(validateWaitlist(payload({ email })).ok).toBe(false)
  })

  it.each([
    'ada@example.com',
    'ada.lovelace+beta@sub.example.co.uk',
    'a@b.io',
  ])('accepts %j', (email) => {
    expect(validateWaitlist(payload({ email })).ok).toBe(true)
  })

  it('tolerates surrounding whitespace on the email', () => {
    expect(validateWaitlist(payload({ email: '  ada@example.com  ' })).ok).toBe(true)
  })

  it('explains itself when it rejects', () => {
    const result = validateWaitlist(payload({ email: 'nope' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0)
  })
})
