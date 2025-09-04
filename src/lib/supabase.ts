import { createClient } from '@supabase/supabase-js'

// Get environment variables from Vite with fallbacks for frontend-only deployment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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
        error: null,
      }
    }

    try {
      const response = await supabase.functions.invoke('whatsapp-auth-send-otp', {
        // ✅ FIX: Add the headers object here
        headers: {
          'apikey': supabaseAnonKey,
        },
        body: {
          phone,
          test_mode: whatsappAuth._testMode,
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
          used_existing_otp: false,
        },
        error: null,
      }
    }

    try {
      console.log('Sending simplified OTP to:', phone, '(Demo mode:', demoMode, ', Signup mode:', signupMode, ')')

      const response = await supabase.functions.invoke('simplified-whatsapp-auth-send-otp', {
        // ✅ FIX: Add the headers object here
        headers: {
          'apikey': supabaseAnonKey,
        },
        body: {
          phone,
          test_mode: whatsappAuth._testMode,
          demo_mode: demoMode,
          signup_mode: signupMode,
        },
      })

      // Process the smart rate limiting response
      if (response.data?.success) {
        const usedExisting = response.data.used_existing_otp
        const message = response.data.message
        const otpAge = response.data.otp_age_minutes

        console.log('Smart OTP response:', {
          message,
          usedExisting,
          otpAge,
        })

        // Return enhanced response with user-friendly message
        return {
          ...response,
          data: {
            ...response.data,
            userMessage: usedExisting
              ? `Please check your WhatsApp for the code sent ${otpAge} minute${otpAge !== 1 ? 's' : ''} ago`
              : 'Verification code sent to your WhatsApp number',
          },
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
          is_new_user: signupMode,
        },
        error: null,
      }
    }

    try {
      console.log('Verifying OTP:', { phone, code, testMode: whatsappAuth._testMode, signupMode })

      const response = await supabase.functions.invoke('whatsapp-auth-verify-otp', {
        // ✅ FIX: Add the headers object here
        headers: {
          'apikey': supabaseAnonKey,
        },
        body: {
          phone,
          code,
          test_mode: whatsappAuth._testMode,
          signup_mode: signupMode,
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
            plan_info: response.data.plan_info,
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
          is_new_user: signupMode,
        },
        error: null,
      }
    }

    try {
      console.log('Verifying simplified OTP:', {
        phone,
        code,
        testMode: whatsappAuth._testMode,
        skipVerification,
        signupMode,
      })

      const response = await supabase.functions.invoke('simplified-whatsapp-auth-verify-otp', {
        // ✅ FIX: Add the headers object here
        headers: {
          'apikey': supabaseAnonKey,
        },
        body: {
          phone,
          code,
          test_mode: whatsappAuth._testMode,
          skip_verification: skipVerification,
          signup_mode: signupMode,
        },
      })

      console.log('Simplified OTP verification response:', response)

      // If successful, the response will contain a session
      if (response.error) {
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
    return
