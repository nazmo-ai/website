import { useRef, useState, type FormEvent } from 'react'
import {
  getEndpoint,
  submitWaitlist,
  validateWaitlist,
  type WaitlistPayload,
} from '../lib/waitlist'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const USE_CASES = [
  'Multi-cloud migration',
  'AI / ML pipelines',
  'Cost optimisation',
  'Platform engineering',
  'Something else',
]

export default function EarlyAccess() {
  const endpoint = getEndpoint()
  const mountedAt = useRef(Date.now())

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [useCase, setUseCase] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'submitting') return

    const payload: WaitlistPayload = {
      email,
      name,
      company,
      useCase,
      website,
      dwellMs: Date.now() - mountedAt.current,
    }

    const validation = validateWaitlist(payload)
    if (!validation.ok) {
      setStatus('error')
      setMessage(validation.reason)
      return
    }

    setStatus('submitting')
    setMessage('')

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
          <div className="col-lg-7">
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
                  <span className="gradient-text fw-semibold">{email}</span>. We&rsquo;ll
                  be in touch as seats open.
                </p>
              </div>
            ) : !endpoint ? (
              <div className="waitlist-closed" role="status">
                <p className="mb-0">
                  The waitlist opens shortly. Check back soon.
                </p>
              </div>
            ) : (
              <form className="waitlist-form text-start" onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="waitlist-label" htmlFor="wl-email">
                      Work email <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="wl-email"
                      type="email"
                      required
                      autoComplete="email"
                      className="nz-form-control"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="col-sm-6">
                    <label className="waitlist-label" htmlFor="wl-name">
                      Name
                    </label>
                    <input
                      id="wl-name"
                      type="text"
                      autoComplete="name"
                      className="nz-form-control"
                      placeholder="Ada Lovelace"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="col-sm-6">
                    <label className="waitlist-label" htmlFor="wl-company">
                      Company
                    </label>
                    <input
                      id="wl-company"
                      type="text"
                      autoComplete="organization"
                      className="nz-form-control"
                      placeholder="Acme"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="waitlist-label" htmlFor="wl-usecase">
                      What would you orchestrate first?
                    </label>
                    <select
                      id="wl-usecase"
                      className="nz-form-control"
                      value={useCase}
                      onChange={(e) => setUseCase(e.target.value)}
                    >
                      <option value="">Choose one (optional)</option>
                      {USE_CASES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Honeypot: hidden from people, irresistible to bots. */}
                <div className="waitlist-hp" aria-hidden="true">
                  <label htmlFor="wl-website">Website</label>
                  <input
                    id="wl-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <div className="d-flex flex-wrap align-items-center gap-3 mt-4">
                  <button
                    type="submit"
                    className="btn btn-gradient"
                    disabled={status === 'submitting'}
                  >
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
