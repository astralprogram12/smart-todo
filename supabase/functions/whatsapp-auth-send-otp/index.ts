// whatsapp-auth-send-otp/index.ts

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
    console.log('Starting OTP send process')
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const fonnteToken = Deno.env.get('FONNTE_TOKEN')

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials')
      throw new Error('Supabase configuration missing')
    }

    if (!fonnteToken) {
      console.error('Server Error: Missing FONNTE_TOKEN env variable.')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get request data
    const { phone, test_mode } = await req.json()
    console.log('Received phone number:', phone, 'Test mode:', test_mode)
    
    // Validate phone
    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      console.error('Invalid phone number format')
      return new Response(JSON.stringify({ error: 'Valid phone number is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Normalize phone number (add country code if missing, handle leading zeros)
    const normalizedPhone = normalizePhoneNumber(phone)
    console.log('Normalized phone number:', normalizedPhone)

    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('Generated OTP code:', code)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now

    // Store OTP in database
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
      throw new Error('Failed to store verification code')
    }
    console.log('OTP stored in database successfully')

    // Extract country code and local phone number
    // This is a simplified approach that assumes standard international format
    const countryCode = normalizedPhone.startsWith('1') ? '1' : normalizedPhone.slice(0, -10)
    const localPhone = normalizedPhone.slice(-10)
    console.log('Extracted country code:', countryCode, 'and local phone:', localPhone)

    // Check if test mode is requested
    const isTestMode = test_mode === true
    console.log('Test mode requested:', isTestMode)
    
    // Only send WhatsApp message if not in test mode
    if (!isTestMode) {
      // Send OTP via Fonnte
      console.log('Preparing to send OTP via Fonnte API')
      const form = new FormData()
      form.set('target', normalizedPhone)
      form.set('message', `Nenrin OTP: ${code}. Expires in 10 minutes.`)
      form.set('countryCode', String(countryCode))
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
        throw new Error('Failed to send OTP via WhatsApp')
      }
    } else {
      console.log('Test mode active - skipping actual WhatsApp message')
    }

    // Prepare response info based on mode
    const responseInfo = isTestMode ? 
      { testMode: true, testCode: code } : 
      { testMode: false }
    console.log('OTP sending process completed successfully', responseInfo)

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isTestMode ? 'Test mode: Code generated (not sent to WhatsApp)' : 'Verification code sent to your WhatsApp',
        debug: responseInfo
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('OTP Send Error:', error.message)
    return new Response(
      JSON.stringify({ error: error?.message || 'An unknown server error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
