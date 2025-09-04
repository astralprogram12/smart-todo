import { createClient } from '@supabase/supabase-js'

// Get environment variables from Vite. Make sure they are correctly set in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// A simple check to see if the environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in your .env file.')
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * A collection of custom authentication functions for handling WhatsApp OTP login.
 */
export const whatsappAuth = {
  _testMode: false,

  /**
   * Enables or disables test mode for OTP functions.
   * @param {boolean} enable - Set to true to enable test mode.
   */
  enableTestMode: (enable = true) => {
    whatsappAuth._testMode = enable
    console.log(`Test mode has been ${enable ? 'enabled' : 'disabled'}.`)
    return enable
  },

  /**
   * Checks if test mode is currently enabled.
   * @returns {boolean}
   */
  isTestMode: () => whatsappAuth._testMode,

  /**
   * Calls the Edge Function to send an OTP to the user's WhatsApp.
   * This is the simplified version with smart rate limiting.
   * @param {string} phone - The user's phone number.
   * @param {boolean} demoMode - Flag for demo purposes.
   * @param {boolean} signupMode - Flag to indicate if this is for a new user signup.
   */
  sendSimplifiedOTP: async (phone: string, demoMode = false, signupMode = false) => {
    try {
      console.log('Invoking simplified-whatsapp-auth-send-otp function...')

      const { data, error } = await supabase.functions.invoke('simplified-whatsapp-auth-send-otp', {
        // ✅ FIX: The required 'apikey' header for authorization
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

      if (error) {
        throw error
      }

      // Process the smart rate limiting response
      if (data?.success) {
        const usedExisting = data.used_existing_otp
        const otpAge = data.otp_age_minutes

        // Return an enhanced response with a user-friendly message
        return {
          data: {
            ...data,
            userMessage: usedExisting
              ? `Please check your WhatsApp for the code sent ${otpAge} minute${otpAge !== 1 ? 's' : ''} ago.`
              : 'A verification code has been sent to your WhatsApp number.',
          },
          error: null,
        }
      }

      return { data, error }
    } catch (error) {
      console.error('Error sending simplified OTP:', error)
      return { data: null, error }
    }
  },

  /**
   * Calls the Edge Function to verify the OTP and authenticate the user.
   * @param {string} phone - The user's phone number.
   * @param {string} code - The OTP code from the user.
   * @param {boolean} skipVerification - Flag to bypass OTP check (for internal use).
   * @param {boolean} signupMode - Flag to indicate if this is for a new user signup.
   */
  verifySimplifiedOTP: async (phone: string, code: string, skipVerification = false, signupMode = false) => {
    try {
      console.log('Invoking simplified-whatsapp-auth-verify-otp function...')

      const { data, error } = await supabase.functions.invoke('simplified-whatsapp-auth-verify-otp', {
        // ✅ FIX: The required 'apikey' header for authorization
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

      if (error) {
        console.error('Error in verification response from function:', error)
        throw error
      }

      console.log('Simplified OTP verification response:', { data, error })
      return { data, error }
    } catch (error) {
      console.error('Critical error verifying simplified OTP:', error)
      return { data: null, error }
    }
  },

  /**
   * Signs out the current user from the Supabase session.
   */
  signOut: async () => {
    try {
      localStorage.removeItem('supabase.auth.token') // Proactively clear local session
      return await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  },

  /**
   * Retrieves the current session from Supabase.
   */
  getSession: async () => {
    return await supabase.auth.getSession()
  },

  /**
   * Retrieves the current user data from Supabase.
   */
  getUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  },
}
