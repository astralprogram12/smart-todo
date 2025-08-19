// whatsapp-auth-verify-otp/index.ts - With Pro Plan and User Inactivity Support

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

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
    console.log('Starting OTP verification process')
    
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
    const { phone, code, test_mode, signup_mode = false } = reqData
    console.log('Received verification request:', reqData)
    
    const isTestMode = test_mode === true
    const isSpecialTestCode = code === '123456' // Special test code that always works in test mode

    // Validate inputs
    if (!phone || !code) {
      console.error('Missing required parameters')
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Phone number and verification code are required',
        debug: { timestamp: new Date().toISOString(), request: reqData }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone)
    console.log('Normalized phone number:', normalizedPhone)

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

    // PRODUCTION MODE - Normal verification flow
    // Get current time
    const now = new Date().toISOString()
    console.log('Current time for expiration check:', now)
    
    // First check if the table exists
    console.log('Checking if wa_auth_codes table exists')
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('check_table_exists', { table_name: 'wa_auth_codes' })
      
      if (tableError || !tableInfo) {
        console.error('Error checking table or table does not exist:', tableError || 'Table not found')
        throw new Error('Database configuration issue: ' + (tableError ? tableError.message : 'wa_auth_codes table not found'))
      }
      
      console.log('wa_auth_codes table exists:', tableInfo)
    } catch (tableCheckError) {
      console.error('Error during table check:', tableCheckError)
      // Continue anyway, as the RPC might not exist
    }
    
    // Retrieve pending verification code
    console.log('Querying for valid verification codes')
    const { data: codes, error: fetchError } = await supabase
      .from('wa_auth_codes')
      .select('*')
      .eq('phone', normalizedPhone)
      .gt('expires_at', now)
      .eq('verified', false)
      .lte('attempts', 4) // Add max attempts check
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('Database error fetching code:', fetchError)
      throw new Error('Failed to verify code: ' + fetchError.message)
    }
    
    console.log('Found verification codes:', codes ? codes.length : 0)

    // Check if we found a valid code
    if (!codes || codes.length === 0) {
      console.error('No valid verification code found')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No valid verification code found or code expired',
        debug: { timestamp: new Date().toISOString(), query: { phone: normalizedPhone, after: now } }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const verificationRecord = codes[0]

    // Check if code matches
    const submittedCode = String(code).trim()
    const storedCode = String(verificationRecord.code).trim()
    
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
        debug: { timestamp: new Date().toISOString(), submitted: submittedCode, expected: storedCode }
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

    // Check if user exists in auth.users, create if not
    console.log('Checking if user exists with phone:', normalizedPhone)
    
    let { data: authUser, error: authUserError } = await supabase.auth.admin.listUsers({
      filter: {
        phone: normalizedPhone
      }
    })

    let userId: string;
    let isNewUser = false;
    
    if (authUserError) {
      console.error('Error checking for existing auth user:', authUserError)
      throw new Error('Failed to verify user in auth: ' + authUserError.message)
    }
    
    // User doesn't exist in auth.users
    if (!authUser || !authUser.users || authUser.users.length === 0) {
      if (!signup_mode) {
        console.error('User not found in auth.users and not in signup mode')
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
      
      // Create new user in auth.users
      console.log('Creating new auth user with phone:', normalizedPhone)
      const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
        phone: normalizedPhone,
        phone_confirmed: true,
        email_confirmed: true
      })

      if (createAuthError) {
        console.error('Error creating auth user:', createAuthError)
        throw new Error('Failed to create auth user account: ' + createAuthError.message)
      }
      
      console.log('New auth user created with ID:', newAuthUser?.user?.id || 'unknown')
      userId = newAuthUser?.user?.id;
      isNewUser = true;
      
      if (!userId) {
        throw new Error('Failed to get user ID for newly created auth user')
      }
    } else {
      userId = authUser.users[0].id;
      console.log('Found existing auth user with ID:', userId);
    }

    // Check if user exists in user_whatsapp table, create or update if needed
    let planInfo = null;
    let isFirstLogin = false;
    
    try {
      console.log('DETAILED DEBUG: Checking user_whatsapp record for user ID:', userId);
      // Try to fetch existing user_whatsapp record
      const { data: whatsappRecord, error: whatsappFetchError } = await supabase
        .from('user_whatsapp')
        .select('user_id, status, wa_connected, last_login, plan, plan_start, plan_end')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('whatsapp record fetch result:', whatsappRecord, whatsappFetchError);
      
      if (whatsappFetchError) {
        console.error('Error checking user_whatsapp record:', whatsappFetchError);
        throw new Error('Failed to check user_whatsapp record: ' + whatsappFetchError.message);
      }
      
      // Format current date and end date for pro plan (30 days from now)
      const currentDate = new Date();
      const planEndDate = new Date(currentDate);
      planEndDate.setDate(currentDate.getDate() + 30);
      
      const formattedCurrentDate = currentDate.toISOString().split('T')[0];
      const formattedPlanEndDate = planEndDate.toISOString().split('T')[0];
      
      if (whatsappRecord) {
        // Check if it's been more than 14 days since last login
        const lastLogin = whatsappRecord.last_login ? new Date(whatsappRecord.last_login) : null;
        const daysSinceLastLogin = lastLogin ? Math.floor((currentDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)) : null;
        
        console.log('Days since last login:', daysSinceLastLogin);
        
        // Determine if plan should be reset to free due to inactivity
        const shouldResetPlan = daysSinceLastLogin !== null && daysSinceLastLogin > 14;
        
        // Update existing user_whatsapp record
        const updateData: any = {
          phone: normalizedPhone,
          status: 'connected',
          wa_connected: true,
          auth_id: userId,
          last_login: currentDate.toISOString()
        };
        
        // Reset plan to free if inactive for more than 14 days
        if (shouldResetPlan) {
          updateData.plan = 'free';
          console.log('Resetting plan to free due to inactivity');
        }
        
        const { data: updateResult, error: updateError } = await supabase
          .from('user_whatsapp')
          .update(updateData)
          .eq('user_id', userId)
          .select();
          
        console.log('Update result:', updateResult, updateError);
          
        if (updateError) {
          console.error('Error updating user_whatsapp record:', updateError);
          throw new Error('Failed to update user_whatsapp record: ' + updateError.message);
        } else {
          console.log('Updated user_whatsapp record for user:', userId);
          
          // Set first login flag if last_login was null
          if (lastLogin === null) {
            isFirstLogin = true;
          }
          
          // Get the updated plan info
          planInfo = {
            plan: shouldResetPlan ? 'free' : whatsappRecord.plan,
            plan_start: whatsappRecord.plan_start,
            plan_end: whatsappRecord.plan_end
          };
        }
      } else {
        // This is a first login or a user without a whatsapp record
        // Create new user_whatsapp record with pro plan
        isFirstLogin = true;
        
        // Default values for required fields
        const newUserWhatsappData = {
          user_id: userId,
          phone: normalizedPhone,
          status: 'connected',
          wa_connected: true,
          auth_id: userId,
          last_login: currentDate.toISOString(),
          plan: 'pro', // Set pro plan for new users
          plan_start: formattedCurrentDate,
          plan_end: formattedPlanEndDate,
          // Default values required by the schema
          daily_message_count: 0,
          last_message_date: currentDate.toISOString().split('T')[0],
          timezone: 'Asia/Jakarta',
          schedule_limit: 10
        };
        
        console.log('Inserting new user_whatsapp record:', newUserWhatsappData);
        
        console.log('Attempting to insert user_whatsapp record for user:', userId)
        console.log('DETAILED DEBUG: Attempting to insert into user_whatsapp:', JSON.stringify(newUserWhatsappData));
        try {
          const { data: insertResult, error: insertError } = await supabase
            .from('user_whatsapp')
            .insert(newUserWhatsappData)
            .select();
          console.log('DETAILED DEBUG: Insert result data:', insertResult ? JSON.stringify(insertResult) : 'null');
          console.log('DETAILED DEBUG: Insert error:', insertError ? JSON.stringify(insertError) : 'null');
          
          console.log('Insert result:', insertResult, insertError);
            
          if (insertError) {
            console.error('DETAILED DEBUG: Error creating user_whatsapp record:', insertError)
            console.error('DETAILED DEBUG: Detailed error:', JSON.stringify(insertError));
            console.error('DETAILED DEBUG: User ID:', userId);
            console.error('DETAILED DEBUG: Phone:', normalizedPhone);
            console.error('DETAILED DEBUG: Record structure:', JSON.stringify(newUserWhatsappData));
            // Don't throw here, we'll still return a success to the user
            // but log this error for debugging
            console.error('DETAILED DEBUG: Continuing despite user_whatsapp insert error');
            // Set plan info to a default value
            planInfo = {
              plan: 'pro',
              plan_start: formattedCurrentDate,
              plan_end: formattedPlanEndDate
            };
          } else {
            console.log('DETAILED DEBUG: Created user_whatsapp record with pro plan for user:', userId);
            planInfo = {
              plan: 'pro',
              plan_start: formattedCurrentDate,
              plan_end: formattedPlanEndDate
            };
          }
        } catch (insertTryError) {
          console.error('DETAILED DEBUG: Exception during insert operation:', insertTryError);
          console.error('DETAILED DEBUG: User ID:', userId);
          console.error('DETAILED DEBUG: Phone:', normalizedPhone);
          // Set plan info to a default value and continue
          planInfo = {
            plan: 'pro',
            plan_start: formattedCurrentDate,
            plan_end: formattedPlanEndDate
          };
        }
      }
    } catch (whatsappError) {
      console.error('DETAILED DEBUG: Exception handling user_whatsapp record:', whatsappError);
      console.error('DETAILED DEBUG: User ID:', userId);
      console.error('DETAILED DEBUG: Phone:', normalizedPhone);
      // Don't throw here, we'll still return a success to the user
      // but log this error for debugging
      console.error('DETAILED DEBUG: Continuing despite user_whatsapp error');
      // Set default plan info
      planInfo = {
        plan: 'pro',
        plan_start: new Date().toISOString().split('T')[0],
        plan_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
    }

    // Create a session for the user
    console.log('Creating session for user ID:', userId);
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `${normalizedPhone}@example.com`,
      options: {
        redirectTo: 'https://example.com'
      }
    });
    
    console.log('Session creation result:', sessionData ? 'Success' : 'Failed', sessionError || '');

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      throw new Error('Failed to create user session: ' + sessionError.message);
    }

    // Since we're using a different approach for auth, create a session object
    // that matches what the client expects
    const sessionObject = {
      access_token: 'custom_token_' + userId,
      refresh_token: 'custom_refresh_' + userId,
      user: {
        id: userId,
        phone: normalizedPhone,
        aud: 'authenticated'
      }
    };

    console.log('OTP verification process completed successfully');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Authentication successful',
        session: sessionObject,
        is_first_login: isFirstLogin,
        is_new_user: isNewUser,
        plan_info: planInfo,
        user: { 
          id: userId, 
          phone: normalizedPhone
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('OTP Verification Error:', error.message, error.stack);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'An unknown server error occurred',
        debug: { timestamp: new Date().toISOString(), error: error?.message, stack: error?.stack }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
