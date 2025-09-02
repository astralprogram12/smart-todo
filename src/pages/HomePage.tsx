'use client'

import { Header } from '../components/Header'
import  ChatDemo  from '../components/ChatDemo'
import { TrustedCompanies } from '../components/TrustedCompanies'
import { HowItWorks } from '../components/HowItWorks'
import { PricingSection } from '../components/PricingSection'
import { TestimonySection } from '../components/TestimonySection'
import Footer from '../components/Footer'
import { Button } from '../components/ui/button'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
// FIX 1: Corrected the import path from '../../' to '../'
import { useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const { t } = useTranslation()
  // FIX 2: Use `user` and `signOut` from your actual AuthContext
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      // Call the signOut function from the context
      await signOut();
      console.log("User signed out successfully.");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

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
                  {user ? t('homepage_title_logged_in') : t('homepage_title_logged_out')}
                </h1>
                <p className="font-body text-[18px] text-[#0E0F10] leading-[1.5] max-w-xl">
                  {t('homepage_subtitle')}
                </p>
              </div>

              <div className="space-y-4">
                {/* Conditionally render buttons based on user login state */}
                {user ? (
                  // If the user is logged in, show the Logout button
                  <Button
                    size="lg"
                    onClick={handleLogout} // Call the correct handler
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 text-lg rounded-lg transition-all duration-200 hover:shadow-lg"
                  >
                    {t('sign_out')}
                  </Button>
                ) : (
                  // If the user is NOT logged in, show the original signup button
                  <>
                    <Link to="/signup">
                      <Button
                        size="lg"
                        className="bg-[var(--nenrin-forest)] hover:bg-[var(--forest-hover)] text-white font-semibold px-8 py-4 text-lg rounded-lg transition-all duration-200 hover:shadow-lg hover:brightness-105"
                      >
                        {t('get_started_whatsapp')}
                      </Button>
                    </Link>
                    <p className="font-body text-sm text-[var(--nenrin-ink)]/70">{t('secure_signup_info')}</p>
                  </>
                )}
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