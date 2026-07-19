const FEATURES = [
  {
    icon: '🧩',
    title: 'Visual chain builder',
    description:
      'Drag, drop, and connect cloud services on a graphical canvas. Your architecture is the diagram — no separate docs to keep in sync.',
  },
  {
    icon: '✨',
    title: 'AI-powered orchestration',
    description:
      'Describe the outcome you want in plain language. Nazmo AI assembles, configures, and wires the service chain for you.',
  },
  {
    icon: '🚫',
    title: 'Zero IaC required',
    description:
      'No Terraform, no YAML, no boilerplate scripts. Nazmo generates and manages the underlying infrastructure automatically.',
  },
  {
    icon: '☁️',
    title: 'Multi-cloud native',
    description:
      'Orchestrate services across AWS, Azure, GCP, and beyond from a single canvas, without juggling provider-specific tooling.',
  },
  {
    icon: '📡',
    title: 'Live chain monitoring',
    description:
      'Watch requests and data flow through your service chain in real time, with observability built into the graph itself.',
  },
  {
    icon: '⚡',
    title: 'One-click deploy',
    description:
      'Turn a visual design into a running, connected service chain instantly — then iterate on the same canvas.',
  },
]

export default function Features() {
  return (
    <section id="features" className="section">
      <div className="container">
        <div className="row justify-content-center text-center mb-5 reveal">
          <div className="col-lg-7">
            <span className="eyebrow justify-content-center">Features</span>
            <h2 className="display-6">Everything to orchestrate, nothing to write</h2>
            <p className="text-muted fs-5 mt-3">
              Nazmo AI replaces config files and glue scripts with a canvas an
              AI can actually reason about.
            </p>
          </div>
        </div>
        <div className="row g-4">
          {FEATURES.map((feature, i) => (
            <div className="col-md-6 col-lg-4 reveal" style={{ transitionDelay: `${i * 60}ms` }} key={feature.title}>
              <div className="nz-card">
                <div className="nz-card-icon">{feature.icon}</div>
                <h3 className="h5 mb-2">{feature.title}</h3>
                <p className="text-muted mb-0">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
