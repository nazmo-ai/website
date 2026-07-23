export default function Footer() {
  return (
    <footer className="nz-footer">
      <div className="container">
        <div className="row align-items-center gy-3">
          <div className="col-md-6">
            <div className="nz-brand mb-1">Nazmo.AI</div>
            <p className="text-muted mb-0">Poetry in Cloud — orchestrating cloud poetry.</p>
          </div>
          <div className="col-md-6 text-md-end">
            <nav className="d-flex gap-4 justify-content-md-end">
              <a href="#features" className="nz-nav-link text-decoration-none">Features</a>
              <a href="#how-it-works" className="nz-nav-link text-decoration-none">How it works</a>
              <a href="#early-access" className="nz-nav-link text-decoration-none">Early access</a>
            </nav>
          </div>
        </div>
        <hr className="my-4" style={{ borderColor: 'var(--nz-border)' }} />
        <p className="text-muted small mb-0">
          &copy; {new Date().getFullYear()} Nazmo.AI. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
