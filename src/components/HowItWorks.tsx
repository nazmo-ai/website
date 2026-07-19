const STEPS = [
  {
    title: 'Design',
    description:
      'Drag cloud services onto the canvas and connect them into a chain — the graph is your architecture.',
  },
  {
    title: 'Describe',
    description:
      'Tell Nazmo AI what the chain should do in plain language. It fills in the connections and configuration.',
  },
  {
    title: 'Orchestrate',
    description:
      'Nazmo validates the chain, provisions the underlying services, and wires them together across your cloud providers.',
  },
  {
    title: 'Observe',
    description:
      'Watch the chain run live and adjust it visually — changes apply directly, with no redeploy scripts to maintain.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section section-alt">
      <div className="container">
        <div className="row justify-content-center text-center mb-5 reveal">
          <div className="col-lg-7">
            <span className="eyebrow justify-content-center">How it works</span>
            <h2 className="display-6">From idea to running chain, visually</h2>
          </div>
        </div>
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {STEPS.map((step, i) => (
              <div className="d-flex reveal" style={{ transitionDelay: `${i * 80}ms` }} key={step.title}>
                <div className="d-flex flex-column align-items-center">
                  <span className="step-number">{i + 1}</span>
                  {i < STEPS.length - 1 && <div className="step-connector" />}
                </div>
                <div className="ms-4 pb-5">
                  <h3 className="h5 mb-2">{step.title}</h3>
                  <p className="text-muted mb-0">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
