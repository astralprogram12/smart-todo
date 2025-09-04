import { createClient } from '@supabase/supabase-js'

// Get environment variables from Vite. Ensure they are correctly set in your .env file.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// A critical check to ensure the environment variables are loaded correctly.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in your .env file.')
}

// Create and export the Supabase client for use in other parts of your app.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * A dedicated object for handling all WhatsApp authentication logic.
 * This keeps the authentication calls clean and separate from other Supabase interactions.
 */
export const whatsappAuth = {
  _testMode: false,

  /**
   * Enables or disables test mode for OTP functions.
   * When enabled, API calls might behave differently as defined in your Edge Functions.
   * @param {boolean} enable - Set to true to enable test mode. Defaults to true.
   */
  enableTestMode: (enable = true) => {
    whatsappAuth._testMode = enable
    console.log(`Test mode has been ${enable ? 'enabled' : 'disabled'}.`)
    return enable
  },

  /**
   * Checks if test mode is currently enabled.
   * @returns {boolean} - True if test mode is on.
   */
  isTestMode: () => whatsappAuth._testMode,

  /**
   * Calls the Edge Function to send an OTP to the user's WhatsApp.
   * This is the primary function for initiating a login or signup.
   * @param {string} phone - The user's phone number.
   * @param {boolean} demoMode - Flag for demo purposes.
   * @param {boolean} signupMode - Flag to indicate if this is for a new user signup.
   * @returns {Promise<{data: any, error: any}>} - The response from the Edge Function.
   */
  sendSimplifiedOTP: async (phone: string, demoMode = false, signupMode = false) => {
    try {
      const { data, error } = await supabase.functions.invoke('simplified-whatsapp-auth-send-otp', {
        // ✅ FIX: The required 'apikey' header to prevent 401 Unauthorized errors.
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

      return { data, error: null }
    } catch (error) {
      console.error('Error sending simplified OTP:', error)
      return { data: null, error }
    }
  },

  /**
   * Calls the Edge Function to verify the OTP and authenticate the user.
   * @param {string} phone - The user's phone number.
   * @param {string} code - The OTP code from the user.
   * @param {boolean} skipVerification - Flag to bypass OTP check (for internal/dev use).
   * @param {boolean} signupMode - Flag to indicate if this is for a new user signup.
   * @returns {Promise<{data: any, error: any}>} - The response from the Edge Function, which may include a session.
   */
  verifySimplifiedOTP: async (phone: string, code: string, skipVerification = false, signupMode = false) => {
    try {
      const { data, error } = await supabase.functions.invoke('simplified-whatsapp-auth-verify-otp', {
        // ✅ FIX: The required 'apikey' header to prevent 401 Unauthorized errors.
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
        throw error
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Error verifying simplified OTP:', error)
      return { data: null, error }
    }
  },

  /**
   * Signs out the current user from the Supabase session.
   */
  signOut: async () => {
    try {
      localStorage.removeItem('supabase.auth.token') // Proactively clear local session
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
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
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  },
} // This is the closing brace for the 'whatsappAuth' object.
