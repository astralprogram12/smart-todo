import { createClient } from '@supabase/supabase-js'

// Get environment variables from Vite with fallbacks for frontend-only deployment
const supabaseUrl = import.meta.env.SUPABASE_URL
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY

// Check if we're in frontend-only mode
const isFrontendOnly = supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')

if (isFrontendOnly) {
  console.log('Running in frontend-only mode - Supabase features disabled')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Custom auth functions for WhatsApp authentication
export const whatsappAuth = {
  // Test mode state
  _testMode: false,
  
  // Toggle test mode
  enableTestMode: (enable = true) => {
    whatsappAuth._testMode = enable
    console.log(`Test mode ${enable ? 'enabled' : 'disabled'}`)
    return enable
  },
  
  // Check if test mode is enabled
  isTestMode: () => whatsappAuth._testMode,
  
  // Send OTP code via WhatsApp
  sendOTP: async (phone: string) => {
    if (isFrontendOnly) {
      console.log('Frontend-only mode: Simulating OTP send for', phone)
      return {
        data: { success: true, message: 'Demo mode: OTP would be sent to WhatsApp' },
        error: null
      }
    }
    
    try {
      const response = await supabase.functions.invoke('whatsapp-auth-send-otp', {
        body: { 
          phone,
          test_mode: whatsappAuth._testMode
        },
      })
      
      return response
    } catch (error) {
      console.error('Error sending OTP:', error)
      throw error
    }
  },
  
  // Send OTP code via simplified WhatsApp function with smart 10-minute rate limiting
  sendSimplifiedOTP: async (phone: string, demoMode = false, signupMode = false) => {
    if (isFrontendOnly) {
      console.log('Frontend-only mode: Simulating simplified OTP send for', phone)
      return {
        data: {
          success: true,
          message: 'Demo mode: OTP would be sent to WhatsApp',
          userMessage: 'Demo: Verification code would be sent to your WhatsApp number',
          used_existing_otp: false
        },
        error: null
      }
    }
    
    try {
      console.log('Sending simplified OTP to:', phone, '(Demo mode:', demoMode, ', Signup mode:', signupMode, ')')
      
      const response = await supabase.functions.invoke('simplified-whatsapp-auth-send-otp', {
        body: { 
          phone,
          test_mode: whatsappAuth._testMode,
          demo_mode: demoMode,
          signup_mode: signupMode
        },
      })
      
      // Process the smart rate limiting response
      if (response.data?.success) {
        // Smart rate limiting always returns success
        // The message indicates whether existing OTP was used or new one was sent
        const usedExisting = response.data.used_existing_otp
        const message = response.data.message
        const otpAge = response.data.otp_age_minutes
        
        console.log('Smart OTP response:', {
          message,
          usedExisting,
          otpAge
        })
        
        // Return enhanced response with user-friendly message
        return {
          ...response,
          data: {
            ...response.data,
            userMessage: usedExisting 
              ? `Please check your WhatsApp for the code sent ${otpAge} minute${otpAge !== 1 ? 's' : ''} ago`
              : 'Verification code sent to your WhatsApp number'
          }
        }
      }
      
      return response
    } catch (error) {
      console.error('Error sending simplified OTP:', error)
      throw error
    }
  },
  
  // Verify OTP code and authenticate user
  verifyOTP: async (phone: string, code: string, signupMode = false) => {
    if (isFrontendOnly) {
      console.log('Frontend-only mode: Simulating OTP verification for', phone)
      // Simulate successful verification
      return {
        data: {
          success: true,
          message: 'Demo mode: OTP verification successful',
          user: { phone, id: 'demo-user-id' },
          is_first_login: true,
          is_new_user: signupMode
        },
        error: null
      }
    }
    
    try {
      console.log('Verifying OTP:', { phone, code, testMode: whatsappAuth._testMode, signupMode })
      
      const response = await supabase.functions.invoke('whatsapp-auth-verify-otp', {
        body: { 
          phone, 
          code,
          test_mode: whatsappAuth._testMode,
          signup_mode: signupMode
        },
      })
      
      console.log('OTP verification response:', response)
      
      // If successful, the response will contain a session
      if (response.data?.success && response.data?.session) {
        // In test mode, we skip setting the session since it's not a real session
        if (!whatsappAuth._testMode) {
          console.log('Setting real session in Supabase Auth')
          // Set the session in Supabase Auth
          const sessionResult = await supabase.auth.setSession({
            access_token: response.data.session.access_token,
            refresh_token: response.data.session.refresh_token,
          })
          
          console.log('Session set result:', sessionResult)
          
          // Verify the session was set correctly
          const currentSession = await supabase.auth.getSession()
          console.log('Current session after setting:', currentSession)
        } else {
          console.log('Test mode: Not setting real session')
        }
        
        // Store first login status and plan info in sessionStorage
        try {
          if (response.data.is_first_login !== undefined) {
            sessionStorage.setItem('is_first_login', response.data.is_first_login.toString())
          }
          
          if (response.data.is_new_user !== undefined) {
            sessionStorage.setItem('is_new_user', response.data.is_new_user.toString())
          }
          
          if (response.data.plan_info) {
            sessionStorage.setItem('plan_info', JSON.stringify(response.data.plan_info))
          }
          console.log('Stored auth data in sessionStorage:', { 
            is_first_login: response.data.is_first_login,
            is_new_user: response.data.is_new_user,
            plan_info: response.data.plan_info 
          })
        } catch (storageError) {
          console.error('Error storing session data:', storageError)
        }
      } else if (response.error) {
        console.error('Error in verification response:', response.error)
        return { data: null, error: response.error }
      }
      
      return response
    } catch (error) {
      console.error('Error verifying OTP:', error)
      throw error
    }
  },
  
  // Verify OTP code using simplified function
  verifySimplifiedOTP: async (phone: string, code: string, skipVerification = false, signupMode = false) => {
    if (isFrontendOnly) {
      console.log('Frontend-only mode: Simulating simplified OTP verification for', phone)
      // Simulate successful verification
      return {
        data: {
          success: true,
          message: 'Demo mode: OTP verification successful',
          user: { phone, id: 'demo-user-id' },
          is_first_login: true,
          is_new_user: signupMode
        },
        error: null
      }
    }
    
    try {
      console.log('Verifying simplified OTP:', { 
        phone, 
        code, 
        testMode: whatsappAuth._testMode,
        skipVerification,
        signupMode
      })
      
      const response = await supabase.functions.invoke('simplified-whatsapp-auth-verify-otp', {
        body: { 
          phone, 
          code,
          test_mode: whatsappAuth._testMode,
          skip_verification: skipVerification,
          signup_mode: signupMode
        },
      })
      
      console.log('Simplified OTP verification response:', response)
      
      // If successful, the response will contain a session
      if (response.data?.success && response.data?.session) {
        // In test mode or demo mode, we skip setting the real session
        if (!whatsappAuth._testMode && !response.data?.demo_mode && !response.data?.skip_verification) {
          console.log('Setting real session in Supabase Auth')
          // Set the session in Supabase Auth
          try {
            const sessionResult = await supabase.auth.setSession({
              access_token: response.data.session.access_token,
              refresh_token: response.data.session.refresh_token,
            })
            
            console.log('Session set result:', sessionResult)
            
            // Verify the session was set correctly
            const currentSession = await supabase.auth.getSession()
            console.log('Current session after setting:', currentSession)
            
            // Store plan information and first login status in sessionStorage
            try {
              if (response.data.user) {
                // Store first login status
                sessionStorage.setItem('is_first_login', response.data.user.is_new_user ? 'true' : 'false')
                sessionStorage.setItem('is_new_user', response.data.user.is_new_user ? 'true' : 'false')
                
                // Store plan information
                const planInfo = {
                  plan: response.data.user.plan || 'free',
                  plan_start: response.data.user.plan_start,
                  plan_end: response.data.user.plan_end
                }
                sessionStorage.setItem('plan_info', JSON.stringify(planInfo))
                console.log('Stored user data in sessionStorage:', { 
                  is_first_login: response.data.user.is_new_user,
                  is_new_user: response.data.user.is_new_user,
                  plan_info: planInfo 
                })
              }
            } catch (storageError) {
              console.error('Error storing session data:', storageError)
            }
          } catch (sessionError) {
            console.error('Failed to set session:', sessionError)
            // Continue anyway since we're in simplified mode
          }
        } else {
          console.log('Test/Demo mode: Not setting real session')
          // For simplified version, store demo session in localStorage
          if (response.data?.demo_mode || response.data?.skip_verification) {
            try {
              // Store a fake session for demo purposes
              const demoSession = {
                provider_token: null,
                provider_refresh_token: null,
                access_token: response.data.session.access_token,
                refresh_token: response.data.session.refresh_token,
                expires_in: 3600,
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                token_type: 'bearer',
                user: response.data.session.user
              }
              localStorage.setItem('supabase.auth.token', JSON.stringify({
                currentSession: demoSession,
                expiresAt: Date.now() + 3600 * 1000
              }))
              console.log('Stored demo session in localStorage')
              
              // Store plan information and first login status in sessionStorage for demo mode
              try {
                // Demo mode always counts as first login
                sessionStorage.setItem('is_first_login', 'true')
                sessionStorage.setItem('is_new_user', 'true')
                
                // Demo plan information
                const planInfo = {
                  plan: 'pro',
                  plan_start: new Date().toISOString().split('T')[0],
                  plan_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                }
                sessionStorage.setItem('plan_info', JSON.stringify(planInfo))
              } catch (storageError) {
                console.error('Error storing demo session data:', storageError)
              }
            } catch (e) {
              console.error('Failed to store demo session:', e)
            }
          }
        }
      } else if (response.error) {
        console.error('Error in verification response:', response.error)
        return { data: null, error: response.error }
      }
      
      return response
    } catch (error) {
      console.error('Error verifying simplified OTP:', error)
      throw error
    }
  },
  
  // Sign out current user
  signOut: async () => {
    try {
      // First try to remove local storage session
      try {
        localStorage.removeItem('supabase.auth.token')
      } catch (e) {
        console.error('Failed to remove local storage session:', e)
      }
      
      // Then try to sign out through Supabase
      return await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  },
  
  // Get current session
  getSession: async () => {
    return await supabase.auth.getSession()
  },
  
  // Get current user
  getUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Error getting user:', error)
      // Try to get from localStorage
      try {
        const localSession = localStorage.getItem('supabase.auth.token')
        if (localSession) {
          const parsed = JSON.parse(localSession)
          return parsed.currentSession?.user || null
        }
      } catch (e) {
        console.error('Failed to get user from localStorage:', e)
      }
      return null
    }
  }
}
