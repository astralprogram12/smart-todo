import { createClient } from '@supabase/supabase-js'

// Get environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Debug logging function
const logDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`, data !== undefined ? data : '')
}

// Simplified WhatsApp authentication with robust error handling
export const whatsappAuth = {
  // State
  _testMode: false,
  _logs: [] as Array<{timestamp: string, action: string, details: any}>,
  _lastSessionData: null as any,
  
  // Toggle test mode
  enableTestMode: (enable = true) => {
    whatsappAuth._testMode = enable
    logDebug(`Test mode ${enable ? 'enabled' : 'disabled'}`)
    return enable
  },
  
  // Check if test mode is enabled
  isTestMode: () => whatsappAuth._testMode,
  
  // Get all logs for debugging
  getLogs: () => whatsappAuth._logs,
  
  // Add to log
  _addLog: (action: string, details: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details
    }
    whatsappAuth._logs.unshift(logEntry) // Add to beginning of array
    
    // Keep only the latest 100 logs
    if (whatsappAuth._logs.length > 100) {
      whatsappAuth._logs = whatsappAuth._logs.slice(0, 100)
    }
    
    return logEntry
  },
  
  // Demo login (bypass verification)
  demoLogin: async (phone?: string) => {
    try {
      logDebug('Starting demo login', { phone })
      whatsappAuth._addLog('demo_login_start', { phone })
      
      const response = await supabase.functions.invoke('simple-whatsapp-auth', {
        body: { 
          action: 'demo_login',
          phone,
          test_mode: whatsappAuth._testMode
        },
      })
      
      logDebug('Demo login response', response)
      whatsappAuth._addLog('demo_login_response', response)
      
      if (response.data?.success && response.data?.session) {
        // Store session data for debugging
        whatsappAuth._lastSessionData = response.data.session
        
        // In a real app, we would do:
        // await supabase.auth.setSession({
        //   access_token: response.data.session.access_token,
        //   refresh_token: response.data.session.refresh_token,
        // })
        
        // For demo, we'll skip the actual session setting
        logDebug('Demo session available', response.data.session)
      }
      
      return response
    } catch (error) {
      logDebug('Error in demo login', error)
      whatsappAuth._addLog('demo_login_error', error)
      throw error
    }
  },
  
  // Skip verification (create demo user)
  skipVerification: async (phone?: string) => {
    return whatsappAuth.demoLogin(phone)
  },
  
  // Direct success (bypass everything)
  directSuccess: async (phone?: string) => {
    try {
      logDebug('Using direct success path', { phone })
      whatsappAuth._addLog('direct_success', { phone })
      
      // Create a mock success response
      const userId = `direct-${phone || 'user'}-${Date.now()}`
      const mockResponse = {
        data: {
          success: true,
          message: 'Direct success authentication',
          timestamp: new Date().toISOString(),
          direct_mode: true,
          user: { 
            id: userId, 
            phone: phone || 'direct-user',
            direct: true
          },
          session: {
            access_token: `direct_token_${userId}`,
            refresh_token: `direct_refresh_${userId}`,
            user: {
              id: userId,
              phone: phone || 'direct-user',
              email: `direct-${Date.now()}@example.com`,
              role: 'authenticated',
              aud: 'authenticated',
              direct: true
            }
          }
        },
        error: null
      }
      
      // Store session data for debugging
      whatsappAuth._lastSessionData = mockResponse.data.session
      
      return mockResponse
    } catch (error) {
      logDebug('Error in direct success', error)
      whatsappAuth._addLog('direct_success_error', error)
      throw error
    }
  },
  
  // Send OTP code via WhatsApp
  sendOTP: async (phone: string) => {
    try {
      logDebug('Sending OTP', { phone, testMode: whatsappAuth._testMode })
      whatsappAuth._addLog('send_otp_start', { phone, testMode: whatsappAuth._testMode })
      
      const response = await supabase.functions.invoke('simple-whatsapp-auth', {
        body: { 
          action: 'send_otp',
          phone,
          test_mode: whatsappAuth._testMode
        },
      })
      
      logDebug('Send OTP response', response)
      whatsappAuth._addLog('send_otp_response', response)
      
      return response
    } catch (error) {
      logDebug('Error sending OTP', error)
      whatsappAuth._addLog('send_otp_error', error)
      throw error
    }
  },
  
  // Verify OTP code and authenticate user
  verifyOTP: async (phone: string, code: string) => {
    try {
      logDebug('Verifying OTP', { phone, code, testMode: whatsappAuth._testMode })
      whatsappAuth._addLog('verify_otp_start', { phone, code, testMode: whatsappAuth._testMode })
      
      const response = await supabase.functions.invoke('simple-whatsapp-auth', {
        body: { 
          action: 'verify_otp',
          phone, 
          code,
          test_mode: whatsappAuth._testMode 
        },
      })
      
      logDebug('OTP verification response', response)
      whatsappAuth._addLog('verify_otp_response', response)
      
      // If successful, the response will contain a session
      if (response.data?.success && response.data?.session) {
        // Store session data for debugging
        whatsappAuth._lastSessionData = response.data.session
        
        if (!whatsappAuth._testMode) {
          logDebug('Setting real session in Supabase Auth')
          try {
            // Attempt to set the session in Supabase Auth
            const sessionResult = await supabase.auth.setSession({
              access_token: response.data.session.access_token,
              refresh_token: response.data.session.refresh_token,
            })
            
            logDebug('Session set result', sessionResult)
            whatsappAuth._addLog('session_set_result', sessionResult)
            
            // Verify the session was set correctly
            const currentSession = await supabase.auth.getSession()
            logDebug('Current session after setting', currentSession)
          } catch (sessionError) {
            logDebug('Error setting session', sessionError)
            whatsappAuth._addLog('session_set_error', sessionError)
            // Continue anyway for better UX - the key is to not block the user
          }
        } else {
          logDebug('Test mode: Not setting real session')
        }
      } else if (response.error) {
        logDebug('Error in verification response', response.error)
        whatsappAuth._addLog('verification_response_error', response.error)
      }
      
      return response
    } catch (error) {
      logDebug('Error verifying OTP', error)
      whatsappAuth._addLog('verify_otp_error', error)
      throw error
    }
  },
  
  // Sign out current user
  signOut: async () => {
    try {
      logDebug('Signing out')
      whatsappAuth._addLog('sign_out_start', {})
      
      const result = await supabase.auth.signOut()
      
      logDebug('Sign out result', result)
      whatsappAuth._addLog('sign_out_result', result)
      
      return result
    } catch (error) {
      logDebug('Error signing out', error)
      whatsappAuth._addLog('sign_out_error', error)
      throw error
    }
  },
  
  // Get current session
  getSession: async () => {
    try {
      logDebug('Getting session')
      const sessionResult = await supabase.auth.getSession()
      logDebug('Get session result', sessionResult)
      return sessionResult
    } catch (error) {
      logDebug('Error getting session', error)
      throw error
    }
  },
  
  // Get current user
  getUser: async () => {
    try {
      logDebug('Getting user')
      const { data: { user } } = await supabase.auth.getUser()
      logDebug('Get user result', user)
      return user
    } catch (error) {
      logDebug('Error getting user', error)
      throw error
    }
  },
  
  // Get last session data
  getLastSessionData: () => {
    return whatsappAuth._lastSessionData
  }
}
