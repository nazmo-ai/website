import { useRef, useState, type FormEvent } from 'react'
import {
  getEndpoint,
  submitWaitlist,
  validateWaitlist,
  type WaitlistField,
  type WaitlistPayload,
} from '../lib/waitlist'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const EMPTY = {
  name: '',
  company: '',
  role: '',
  location: '',
  email: '',
  phone: '',
  website: '',
}

type FormValues = typeof EMPTY

interface FieldSpec {
  field: WaitlistField
  label: string
  placeholder: string
  type: string
  autoComplete: string
  /** Bootstrap column class; the form is a two-up grid on wider screens. */
  span: string
  optional?: boolean
}

const FIELDS: FieldSpec[] = [
  { field: 'name', label: 'Name', placeholder: 'Ada Lovelace', type: 'text', autoComplete: 'name', span: 'col-sm-6' },
  { field: 'company', label: 'Company', placeholder: 'Acme', type: 'text', autoComplete: 'organization', span: 'col-sm-6' },
  { field: 'role', label: 'Role', placeholder: 'Head of Platform', type: 'text', autoComplete: 'organization-title', span: 'col-sm-6' },
  { field: 'location', label: 'Job location', placeholder: 'Berlin, Germany', type: 'text', autoComplete: 'address-level2', span: 'col-sm-6' },
  { field: 'email', label: 'Work email', placeholder: 'you@company.com', type: 'email', autoComplete: 'email', span: 'col-sm-6' },
  { field: 'phone', label: 'Phone', placeholder: '+49 30 1234567', type: 'tel', autoComplete: 'tel', span: 'col-sm-6', optional: true },
]

export default function EarlyAccess() {
  const endpoint = getEndpoint()
  const mountedAt = useRef(Date.now())
  const formRef = useRef<HTMLFormElement | null>(null)

  const [values, setValues] = useState<FormValues>(EMPTY)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [invalidField, setInvalidField] = useState<WaitlistField | null>(null)

  function update(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    if (invalidField === field) setInvalidField(null)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return

    const payload: WaitlistPayload = {
      ...values,
      dwellMs: Date.now() - mountedAt.current,
    }

    const validation = validateWaitlist(payload)
    if (!validation.ok) {
      setStatus('error')
      setMessage(validation.reason)
      setInvalidField(validation.field)
      if (validation.field) {
        formRef.current?.querySelector<HTMLInputElement>(`#wl-${validation.field}`)?.focus()
      }
      return
    }

    setStatus('submitting')
    setMessage('')
    setInvalidField(null)

    const result = await submitWaitlist(payload)
    if (result.ok) {
      setStatus('success')
    } else {
      setStatus('error')
      setMessage(result.reason)
    }
  }

  return (
    <section id="early-access" className="section section-alt">
      <div className="container">
        <div className="row justify-content-center text-center reveal">
          <div className="col-lg-8">
            <span className="eyebrow justify-content-center">Early access</span>
            <h2 className="display-6 mb-3">Be the first to orchestrate</h2>
            <p className="text-muted fs-5 mb-4">
              Nazmo.AI is in private beta. Join the waitlist and we&rsquo;ll reach
              out as seats open up.
            </p>

            {status === 'success' ? (
              <div className="waitlist-success" role="status">
                <div className="waitlist-success-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </div>
                <p className="mb-0">
                  You&rsquo;re on the list —{' '}
                  <span className="gradient-text fw-semibold">{values.email}</span>. We&rsquo;ll
                  be in touch as seats open.
                </p>
              </div>
            ) : !endpoint ? (
              <div className="waitlist-closed" role="status">
                <p className="mb-0">The waitlist opens shortly. Check back soon.</p>
              </div>
            ) : (
              <form className="waitlist-form text-start" ref={formRef} onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  {FIELDS.map((spec) => (
                    <div className={spec.span} key={spec.field}>
                      <label className="waitlist-label" htmlFor={`wl-${spec.field}`}>
                        {spec.label}
                        {spec.optional ? (
                          <span className="waitlist-optional">optional</span>
                        ) : (
                          <span className="waitlist-required" aria-hidden="true">*</span>
                        )}
                      </label>
                      <input
                        id={`wl-${spec.field}`}
                        type={spec.type}
                        autoComplete={spec.autoComplete}
                        required={!spec.optional}
                        aria-required={!spec.optional}
                        aria-invalid={invalidField === spec.field}
                        className={`nz-form-control${invalidField === spec.field ? ' is-invalid' : ''}`}
                        placeholder={spec.placeholder}
                        value={values[spec.field]}
                        onChange={(e) => update(spec.field, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                {/* Honeypot: hidden from people, irresistible to bots. */}
                <div className="waitlist-hp" aria-hidden="true">
                  <label htmlFor="wl-website">Website</label>
                  <input
                    id="wl-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={values.website}
                    onChange={(e) => update('website', e.target.value)}
                  />
                </div>

                <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
                  <button type="submit" className="btn btn-gradient" disabled={status === 'submitting'}>
                    {status === 'submitting' ? 'Joining…' : 'Join the waitlist'}
                  </button>
                  <span className="waitlist-privacy">
                    One email when seats open. Nothing else.
                  </span>
                </div>

                {status === 'error' && (
                  <p className="waitlist-error mt-3 mb-0" role="alert">
                    {message}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
