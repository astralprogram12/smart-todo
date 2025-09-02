'use client'

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { useAuth } from "../contexts/AuthContext"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, signOut } = useAuth()
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with concentric circles design */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--nenrin-forest)] relative">
              <div className="absolute inset-1 rounded-full border border-[var(--nenrin-forest)]"></div>
              <div className="absolute inset-2 rounded-full border border-[var(--nenrin-forest)]"></div>
            </div>
            <span className="font-heading font-bold text-xl text-[var(--nenrin-bark)]">Nenrin</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="/#how-it-works"
              className="font-body text-[var(--nenrin-ink)] hover:text-[var(--nenrin-forest)] transition-colors"
            >
              How it Works
            </a>
            <Link
              to="/features"
              className="font-body text-[var(--nenrin-ink)] hover:text-[var(--nenrin-forest)] transition-colors"
            >
              Features
            </Link>
            <a
              href="/#pricing"
              className="font-body text-[var(--nenrin-ink)] hover:text-[var(--nenrin-forest)] transition-colors"
            >
              Pricing
            </a>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => changeLanguage(i18n.language === "en" ? "id" : "en")}
              variant="outline"
              className="font-body"
              data-testid="language-switcher"
            >
              {i18n.language === "en" ? "EN" : "ID"}
            </Button>
            {user ? (
              <>
                <span className="font-body text-[var(--nenrin-ink)]">Welcome back!</span>
                <Button
                  onClick={() => signOut()}
                  className="bg-[var(--nenrin-forest)] hover:bg-[var(--forest-hover)] text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md hover:brightness-105"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-body text-[var(--nenrin-ink)] hover:text-[var(--nenrin-forest)] transition-colors"
                >
                  Log in
                </Link>
                <Link to="/signup">
                  <Button className="bg-[var(--nenrin-forest)] hover:bg-[var(--forest-hover)] text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md hover:brightness-105">
                    Sign up free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}