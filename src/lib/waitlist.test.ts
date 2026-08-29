import { describe, expect, it } from 'vitest'
import { MIN_DWELL_MS, isValidEndpoint, validateWaitlist, type WaitlistPayload } from './waitlist'

function payload(overrides: Partial<WaitlistPayload> = {}): WaitlistPayload {
  return {
    name: 'Ada Lovelace',
    company: 'Acme',
    role: 'Head of Platform',
    location: 'Berlin, Germany',
    email: 'ada@example.com',
    phone: '',
    website: '',
    dwellMs: MIN_DWELL_MS + 1000,
    ...overrides,
  }
}

describe('validateWaitlist', () => {
  it('accepts a complete submission', () => {
    expect(validateWaitlist(payload())).toEqual({ ok: true })
  })

  it('accepts a submission with no phone number', () => {
    expect(validateWaitlist(payload({ phone: '' })).ok).toBe(true)
  })

  describe('required fields', () => {
    it.each(['name', 'company', 'role', 'location', 'email'] as const)(
      'rejects a missing %s and names the field',
      (field) => {
        const result = validateWaitlist(payload({ [field]: '' }))
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.field).toBe(field)
      },
    )

    it.each(['name', 'company', 'role', 'location'] as const)(
      'treats a whitespace-only %s as missing',
      (field) => {
        expect(validateWaitlist(payload({ [field]: '   ' })).ok).toBe(false)
      },
    )
  })

  describe('email', () => {
    it.each([
      ['not-an-email', 'no @'],
      ['no@domain', 'no TLD'],
      ['no@domain.c', 'single-character TLD'],
      ['spaces in@example.com', 'whitespace'],
      ['@example.com', 'no local part'],
    ])('rejects %j (%s)', (email) => {
      expect(validateWaitlist(payload({ email })).ok).toBe(false)
    })

    it.each(['ada@example.com', 'ada.lovelace+beta@sub.example.co.uk', 'a@b.io'])(
      'accepts %j',
      (email) => {
        expect(validateWaitlist(payload({ email })).ok).toBe(true)
      },
    )

    it('tolerates surrounding whitespace', () => {
      expect(validateWaitlist(payload({ email: '  ada@example.com  ' })).ok).toBe(true)
    })
  })

  describe('phone', () => {
    it.each([
      '+49 30 1234567',
      '+1 (555) 010-9999',
      '020 7946 0958',
      '+81-3-1234-5678',
      '415.555.0123',
    ])('accepts %j', (phone) => {
      expect(validateWaitlist(payload({ phone })).ok).toBe(true)
    })

    it.each([
      ['12345', 'too few digits'],
      ['1234567890123456789', 'too many digits'],
      ['call me maybe', 'letters'],
      ['+49 30 CALL-NOW', 'letters mixed in'],
    ])('rejects %j (%s)', (phone) => {
      const result = validateWaitlist(payload({ phone }))
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.field).toBe('phone')
    })

    it('treats whitespace as absent rather than invalid', () => {
      expect(validateWaitlist(payload({ phone: '   ' })).ok).toBe(true)
    })
  })

  describe('bot defences', () => {
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

    it('does not blame a field for a honeypot or timing rejection', () => {
      const trap = validateWaitlist(payload({ website: 'x' }))
      const fast = validateWaitlist(payload({ dwellMs: 0 }))
      if (!trap.ok) expect(trap.field).toBeNull()
      if (!fast.ok) expect(fast.field).toBeNull()
    })
  })

  it('always explains itself when it rejects', () => {
    const result = validateWaitlist(payload({ email: 'nope' }))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0)
  })
})

describe('isValidEndpoint', () => {
  const real = 'https://script.google.com/macros/s/AKfycbwAbCdEf123456789_-XyZ/exec'

  it('accepts a real Apps Script deployment URL', () => {
    expect(isValidEndpoint(real)).toBe(true)
  })

  it('tolerates surrounding whitespace', () => {
    expect(isValidEndpoint(`  ${real}  `)).toBe(true)
  })

  it.each([
    ['', 'empty'],
    ['PLACEHOLDER', 'not a URL'],
    ['https://script.google.com/macros/s/PLACEHOLDER/exec', 'id too short'],
    ['https://script.google.com/macros/s/AKfycbwAbCdEf123456789_-XyZ/dev', 'dev, not exec'],
    ['http://script.google.com/macros/s/AKfycbwAbCdEf123456789_-XyZ/exec', 'not https'],
    ['https://evil.example/macros/s/AKfycbwAbCdEf123456789_-XyZ/exec', 'wrong host'],
    ['https://script.google.com/macros/s/AKfycbwAbCdEf123456789_-XyZ/exec?x=1', 'trailing query'],
  ])('rejects %j (%s)', (url) => {
    // A cross-origin 404 throws rather than reporting !ok, and the opaque retry
    // then looks like success — so a bad URL must never reach the submit path.
    expect(isValidEndpoint(url)).toBe(false)
  })
})
