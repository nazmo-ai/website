import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#approvals', label: 'Approvals' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`navbar navbar-expand-md nz-navbar fixed-top py-3${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container">
        <a className="navbar-brand nz-brand" href="#top">
          <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
            <defs>
              <linearGradient id="brand-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--nz-accent-1)" />
                <stop offset="100%" stopColor="var(--nz-accent-2)" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="14" fill="url(#brand-gradient)" opacity="0.14" />
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

        <div className="d-flex align-items-center gap-2 order-md-last ms-md-3">
          <ThemeToggle />
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
        </div>

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
