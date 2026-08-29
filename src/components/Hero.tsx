import DotMap from './map/DotMap'

export default function Hero() {
  return (
    <header id="top" className="hero">
      <div className="hero-map">
        <DotMap />
      </div>
      <div className="hero-scrim" aria-hidden="true" />

      <div className="container hero-content">
        <div className="row">
          <div className="col-lg-8 col-xl-7">
            <div className="d-flex flex-column align-items-start gap-2 mb-3">
              <span className="coming-soon-badge">
                <span className="coming-soon-dot" />
                Coming soon — private beta
              </span>
              <span className="eyebrow mb-0">Poetry in Cloud</span>
            </div>

            <h1 className="hero-title mb-4">
              Orchestrate every cloud <span className="gradient-text">as one system</span>
            </h1>

            <p className="hero-lede mb-4">
              Nazmo.AI designs the service chain, places it across providers, prices
              it, and waits for your approval — then deploys it and keeps it
              healthy. No Terraform. No YAML. No glue scripts.
            </p>

            <div className="d-flex flex-wrap gap-3">
              <a href="#early-access" className="btn btn-gradient">
                Join the waitlist
              </a>
              <a href="#how-it-works" className="btn btn-outline-nz">
                See how it works
              </a>
            </div>

            <p className="hero-hint mt-4 mb-0">
              Every dot is a real cloud region. Move your cursor across the map.
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
