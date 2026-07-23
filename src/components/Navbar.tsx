const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#early-access', label: 'Early access' },
]

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-md nz-navbar fixed-top py-3">
      <div className="container">
        <a className="navbar-brand nz-brand" href="#top">
          <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
            <defs>
              <linearGradient id="brand-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7c5cff" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="14" fill="#10182b" />
            <circle cx="18" cy="32" r="6" fill="url(#brand-gradient)" />
            <circle cx="46" cy="16" r="6" fill="url(#brand-gradient)" />
            <circle cx="46" cy="48" r="6" fill="url(#brand-gradient)" />
            <path
              d="M23 30 L41 18 M23 34 L41 46"
              stroke="url(#brand-gradient)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          Nazmo.AI
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#nzNavbarContent"
          aria-controls="nzNavbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="nzNavbarContent">
          <ul className="navbar-nav ms-auto align-items-md-center gap-1">
            {NAV_LINKS.map((link) => (
              <li className="nav-item" key={link.href}>
                <a className="nav-link nz-nav-link" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
            <li className="nav-item ms-md-2 mt-2 mt-md-0">
              <a className="btn btn-gradient btn-sm" href="#early-access">
                Get early access
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
