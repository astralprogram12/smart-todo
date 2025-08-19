'use client'

import { Header } from '../components/Header'
import { ChatDemo } from '../components/ChatDemo'
import { TrustedCompanies } from '../components/TrustedCompanies'
import { HowItWorks } from '../components/HowItWorks'
import { PricingSection } from '../components/PricingSection'
import { TestimonySection } from '../components/TestimonySection'
import Footer from '../components/Footer'
import { Button } from '../components/ui/button'
import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--nenrin-mist)]">
      <Header />

      {/* Hero Section with concentric rings background */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 hero-rings">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center hero-content">
            {/* Left side - Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="font-heading font-bold text-[40px] lg:text-[48px] text-[var(--nenrin-bark)] leading-tight tracking-[0.02em]">
                  Grow your progress, one ring at a time.
                </h1>
                <p className="font-body text-[18px] text-[#0E0F10] leading-[1.5] max-w-xl">
                  Nenrin helps you work with focus, not frenzy — guiding your day in plain language so you can make
                  steady, lasting progress.
                </p>
              </div>

              <div className="space-y-4">
                <Link to="/signup">
                  <Button
                    size="lg"
                    className="bg-[var(--nenrin-forest)] hover:bg-[var(--forest-hover)] text-white font-semibold px-8 py-4 text-lg rounded-lg transition-all duration-200 hover:shadow-lg hover:brightness-105"
                  >
                    Get started with WhatsApp
                  </Button>
                </Link>
                <p className="font-body text-sm text-[var(--nenrin-ink)]/70">Secure signup with your WhatsApp number. No passwords required.</p>
              </div>
            </div>

            {/* Right side - Chat Demo */}
            <div className="flex justify-center lg:justify-end">
              <ChatDemo />
            </div>
          </div>
        </div>
      </section>

      {/* All major sections */}
      <TrustedCompanies />
      <HowItWorks />
      <PricingSection />
      <TestimonySection />
      <Footer />
    </div>
  )
}