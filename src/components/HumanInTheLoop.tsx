const CHANGES = [
  { label: 'API gateway', detail: 'AWS · eu-central-1', tone: 'add' },
  { label: 'Inference service', detail: 'GCP · europe-west4', tone: 'add' },
  { label: 'Vector store', detail: 'Azure · westeurope', tone: 'add' },
  { label: 'Legacy queue', detail: 'AWS · eu-west-1', tone: 'remove' },
]

/**
 * Expands on the approval gate in the flow graph. The card is decorative — the
 * buttons are styled but inert — so it is presented as an example, not a live
 * control.
 */
export default function HumanInTheLoop() {
  return (
    <section id="approvals" className="section">
      <div className="container">
        <div className="row align-items-center gy-5">
          <div className="col-lg-5 reveal">
            <span className="eyebrow">Governed autonomy</span>
            <h2 className="display-6 mb-3">Nothing ships without a human yes</h2>
            <p className="text-muted fs-5">
              Agents are fast, and fast is dangerous when it touches production
              spend and blast radius. Nazmo stops the run before it provisions
              anything and hands you the design, the cost, and what it would
              touch.
            </p>
            <ul className="hitl-points">
              <li>Approve, or send it back with a note the agent acts on.</li>
              <li>Every decision is recorded against the run that produced it.</li>
              <li>Unresolvable faults page a person instead of guessing.</li>
            </ul>
          </div>

          <div className="col-lg-7 reveal">
            <div className="approval-card" aria-label="Example approval request">
              <div className="approval-head">
                <div>
                  <span className="approval-kind">Approval requested</span>
                  <h3 className="approval-title">RAG ingest chain · production</h3>
                </div>
                <span className="approval-wait">waiting</span>
              </div>

              <div className="approval-body">
                <div className="approval-changes">
                  <span className="approval-section-label">Proposed changes</span>
                  {CHANGES.map((change) => (
                    <div className={`approval-change is-${change.tone}`} key={change.label}>
                      <span className="approval-change-mark">
                        {change.tone === 'add' ? '+' : '−'}
                      </span>
                      <span className="approval-change-label">{change.label}</span>
                      <span className="approval-change-detail">{change.detail}</span>
                    </div>
                  ))}
                </div>

                <div className="approval-metrics">
                  <div className="approval-metric">
                    <span className="approval-metric-label">Monthly cost</span>
                    <span className="approval-metric-value">$1,840</span>
                    <span className="approval-metric-delta is-up">+$310 vs today</span>
                  </div>
                  <div className="approval-metric">
                    <span className="approval-metric-label">Blast radius</span>
                    <span className="approval-metric-value">4 services</span>
                    <span className="approval-metric-delta">3 clouds · 4 regions</span>
                  </div>
                  <div className="approval-metric">
                    <span className="approval-metric-label">Rollback</span>
                    <span className="approval-metric-value">Automatic</span>
                    <span className="approval-metric-delta">single transaction</span>
                  </div>
                </div>
              </div>

              <div className="approval-actions">
                <span className="approval-btn is-primary">Approve &amp; deploy</span>
                <span className="approval-btn">Request changes</span>
                <span className="approval-note">Example only</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
