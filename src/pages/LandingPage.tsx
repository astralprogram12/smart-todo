'use client'

import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Header } from '../components/Header'
import Footer from '../components/Footer'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, User, LogOut, Phone, CalendarDays, Star, Beaker, Bug, FileWarning, Info, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function LandingPage() {
  const { user, session, loading, signOut, isTestMode } = useAuth()
  const navigate = useNavigate()
  const [lastLoginDate, setLastLoginDate] = useState<string>(new Date().toLocaleString())
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [sessionDetails, setSessionDetails] = useState<any>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [isFirstLogin, setIsFirstLogin] = useState(false)
  const [planInfo, setPlanInfo] = useState<{plan: string, plan_start?: string, plan_end?: string} | null>(null)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    // Check for first login status and plan info in sessionStorage
    try {
      const storedFirstLogin = sessionStorage.getItem('is_first_login')
      const storedPlanInfo = sessionStorage.getItem('plan_info')
      
      if (storedFirstLogin) {
        setIsFirstLogin(storedFirstLogin === 'true')
      }
      
      if (storedPlanInfo) {
        setPlanInfo(JSON.parse(storedPlanInfo))
      }
    } catch (error) {
      console.error('Error retrieving session data:', error)
    }
    
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
            setUserData(parsed.currentSession.user)
            return
          }
        }
      } catch (e) {
        console.error('Failed to get demo session from localStorage:', e)
      }
      
      navigate('/login')
    } else if (session) {
      setSessionDetails(session)
      setUserData(session.user)
      
      // Fetch user data from the database
      const fetchUserData = async () => {
        if (!user?.id) return
        
        try {
          const { data, error } = await supabase
            .from('user_whatsapp')
            .select('*')
            .eq('user_id', user.id)
            .single()
            
          if (error) {
            console.error('Error fetching user data:', error)
          } else if (data) {
            // Update plan info if not already set
            if (!planInfo) {
              setPlanInfo({
                plan: data.plan || 'free',
                plan_start: data.plan_start,
                plan_end: data.plan_end
              })
            }
            
            // Set last login date
            if (data.last_login) {
              setLastLoginDate(new Date(data.last_login).toLocaleString())
            }
          }
        } catch (error) {
          console.error('Error in fetchUserData:', error)
        }
      }
      
      fetchUserData()
    }
  }, [loading, session, navigate, user, planInfo])

  const handleLogout = async () => {
    // Clear session storage on logout
    sessionStorage.removeItem('is_first_login')
    sessionStorage.removeItem('plan_info')
    
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
  
  // Format date in a more readable way
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Not available'
    
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (e) {
      return dateStr
    }
  }

  // Calculate days remaining until plan expiration
  const calculateDaysRemaining = (endDateStr: string | undefined) => {
    if (!endDateStr) return null
    
    try {
      const endDate = new Date(endDateStr)
      const today = new Date()
      
      // Reset time part to compare dates only
      endDate.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)
      
      const diffTime = endDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return diffDays > 0 ? diffDays : 0
    } catch (e) {
      return null
    }
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

  // Get days remaining until plan expiration
  const daysRemaining = calculateDaysRemaining(planInfo?.plan_end)
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--nenrin-mist)]/10 to-white">
      <Header />
      
      <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg space-y-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            {isFirstLogin ? (
              <>
                <h2 className="mt-6 text-3xl font-bold text-[var(--nenrin-bark)]">
                  Congratulations on your first login!
                </h2>
                <p className="mt-2 text-[var(--nenrin-sage)]">
                  Welcome to Nenrin. You've been automatically enrolled in our Pro plan for 30 days.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-6 text-3xl font-bold text-[var(--nenrin-bark)]">
                  Welcome back!
                </h2>
                <p className="mt-2 text-[var(--nenrin-sage)]">
                  It's good to see you again. Here's your account information.
                </p>
              </>
            )}
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
              
              {/* Plan Information - Highlighted Card */}
              <div className={
                `p-4 rounded-lg mb-4 ${planInfo?.plan === 'pro' 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200' 
                  : 'bg-gray-50 border border-gray-200'}`
              }>
                <div className="flex items-start space-x-4">
                  <div className={
                    `w-10 h-10 rounded-full flex items-center justify-center ${planInfo?.plan === 'pro'
                      ? 'bg-blue-100' 
                      : 'bg-gray-200'}`
                  }>
                    <Star className={`w-5 h-5 ${planInfo?.plan === 'pro' ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-semibold ${planInfo?.plan === 'pro' ? 'text-blue-800' : 'text-gray-800'}`}>
                          {planInfo?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                        </h3>
                        {planInfo?.plan === 'pro' ? (
                          <p className="text-sm text-blue-700">
                            Access to all premium features
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600">
                            Basic access
                          </p>
                        )}
                      </div>
                      
                      {planInfo?.plan === 'pro' && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 rounded-full">
                          <Clock className="w-3 h-3 text-blue-700" />
                          <span className="text-xs font-semibold text-blue-700">
                            {daysRemaining !== null ? `${daysRemaining} days left` : 'Active'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {planInfo?.plan_start && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-xs text-gray-500">Started</span>
                          <p className={`${planInfo?.plan === 'pro' ? 'text-blue-700' : 'text-gray-700'}`}>
                            {formatDate(planInfo.plan_start)}
                          </p>
                        </div>
                        {planInfo.plan_end && (
                          <div>
                            <span className="text-xs text-gray-500">Expires</span>
                            <p className={`${planInfo?.plan === 'pro' ? 'text-blue-700' : 'text-gray-700'}`}>
                              {formatDate(planInfo.plan_end)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* User Information */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                  <User className="w-5 h-5 text-[var(--nenrin-forest)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--nenrin-ink)]">User ID</p>
                    <p className="text-sm text-[var(--nenrin-sage)] truncate max-w-[300px]">{userData?.id || 'Not available'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                  <Phone className="w-5 h-5 text-[var(--nenrin-forest)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--nenrin-ink)]">Phone Number</p>
                    <p className="text-sm text-[var(--nenrin-sage)]">
                      {formatPhoneNumber(userData?.phone || userData?.user_metadata?.phone)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                  <CalendarDays className="w-5 h-5 text-[var(--nenrin-forest)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--nenrin-ink)]">Last Login</p>
                    <p className="text-sm text-[var(--nenrin-sage)]">
                      {lastLoginDate}
                    </p>
                  </div>
                </div>
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
                    <pre className="text-xs font-mono bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(sessionDetails || { session: null }, null, 2)}
                    </pre>
                    
                    <p className="text-xs text-gray-600 mt-4 mb-2">User Object:</p>
                    <pre className="text-xs font-mono bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(userData || { user: null }, null, 2)}
                    </pre>
                    
                    <p className="text-xs text-gray-600 mt-4 mb-2">Plan Info:</p>
                    <pre className="text-xs font-mono bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(planInfo || { plan: null }, null, 2)}
                    </pre>
                    
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => {
                          setIsFirstLogin(!isFirstLogin)
                          sessionStorage.setItem('is_first_login', (!isFirstLogin).toString())
                        }}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded"
                      >
                        Toggle First Login
                      </button>
                      
                      <button
                        onClick={() => {
                          const newPlan = planInfo?.plan === 'pro' ? 'free' : 'pro'
                          const newPlanInfo = {
                            plan: newPlan,
                            plan_start: new Date().toISOString().split('T')[0],
                            plan_end: newPlan === 'pro' 
                              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                              : undefined
                          }
                          setPlanInfo(newPlanInfo)
                          sessionStorage.setItem('plan_info', JSON.stringify(newPlanInfo))
                        }}
                        className="px-2 py-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded"
                      >
                        Toggle Plan
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
