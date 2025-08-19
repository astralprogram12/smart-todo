// simplified-whatsapp-auth-send-otp/index.ts - Smart 10-minute rate limiting version

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Helper function to normalize phone numbers
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '');
  
  // Handle Indonesian numbers (most common case)
  // If number starts with 0, replace with 62
  if (normalized.startsWith('0')) {
    normalized = '62' + normalized.substring(1);
  }
  
  // If no country code (assuming <10 digits is missing country code)
  // and it's not already prefixed with country code, add 62 (Indonesia)
  if (normalized.length <= 10 && !normalized.startsWith('62')) {
    normalized = '62' + normalized;
  }
  
  return normalized;
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    console.log('Starting smart OTP send process with 10-minute rate limiting')
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const fonnteToken = Deno.env.get('FONNTE_TOKEN')

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials')
      throw new Error('Supabase configuration missing')
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get request data
    const reqData = await req.json()
    const { phone, test_mode, demo_mode, signup_mode = false } = reqData
    console.log('Received request:', reqData)
    
    // Validate phone
    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      console.error('Invalid phone number format')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Valid phone number is required',
        debug: { timestamp: new Date().toISOString(), request: reqData }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Normalize phone number (add country code if missing, handle leading zeros)
    const normalizedPhone = normalizePhoneNumber(phone)
    console.log('Normalized phone number:', normalizedPhone)

    // 1. Check if the phone number already exists in user_whatsapp table
    let existingUser = null;
    
    try {
      const { data: existingUsers, error: userCheckError } = await supabase
        .from('user_whatsapp')
        .select('user_id')
        .eq('phone', normalizedPhone)
        .maybeSingle()

      if (userCheckError) {
        console.error('Error checking for existing user:', userCheckError)
        // Continue anyway in case of error - better UX
      } else if (existingUsers) {
        existingUser = existingUsers;
        console.log('Found existing user with phone number:', normalizedPhone)
        
        // If we're in signup mode and user exists, redirect to login
        if (signup_mode) {
          console.log('User already exists with this phone number, redirecting to login')
          return new Response(JSON.stringify({
            success: false,
            error: 'User already exists with this phone number',
            redirect_to_login: true,
            debug: { timestamp: new Date().toISOString(), phone: normalizedPhone }
          }), {
            status: 409, // Conflict status code
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } else if (!existingUser && !signup_mode) {
        // If we're in login mode and user doesn't exist, tell them to sign up
        console.log('User not found in login mode, should redirect to signup')
        return new Response(JSON.stringify({
          success: false,
          error: 'User not found with this phone number',
          redirect_to_signup: true,
          debug: { timestamp: new Date().toISOString(), phone: normalizedPhone }
        }), {
          status: 404, // Not Found status code
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    } catch (userCheckError) {
      console.error('Exception checking for existing user:', userCheckError)
      // Continue anyway in case of error - better UX
    }

    // 2. Smart 10-minute rate limiting - Check for existing valid OTP
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const now = new Date().toISOString()
    
    let existingOTP = null
    let shouldSendNewOTP = true
    let message = ''
    
    try {
      // Check for existing OTP sent within the last 10 minutes
      const { data: recentOTPs, error: otpCheckError } = await supabase
        .from('wa_auth_codes')
        .select('code, created_at, expires_at')
        .eq('phone', normalizedPhone)
        .gte('created_at', tenMinutesAgo) // Created within last 10 minutes
        .gt('expires_at', now) // Not expired yet
        .eq('verified', false) // Not verified yet
        .order('created_at', { ascending: false })
        .limit(1)

      if (otpCheckError) {
        console.error('Error checking for existing OTP:', otpCheckError)
        // Continue to send new OTP if check fails
      } else if (recentOTPs && recentOTPs.length > 0) {
        existingOTP = recentOTPs[0]
        shouldSendNewOTP = false
        message = 'Please use the code sent earlier'
        console.log('Found existing valid OTP, will use existing code instead of sending new one')
        
        const codeAge = Math.floor((new Date().getTime() - new Date(existingOTP.created_at).getTime()) / 60000)
        console.log(`Existing OTP is ${codeAge} minutes old`)
      } else {
        message = 'OTP sent to your number'
        console.log('No existing valid OTP found, will send new one')
      }
    } catch (otpCheckError) {
      console.error('Exception checking for existing OTP:', otpCheckError)
      // Continue to send new OTP if check fails
      message = 'OTP sent to your number'
    }

    // 3. Generate and send new OTP if needed
    let code = ''
    let expiresAt = ''
    
    if (shouldSendNewOTP) {
      console.log('Generating new OTP')
      
      // Generate OTP - for demo purposes, always create a simple OTP
      if (demo_mode) {
        code = '123456' // Demo mode always uses 123456
      } else {
        code = Math.floor(100000 + Math.random() * 900000).toString()
      }
      
      console.log('Generated OTP code:', code)
      expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now

      // Store OTP in database
      try {
        const { error: insertError } = await supabase
          .from('wa_auth_codes')
          .insert({
            phone: normalizedPhone,
            code,
            expires_at: expiresAt,
            verified: false,
            attempts: 0
          })
    
        if (insertError) {
          console.error('Database error storing OTP:', insertError)
          // For simplified version, we'll continue even if database storage fails
          console.log('Continuing despite database error (simplified version)')
        } else {
          console.log('OTP stored in database successfully')
        }
      } catch (dbError) {
        console.error('Exception during database operation:', dbError)
        // Continue anyway for simplified version
      }

      // Check if test mode or demo mode is requested
      const isTestMode = test_mode === true || demo_mode === true
      console.log('Test/demo mode requested:', isTestMode)
      
      // Only send WhatsApp message if not in test mode and we have a Fonnte token
      if (!isTestMode && fonnteToken) {
        try {
          console.log('Sending OTP via Fonnte API')
          const form = new FormData()
          form.set('target', normalizedPhone)
          form.set('message', `Nenrin OTP: ${code}. Expires in 10 minutes.`)
          form.set('schedule', '0')
          form.set('typing', 'false')
          form.set('delay', '2')

          console.log('Sending OTP via Fonnte API with target:', normalizedPhone)
          const fonnteResponse = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: { Authorization: fonnteToken },
            body: form
          })

          console.log('Fonnte API response status:', fonnteResponse.status)
          const fonnteRespText = await fonnteResponse.text()
          console.log('Fonnte API response body:', fonnteRespText)

          if (!fonnteResponse.ok) {
            console.error('Fonnte send failed:', fonnteRespText)
            // Don't throw error - continue with success response for better UX
            console.log('WhatsApp sending failed but continuing with success response')
          } else {
            console.log('OTP sent successfully via WhatsApp')
          }
        } catch (whatsappError) {
          console.error('WhatsApp sending error:', whatsappError)
          // For simplified version, we'll continue even if WhatsApp sending fails
          console.log('WhatsApp sending failed but continuing with success response')
        }
      } else {
        console.log('Test/demo mode active - skipping actual WhatsApp message')
      }
    } else {
      // Use existing OTP data
      code = existingOTP.code
      expiresAt = existingOTP.expires_at
      console.log('Using existing OTP code')
    }

    // 4. Prepare response data
    const isTestMode = test_mode === true || demo_mode === true
    const responseInfo = {
      testMode: isTestMode,
      demoMode: demo_mode === true,
      timestamp: new Date().toISOString(),
      testCode: isTestMode ? code : undefined, // Only include the code in test mode
      normalizedPhone,
      expiresAt,
      signup_mode,
      usedExistingOTP: !shouldSendNewOTP,
      otpAge: existingOTP ? Math.floor((new Date().getTime() - new Date(existingOTP.created_at).getTime()) / 60000) : 0
    }
    
    console.log('Smart OTP process completed successfully', responseInfo)

    // 5. Always return success response - this is the key requirement
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: message,
        used_existing_otp: !shouldSendNewOTP,
        otp_age_minutes: existingOTP ? Math.floor((new Date().getTime() - new Date(existingOTP.created_at).getTime()) / 60000) : 0,
        debug: responseInfo
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    const errorDetails = {
      message: error?.message || 'An unknown server error occurred',
      timestamp: new Date().toISOString(),
      stack: error?.stack
    }
    console.error('OTP Send Error:', errorDetails)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorDetails.message,
        debug: errorDetails
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
