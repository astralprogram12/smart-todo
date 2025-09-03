'use client'

import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Header } from '../components/Header'
import Footer from '../components/Footer'
import { Link, useNavigate } from 'react-router-dom'
import { Smartphone, ShieldCheck } from 'lucide-react'
import { SimplifiedOTPVerification } from '../components/SimplifiedOTPVerification'
import PhoneInput from 'react-phone-number-input'
import { useAuth } from '../contexts/AuthContext'
import 'react-phone-number-input/style.css'

export default function SimplifiedLoginPage() {
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOTPVerification, setShowOTPVerification] = useState(false)
  const [generatedTestCode, setGeneratedTestCode] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)

  
  const { sendSimplifiedWhatsAppOTP, setAuthSession } = useAuth()
  const navigate = useNavigate()

  // Check for remembered login on component mount
  useEffect(() => {
    const rememberedUser = localStorage.getItem('nenrin_remember_me')
    const rememberExpiry = localStorage.getItem('nenrin_remember_expiry')
    const savedPhone = localStorage.getItem('nenrin_user_phone')
    
    if (rememberedUser === 'true' && rememberExpiry && savedPhone) {
      const expiryDate = new Date(rememberExpiry)
      const currentDate = new Date()
      
      // Check if remember me is still valid (within 30 days)
      if (currentDate < expiryDate) {
        setPhoneNumber(savedPhone)
        setRememberMe(true)
      } else {
        // Clear expired remember me data
        localStorage.removeItem('nenrin_remember_me')
        localStorage.removeItem('nenrin_remember_expiry')
        localStorage.removeItem('nenrin_user_phone')
      }
    }
  }, [])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber) {
      setError('Please enter your phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Send OTP via WhatsApp using our Edge Function
      const { data, error } = await sendSimplifiedWhatsAppOTP(phoneNumber, false, false)
      console.log('Send OTP response:', data, error)

      if (error) {
        // Handle rate limiting info
        if (error.rate_limited && error.seconds_remaining) {
          const minutes = Math.floor(error.seconds_remaining / 60)
          const seconds = error.seconds_remaining % 60
          setError(`Please wait ${minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : ''} ${seconds > 0 ? `${seconds} second${seconds !== 1 ? 's' : ''}` : ''} before requesting another code. (${error.request_count} attempt${error.request_count !== 1 ? 's' : ''})`)
        } else if (error.redirect_to_signup) {
          // User doesn't exist, redirect to signup
          setError('Phone number not registered. Please sign up first.')
          setTimeout(() => {
            navigate('/signup')
          }, 2000)
          return
        } else {
          setError(error.message || 'Failed to send verification code')
        }
        return
      }
      
      // Handle rate limiting info
      if (data?.rate_limited) {
        const { seconds_remaining, request_count } = data;
        const minutes = Math.floor(seconds_remaining / 60);
        const seconds = seconds_remaining % 60;
        // Set warning message but still proceed to verification page
        setError(`Please wait ${minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : ''} ${seconds > 0 ? `${seconds} second${seconds !== 1 ? 's' : ''}` : ''} before requesting another code. (${request_count} attempt${request_count !== 1 ? 's' : ''})`);
        
        // Store the test code if available
        if (data?.debug?.testCode) {
          setGeneratedTestCode(data.debug.testCode);
          console.log('Test code received in login page:', data.debug.testCode);
        } else {
          setGeneratedTestCode(null);
        }

        // Still show OTP verification screen
        setShowOTPVerification(true);
        return;
      }
      
      // Store the test code if available
      if (data?.debug?.testCode) {
        setGeneratedTestCode(data.debug.testCode)
        console.log('Test code received in login page:', data.debug.testCode)
      } else {
        setGeneratedTestCode(null)
      }

      // Show OTP verification screen
      setShowOTPVerification(true)
    } catch (err: any) {
      setError('Network error. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOTPVerified = async (data: any) => {
    if (data.session) {
      await setAuthSession(data.session)
    }

    // Store first login status and plan info
    if (data?.is_first_login !== undefined) {
      sessionStorage.setItem('is_first_login', data.is_first_login.toString())
    }
    
    if (data?.plan_info) {
      sessionStorage.setItem('plan_info', JSON.stringify(data.plan_info))
    }
    
    // Handle remember me functionality
    if (rememberMe) {
      // Store remember me preference in localStorage for 30 days
      const rememberExpiry = new Date()
      rememberExpiry.setDate(rememberExpiry.getDate() + 30)
      localStorage.setItem('nenrin_remember_me', 'true')
      localStorage.setItem('nenrin_remember_expiry', rememberExpiry.toISOString())
      localStorage.setItem('nenrin_user_phone', phoneNumber || '')
    } else {
      // Clear remember me data if not checked
      localStorage.removeItem('nenrin_remember_me')
      localStorage.removeItem('nenrin_remember_expiry')
      localStorage.removeItem('nenrin_user_phone')
    }
    
    // Redirect to dashboard page
    navigate('/dashboard')
  }

  if (showOTPVerification) {
    return (
      <div className="min-h-screen auth-rings">
        <Header />
        <SimplifiedOTPVerification
          phone={phoneNumber || ''}
          onVerified={handleOTPVerified}
          onBack={() => setShowOTPVerification(false)}
          initialTestCode={generatedTestCode}
          isSignup={false}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen auth-rings">
      <Header />
      
      <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--nenrin-forest)] rounded-full mb-6">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-[var(--nenrin-bark)]">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-[var(--nenrin-sage)]">
              Sign in with your WhatsApp number
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-[var(--nenrin-mist)] p-4 rounded-lg border border-[var(--nenrin-forest)]/20">
            <div className="flex items-center space-x-3 mb-2">
              <ShieldCheck className="w-5 h-5 text-[var(--nenrin-forest)]" />
              <h3 className="font-medium text-[var(--nenrin-ink)]">Secure WhatsApp Login</h3>
            </div>
            <p className="text-sm text-[var(--nenrin-sage)]">
              Enter your WhatsApp number and we'll send you a verification code.
            </p>

          </div>

          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[var(--nenrin-ink)]">
                  WhatsApp Phone Number
                </label>
                <div className="mt-1">
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="ID"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    className="phone-input"
                    placeholder="Enter your WhatsApp number"
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--nenrin-sage)]">
                  Format: +62 812 3456 7890 (with country code)
                </p>
              </div>
              
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[var(--nenrin-forest)] focus:ring-[var(--nenrin-forest)] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-[var(--nenrin-ink)]">
                  Remember me for 30 days
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !phoneNumber}
              className="w-full bg-[var(--nenrin-forest)] hover:bg-[var(--forest-hover)] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-md disabled:opacity-50"
            >
              {loading ? 'Sending verification code...' : 'Continue with WhatsApp'}
            </Button>

          </form>

          <div className="text-center">
            <p className="text-sm text-[var(--nenrin-sage)]">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-[var(--nenrin-forest)] hover:text-[var(--forest-hover)]">
                Sign up
              </Link>
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-[var(--nenrin-sage)] leading-relaxed">
              By continuing, you agree to receive verification messages via WhatsApp.
              Standard messaging rates may apply.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
