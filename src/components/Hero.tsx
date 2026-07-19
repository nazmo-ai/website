import OrchestrationGraph from './OrchestrationGraph'

export default function Hero() {
  return (
    <header id="top" className="position-relative overflow-hidden pt-5">
      <div className="hero-bg">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
      </div>

      <div className="container hero-content" style={{ paddingTop: '7rem', paddingBottom: '4rem' }}>
        <div className="row align-items-center gy-5">
          <div className="col-lg-6">
            <div className="d-flex flex-column align-items-start gap-2 mb-1">
              <span className="coming-soon-badge">
                <span className="coming-soon-dot" />
                Coming soon
              </span>
              <span className="eyebrow mb-0">Poetry in Cloud</span>
            </div>
            <h1 className="display-4 mb-4">
              Orchestrate cloud service chains{' '}
              <span className="gradient-text">like poetry</span>
            </h1>
            <p className="fs-5 text-muted mb-4" style={{ maxWidth: '34rem' }}>
              Nazmo AI lets you design, connect, and run multi-cloud service
              chains on a visual canvas. Describe your intent, let AI wire the
              services together, and skip the Infrastructure-as-Code entirely.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <a href="#early-access" className="btn btn-gradient">
                Get early access
              </a>
              <a href="#how-it-works" className="btn btn-outline-nz">
                See how it works
              </a>
            </div>
          </div>
          <div className="col-lg-6">
            <OrchestrationGraph />
          </div>
        </div>
      </div>
    </header>
  )
}
