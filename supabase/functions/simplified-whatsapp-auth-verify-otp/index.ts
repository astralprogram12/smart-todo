// simplified-whatsapp-auth-verify-otp/index.ts - FIXED VERSION

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
    console.log('Starting simplified OTP verification process')
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials')
      throw new Error('Supabase configuration missing')
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get request data
    const reqData = await req.json()
    const { phone, code, test_mode, demo_mode, skip_verification, signup_mode = false } = reqData
    console.log('Received verification request:', reqData)
    
    const isTestMode = test_mode === true
    const isDemoMode = demo_mode === true
    const isSkipMode = skip_verification === true
    const isSpecialTestCode = code === '123456' // Special test code that always works in test mode

    // Validate inputs
    if (!phone) {
      console.error('Missing phone number')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Phone number is required',
        debug: { timestamp: new Date().toISOString(), request: reqData }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!code && !isSkipMode) {
      console.error('Missing verification code')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Verification code is required',
        debug: { timestamp: new Date().toISOString(), request: reqData }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone)
    console.log('Normalized phone number:', normalizedPhone)

    // SPECIAL BYPASS PATH - Skip verification if requested
    if (isSkipMode) {
      console.log('Skip verification mode enabled - bypassing verification')
      
      // Create a dummy user ID for demo mode
      const demoUserId = `demo-${Date.now()}`
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Verification bypassed (demo mode)',
          demo_mode: true,
          skip_verification: true,
          user: { 
            id: demoUserId, 
            phone: normalizedPhone 
          },
          session: {
            access_token: 'demo_access_token',
            refresh_token: 'demo_refresh_token',
            user: {
              id: demoUserId,
              phone: normalizedPhone,
              email: `${normalizedPhone}@demo.com`,
              role: 'authenticated',
              aud: 'authenticated'
            }
          },
          debug: {
            timestamp: new Date().toISOString(),
            mode: 'skip_verification',
            normalizedPhone
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // SPECIAL TEST MODE PATH - always succeed with valid user data in test mode
    if (isTestMode && isSpecialTestCode) {
      console.log('Test mode enabled with special code - verification successful')
      
      // Create a dummy user ID for test mode
      const testUserId = '00000000-0000-0000-0000-000000000000'
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test authentication successful',
          test_mode: true,
          is_first_login: true, // Assume first login for test mode
          plan_info: {
            plan: 'pro',
            plan_start: new Date().toISOString().split('T')[0],
            plan_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          user: { 
            id: testUserId, 
            phone: normalizedPhone 
          },
          session: {
            access_token: 'test_access_token',
            refresh_token: 'test_refresh_token',
            user: {
              id: testUserId,
              phone: normalizedPhone,
              email: `${normalizedPhone}@test.com`,
              role: 'authenticated',
              aud: 'authenticated'
            }
          },
          debug: {
            timestamp: new Date().toISOString(),
            mode: 'test_mode_special_code',
            normalizedPhone,
            code
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // PRODUCTION VERIFICATION FLOW
    console.log('Starting production verification flow')
    
    // Get current time
    const now = new Date().toISOString()
    console.log('Current time for expiration check:', now)
    
    let verificationSuccess = false
    let userId = null
    let isFirstLogin = false
    let planInfo = null
    
    // Step 1: Verify the OTP code
    try {
      console.log('Querying for valid verification codes')
      const { data: codes, error: fetchError } = await supabase
        .from('wa_auth_codes')
        .select('*')
        .eq('phone', normalizedPhone)
        .gt('expires_at', now)
        .eq('verified', false)
        .lte('attempts', 4)
        .order('created_at', { ascending: false })
        .limit(1)

      if (fetchError) {
        console.error('Database error fetching code:', fetchError)
        throw new Error('Failed to verify code: ' + fetchError.message)
      }
      
      if (!codes || codes.length === 0) {
        console.error('No valid verification code found')
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'No valid verification code found or code expired',
          debug: {
            timestamp: new Date().toISOString(),
            query: { phone: normalizedPhone, after: now }
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const verificationRecord = codes[0]
      const submittedCode = String(code).trim()
      const storedCode = String(verificationRecord.code).trim()
      
      console.log('Comparing codes:', { submitted: submittedCode, stored: storedCode })
      
      if (submittedCode !== storedCode) {
        console.error('Invalid verification code provided')
        
        // Increment attempts
        const newAttempts = (verificationRecord.attempts || 0) + 1
        
        await supabase
          .from('wa_auth_codes')
          .update({ attempts: newAttempts })
          .eq('id', verificationRecord.id)

        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid verification code',
          debug: {
            timestamp: new Date().toISOString(),
            submitted: submittedCode,
            expected: storedCode,
            attempts: newAttempts
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Mark code as verified
      await supabase
        .from('wa_auth_codes')
        .update({ verified: true })
        .eq('id', verificationRecord.id)
      
      console.log('OTP verification successful')
      verificationSuccess = true
      
    } catch (verificationError) {
      console.error('Error during OTP verification:', verificationError)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Verification failed: ' + verificationError.message,
        debug: { timestamp: new Date().toISOString(), error: verificationError.message }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Step 2: Handle user lookup/creation
    if (verificationSuccess) {
      console.log('OTP verified, handling user lookup/creation')
      
      try {
        // First, check if user exists in user_whatsapp table (our main user table)
        const { data: existingWhatsappUsers, error: whatsappUserError } = await supabase
          .from('user_whatsapp')
          .select('user_id, status, wa_connected, last_login, plan, plan_start, plan_end')
          .eq('phone', normalizedPhone)
          .maybeSingle()

        if (whatsappUserError) {
          console.error('Error checking user_whatsapp:', whatsappUserError)
          throw new Error('Failed to check user: ' + whatsappUserError.message)
        }

        if (existingWhatsappUsers) {
          // User exists - update their status to connected
          userId = existingWhatsappUsers.user_id
          console.log('Found existing user:', userId)
          
          // Check if it's been more than 14 days since last login
          const lastLogin = existingWhatsappUsers.last_login ? new Date(existingWhatsappUsers.last_login) : null
          const daysSinceLastLogin = lastLogin ? Math.floor((new Date().getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)) : null
          
          console.log('Days since last login:', daysSinceLastLogin)
          
          // Determine if plan should be reset to free due to inactivity
          const shouldResetPlan = daysSinceLastLogin !== null && daysSinceLastLogin > 14
          
          // *** CRITICAL FIX: Always update status to connected and wa_connected to true ***
          const updateData: any = {
            status: 'connected',
            wa_connected: true,
            last_login: new Date().toISOString()
          }
          
          // Reset plan to free if inactive for more than 14 days
          if (shouldResetPlan) {
            updateData.plan = 'free'
            console.log('Resetting plan to free due to inactivity')
          }
          
          console.log('Updating user_whatsapp record with:', updateData)
          const { error: updateError } = await supabase
            .from('user_whatsapp')
            .update(updateData)
            .eq('user_id', userId)
            
          if (updateError) {
            console.error('CRITICAL ERROR updating user_whatsapp record:', updateError)
            throw new Error('Failed to update user status: ' + updateError.message)
          } else {
            console.log('✅ Successfully updated user_whatsapp record - status: connected, wa_connected: true')
            
            // Determine if this is the first login
            isFirstLogin = lastLogin === null
            
            // Get the plan info
            planInfo = {
              plan: shouldResetPlan ? 'free' : existingWhatsappUsers.plan,
              plan_start: existingWhatsappUsers.plan_start,
              plan_end: existingWhatsappUsers.plan_end
            }
          }
          
        } else {
          // User doesn't exist - check if we're in signup mode
          if (!signup_mode) {
            console.error('User not found and not in signup mode')
            return new Response(JSON.stringify({
              success: false,
              error: 'User not found. Please sign up first.',
              redirect_to_signup: true,
              debug: {
                timestamp: new Date().toISOString(),
                phone: normalizedPhone,
                signup_mode: signup_mode
              }
            }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
          
          // Create new user
          console.log('Creating new user for signup')
          isFirstLogin = true
          
          // First, create user in auth.users to get a user_id
          console.log('Creating auth user with phone:', normalizedPhone)
          const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
            phone: normalizedPhone,
            phone_confirmed: true,
            email_confirmed: true
          })

          if (createAuthError) {
            console.error('Error creating auth user:', createAuthError)
            throw new Error('Failed to create auth user account: ' + createAuthError.message)
          }
          
          userId = newAuthUser?.user?.id
          if (!userId) {
            throw new Error('Failed to get user ID for newly created auth user')
          }
          
          console.log('New auth user created with ID:', userId)
          
          // Check if the database trigger already created a user_whatsapp record
          const { data: existingRecord, error: checkError } = await supabase
            .from('user_whatsapp')
            .select('user_id, status, wa_connected')
            .eq('user_id', userId)
            .maybeSingle()
            
          if (checkError) {
            console.error('Error checking for existing user_whatsapp record:', checkError)
            throw new Error('Failed to check existing user record: ' + checkError.message)
          }
          
          // Get the current date and calculate plan end date (30 days from now)
          const currentDate = new Date()
          const planEndDate = new Date(currentDate)
          planEndDate.setDate(currentDate.getDate() + 30)
          
          // Format dates for database
          const formattedCurrentDate = currentDate.toISOString().split('T')[0]
          const formattedPlanEndDate = planEndDate.toISOString().split('T')[0]
          
          if (existingRecord) {
            // Database trigger already created the record - update it to connected status
            console.log('Database trigger created record, updating to connected status')
            
            const updateData = {
              status: 'connected',  // *** CRITICAL: Set as connected ***
              wa_connected: true,   // *** CRITICAL: Set as true ***
              last_login: new Date().toISOString(),
              plan: 'premium',
              plan_start: formattedCurrentDate,
              plan_end: formattedPlanEndDate
            }
            
            console.log('Updating user_whatsapp record with:', updateData)
            const { error: updateError } = await supabase
              .from('user_whatsapp')
              .update(updateData)
              .eq('user_id', userId)
              
            if (updateError) {
              console.error('CRITICAL ERROR updating user_whatsapp record:', updateError)
              throw new Error('Failed to update user status: ' + updateError.message)
            } else {
              console.log('✅ Successfully updated user_whatsapp record to connected status')
            }
          } else {
            // No existing record - create new one
            console.log('No existing record found, creating new user_whatsapp record')
            
            const newUserData = {
              user_id: userId,  // *** CRITICAL: Include the user_id ***
              phone: normalizedPhone,
              status: 'connected',  // *** CRITICAL: Set as connected immediately ***
              wa_connected: true,   // *** CRITICAL: Set as true immediately ***
              last_login: new Date().toISOString(),
              plan: 'premium',
              plan_start: formattedCurrentDate,
              plan_end: formattedPlanEndDate,
              daily_message_count: 0,
              last_message_date: formattedCurrentDate,
              timezone: 'Asia/Jakarta',
              schedule_limit: 10,
              auth_id: userId
            }
            
            console.log('Creating user_whatsapp record with:', newUserData)
            const { error: createError } = await supabase
              .from('user_whatsapp')
              .insert(newUserData)
              
            if (createError) {
              console.error('CRITICAL ERROR creating user_whatsapp record:', createError)
              throw new Error('Failed to create user: ' + createError.message)
            } else {
              console.log('✅ Successfully created new user_whatsapp record with ID:', userId)
            }
          }
          
          planInfo = {
            plan: 'premium',
            plan_start: formattedCurrentDate,
            plan_end: formattedPlanEndDate
          }
        }
        
      } catch (userError) {
        console.error('Error during user operations:', userError)
        throw new Error('User operation failed: ' + userError.message)
      }
    }
    
    // Step 3: Create session and return success
    if (verificationSuccess && userId) {
      console.log('Creating session for user ID:', userId)
      
      const sessionData = {
        access_token: `simplified_token_${userId}_${Date.now()}`,
        refresh_token: `simplified_refresh_${userId}_${Date.now()}`,
        user: {
          id: userId,
          phone: normalizedPhone,
          email: `${normalizedPhone}@simplified.com`,
          role: 'authenticated',
          aud: 'authenticated'
        }
      }

      console.log('✅ OTP verification process completed successfully')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Authentication successful',
          session: sessionData,
          user: { id: userId, phone: normalizedPhone },
          is_first_login: isFirstLogin,
          plan_info: planInfo,
          debug: {
            timestamp: new Date().toISOString(),
            user_id: userId,
            normalized_phone: normalizedPhone,
            signup_mode: signup_mode,
            is_first_login: isFirstLogin,
            plan_info: planInfo
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // If we got here, something went wrong
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Verification process failed',
      debug: {
        timestamp: new Date().toISOString(),
        verification_success: verificationSuccess,
        user_id: userId
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    const errorDetails = {
      message: error?.message || 'An unknown server error occurred',
      timestamp: new Date().toISOString(),
      stack: error?.stack
    }
    console.error('OTP Verification Error:', errorDetails)
    
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
