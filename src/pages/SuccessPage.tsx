'use client'

import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Header } from '../components/Header'
import Footer from '../components/Footer'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, User, LogOut, Phone, Beaker, Bug, FileWarning, Info } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function SuccessPage() {
  const { user, session, loading, signOut, isTestMode } = useAuth()
  const navigate = useNavigate()
  const [lastVerifiedDate, setLastVerifiedDate] = useState<string>(new Date().toLocaleString())
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [sessionDetails, setSessionDetails] = useState<any>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!loading && !session && !user) {
      // Before redirecting, check localStorage for demo sessions
      try {
        const localSession = localStorage.getItem('supabase.auth.token')
        if (localSession) {
          const parsed = JSON.parse(localSession)
          if (parsed.currentSession?.user) {
            console.log('Found demo session in localStorage')
            // This is a demo session, no need to redirect
            setIsDemoMode(true)
            setSessionDetails(parsed.currentSession)
            return
          }
        }
      } catch (e) {
        console.error('Failed to get demo session from localStorage:', e)
      }
      
      navigate('/login')
    } else if (session) {
      setSessionDetails(session)
    }
    
    // Set a verification date for display
    const now = new Date()
    setLastVerifiedDate(now.toLocaleString())
  }, [loading, session, navigate, user])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }
  
  // Format the phone number in a more readable way
  const formatPhoneNumber = (phone: string | object | null | undefined) => {
    if (!phone) return 'Not available'
    
    let phoneStr = ''
    
    // If it's a user metadata object with phone property
    if (typeof phone === 'object' && phone !== null && 'phone' in phone) {
      phoneStr = String(phone.phone)
    } else if (typeof phone === 'string') {
      phoneStr = phone
    } else {
      return 'Not available'
    }
    
    // Remove non-digits
    const digits = phoneStr.replace(/\D/g, '')
    
    // Simplified international formatting (adjust as needed)
    if (digits.length === 10) {
      // US format
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    } else if (digits.length > 10) {
      // International format (simple version)
      const countryCode = digits.slice(0, digits.length - 10)
      const number = digits.slice(-10)
      return `+${countryCode} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`
    }
    
    return phoneStr
  }

  // Display a loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--nenrin-mist)]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--nenrin-forest)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--nenrin-sage)]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--nenrin-mist)]/10">
      <Header />
      
      <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-[var(--nenrin-bark)]">
              Authentication Successful
            </h2>
            <p className="mt-2 text-sm text-[var(--nenrin-sage)]">
              You have successfully authenticated with WhatsApp
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="space-y-4">
              {/* Mode Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-2 pb-3 mb-2 border-b border-gray-100">
                {isTestMode && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-xs font-medium">
                    <Beaker className="w-3.5 h-3.5" />
                    <span>Test Mode</span>
                  </div>
                )}
                {isDemoMode && (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-purple-800 text-xs font-medium">
                    <Info className="w-3.5 h-3.5" />
                    <span>Demo Mode</span>
                  </div>
                )}
                <button
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-700 text-xs font-medium hover:bg-gray-100"
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>{showDebugInfo ? 'Hide' : 'Show'} Debug Info</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                <User className="w-5 h-5 text-[var(--nenrin-forest)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--nenrin-ink)]">User ID</p>
                  <p className="text-sm text-[var(--nenrin-sage)] truncate max-w-[250px]">{user?.id || 'Not available'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                <Phone className="w-5 h-5 text-[var(--nenrin-forest)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--nenrin-ink)]">Phone Number</p>
                  <p className="text-sm text-[var(--nenrin-sage)]">
                    {formatPhoneNumber(user?.phone || user?.user_metadata?.phone)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-[var(--nenrin-ink)]">Verification Status</p>
                  <p className="text-sm text-[var(--nenrin-sage)]">
                    Verified at {lastVerifiedDate}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 py-2 px-3 bg-[var(--nenrin-mist)] rounded-lg">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </div>
                <p className="text-sm text-[var(--nenrin-sage)]">
                  WhatsApp authentication verified
                  {isTestMode ? ' (Test Mode)' : ''}
                  {isDemoMode ? ' (Demo Mode)' : ''}
                </p>
              </div>
              
              {/* Debug Information */}
              {showDebugInfo && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileWarning className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm font-medium text-gray-700">Debug Information</h4>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">Session Details:</p>
                    <pre className="text-xs font-mono bg-gray-100 p-2 rounded overflow-auto max-h-64">
                      {JSON.stringify(sessionDetails || { session: null }, null, 2)}
                    </pre>
                    
                    <p className="text-xs text-gray-600 mt-4 mb-2">User Object:</p>
                    <pre className="text-xs font-mono bg-gray-100 p-2 rounded overflow-auto max-h-64">
                      {JSON.stringify(user || { user: null }, null, 2)}
                    </pre>
                    
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => {
                          const localStorageSession = localStorage.getItem('supabase.auth.token')
                          alert('LocalStorage session: ' + (localStorageSession ? 'Found' : 'Not found'))
                        }}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded"
                      >
                        Check LocalStorage
                      </button>
                      
                      <button
                        onClick={async () => {
                          try {
                            const { data } = await supabase.auth.getSession()
                            alert('Supabase session: ' + (data.session ? 'Valid' : 'Invalid'))
                          } catch (e) {
                            alert('Error checking session: ' + e)
                          }
                        }}
                        className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded"
                      >
                        Verify Session
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <Button
              onClick={handleLogout}
              className="w-full bg-[var(--nenrin-forest)] hover:bg-[var(--forest-hover)] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-md flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-[var(--nenrin-ink)] font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-sm flex items-center justify-center space-x-2"
            >
              <span>Go to Home Page</span>
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-[var(--nenrin-sage)] leading-relaxed">
              Your session is securely stored and will expire after 30 days of inactivity.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
