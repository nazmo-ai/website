import { useState, type FormEvent } from 'react'

export default function EarlyAccess() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <section id="early-access" className="section">
      <div className="container">
        <div className="row justify-content-center text-center reveal">
          <div className="col-lg-7">
            <span className="eyebrow justify-content-center">Early access</span>
            <h2 className="display-6 mb-3">Be the first to orchestrate</h2>
            <p className="text-muted fs-5 mb-4">
              Nazmo AI is in private beta. Join the waitlist and we&rsquo;ll
              reach out as seats open up.
            </p>

            {submitted ? (
              <div className="nz-card d-inline-block px-4 py-3">
                <p className="mb-0">
                  Thanks — <span className="gradient-text fw-semibold">{email}</span> is on the list.
                  We&rsquo;ll be in touch.
                </p>
              </div>
            ) : (
              <form
                className="d-flex flex-column flex-sm-row gap-3 justify-content-center"
                onSubmit={handleSubmit}
              >
                <input
                  type="email"
                  required
                  className="nz-form-control"
                  style={{ minWidth: '18rem' }}
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Work email"
                />
                <button type="submit" className="btn btn-gradient">
                  Join the waitlist
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
