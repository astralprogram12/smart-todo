import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[var(--nenrin-mist)] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Product Section */}
          <div>
            <h3 className="font-semibold text-[var(--nenrin-ink)] mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#how-it-works"
                  className="text-[var(--nenrin-sage)] hover:text-[var(--nenrin-forest)] transition-colors"
                >
                  How it Works
                </a>
              </li>
              <li>
                <Link to="/features" className="text-[var(--nenrin-sage)] hover:text-[var(--nenrin-forest)] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <a href="#pricing" className="text-[var(--nenrin-sage)] hover:text-[var(--nenrin-forest)] transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#examples" className="text-[var(--nenrin-sage)] hover:text-[var(--nenrin-forest)] transition-colors">
                  Examples
                </a>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="font-semibold text-[var(--nenrin-ink)] mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-[var(--nenrin-sage)] hover:text-[var(--nenrin-forest)] transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="font-semibold text-[var(--nenrin-ink)] mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-[var(--nenrin-sage)] hover:text-[var(--nenrin-forest)] transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-[var(--nenrin-sage)] hover:text-[var(--nenrin-forest)] transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          {/* Copyright */}
          <div className="md:text-right">
            <p className="text-[var(--nenrin-sage)] text-sm">© Nenrin, Inc.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}