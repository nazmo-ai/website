import type { ReactNode } from 'react'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const FEATURES = [
  {
    title: 'Intent becomes architecture',
    description:
      'Describe the outcome in plain language. Nazmo resolves it into a concrete service chain, choosing managed offerings over glue code wherever one exists.',
    icon: (
      <Icon>
        <path d="M4 7h9M4 12h16M4 17h6" />
        <circle cx="17.5" cy="7" r="2.5" />
        <circle cx="13.5" cy="17" r="2.5" />
      </Icon>
    ),
  },
  {
    title: 'Placement across every cloud',
    description:
      'Each service lands on the provider and region that actually fits — weighed on data residency, latency to your users, and who offers the primitive at all.',
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
      </Icon>
    ),
  },
  {
    title: 'Cost modelled before commit',
    description:
      'The whole topology is priced across candidate providers and regions, with the delta against what you run today, before a single resource exists.',
    icon: (
      <Icon>
        <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
      </Icon>
    ),
  },
  {
    title: 'Approvals that actually block',
    description:
      'The run stops at the gate. A person signs off on the design and the spend, and every decision is recorded against the run that produced it.',
    icon: (
      <Icon>
        <path d="M12 3l7.5 3v5.5c0 4.4-3 8.3-7.5 9.5-4.5-1.2-7.5-5.1-7.5-9.5V6z" />
        <path d="M9 12l2.2 2.2L15.5 10" />
      </Icon>
    ),
  },
  {
    title: 'Deploy without writing IaC',
    description:
      'Approved topologies are provisioned in dependency order across each provider, and rolled back together if any step fails. No Terraform to maintain.',
    icon: (
      <Icon>
        <path d="M12 3c3.2 2.4 5 6 5 9.8V17H7v-4.2C7 9 8.8 5.4 12 3z" />
        <circle cx="12" cy="10.5" r="2" />
        <path d="M9 20l1.5-2M15 20l-1.5-2" />
      </Icon>
    ),
  },
  {
    title: 'Self-healing at runtime',
    description:
      'Faults are localised before anything changes, then repaired with the smallest fix that restores the approved design. What it cannot fix, it escalates.',
    icon: (
      <Icon>
        <path d="M20 12a8 8 0 1 1-2.6-5.9" />
        <path d="M20 3v4.5h-4.5" />
        <path d="M9.5 12l1.8 1.8 3.4-3.6" />
      </Icon>
    ),
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
              Nazmo.AI replaces config files and glue scripts with a system an AI
              can reason about and a person can still govern.
            </p>
          </div>
        </div>

        <div className="row g-4">
          {FEATURES.map((feature, i) => (
            <div
              className="col-md-6 col-lg-4 reveal"
              style={{ transitionDelay: `${i * 60}ms` }}
              key={feature.title}
            >
              <div className="nz-card h-100">
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
