import OrchestrationFlow from './flow/OrchestrationFlow'

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section section-alt">
      <div className="container">
        <div className="row justify-content-center text-center mb-4 reveal">
          <div className="col-lg-8">
            <span className="eyebrow justify-content-center">How it works</span>
            <h2 className="display-6">One run, from intent to self-healing</h2>
            <p className="text-muted fs-5 mt-3">
              Agents do the work. You stay in the loop where it matters — before
              anything is provisioned, and whenever a fault has no safe automatic
              fix.
            </p>
          </div>
        </div>

        <div className="flow-legend reveal">
          <span className="flow-legend-item">
            <span className="flow-legend-key flow-legend-agent" /> Agent
          </span>
          <span className="flow-legend-item">
            <span className="flow-legend-key flow-legend-human" /> Human decision
          </span>
          <span className="flow-legend-item">
            <span className="flow-legend-key flow-legend-fail" /> Failure path
          </span>
          <span className="flow-legend-hint">Hover a step to pause and read it</span>
        </div>

        <div className="reveal">
          <OrchestrationFlow />
        </div>
      </div>
    </section>
  )
}
