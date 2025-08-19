// Edge function to verify OTP and authenticate users

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Parse request body
    const { code, phoneHash, mode = 'login' } = await req.json();

    // Validate input
    if (!code || !phoneHash) {
      return new Response(JSON.stringify({ error: 'Verification code and phone hash are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Decode phone hash
    let fullPhoneNumber;
    try {
      fullPhoneNumber = atob(phoneHash);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid phone reference' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const nowIso = new Date().toISOString();

    // Find pending verification
    const verificationResponse = await fetch(
      `${supabaseUrl}/rest/v1/wa_verifications?phone=eq.${fullPhoneNumber}&status=eq.pending&expires_at=gte.${nowIso}&order=created_at.desc&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Accept': 'application/json'
        }
      }
    );

    if (!verificationResponse.ok) {
      throw new Error('Failed to fetch verification record');
    }

    const verifications = await verificationResponse.json();
    const pending = verifications[0];

    if (!pending) {
      return new Response(JSON.stringify({ error: 'No pending verification found or code expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if the code matches
    if (String(pending.code) !== String(code)) {
      // Update attempts counter
      await fetch(`${supabaseUrl}/rest/v1/wa_verifications?id=eq.${pending.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attempts: (pending.attempts || 0) + 1
        })
      });

      return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Code is valid - Mark verification as verified
    await fetch(`${supabaseUrl}/rest/v1/wa_verifications?id=eq.${pending.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'verified'
      })
    });

    // User management logic based on mode
    let userId;
    let isNewUser = false;

    // Check if the user already exists with this phone number
    const userCheckResponse = await fetch(`${supabaseUrl}/rest/v1/user_whatsapp?phone=eq.${fullPhoneNumber}`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      }
    });

    const existingUsers = await userCheckResponse.json();
    
    if (mode === 'signup' && existingUsers && existingUsers.length > 0) {
      // For signup mode, if user exists, just sign them in
      userId = existingUsers[0].user_id;
      if (existingUsers[0].auth_id) {
        // User already exists in auth system too
        isNewUser = false;
      } else {
        // User exists in our custom table but not in auth system
        isNewUser = true;
      }
    } else if (mode === 'login' && (!existingUsers || existingUsers.length === 0)) {
      // For login mode, if user doesn't exist, return error
      return new Response(JSON.stringify({ error: 'No account found with this phone number. Please sign up first.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (mode === 'login') {
      // For login mode, if user exists, get the user ID
      userId = existingUsers[0].user_id;
      isNewUser = false;
    } else {
      // For signup mode, if user doesn't exist, create a new user
      isNewUser = true;
      
      // Generate a UUID for the new user
      const crypto = globalThis.crypto;
      const buffer = new Uint8Array(16);
      crypto.getRandomValues(buffer);
      
      buffer[6] = (buffer[6] & 0x0f) | 0x40; // Version 4
      buffer[8] = (buffer[8] & 0x3f) | 0x80; // Variant

      const hexString = Array.from(buffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      userId = [
        hexString.substring(0, 8),
        hexString.substring(8, 12),
        hexString.substring(12, 16),
        hexString.substring(16, 20),
        hexString.substring(20)
      ].join('-');
    }

    // Create JWT payload
    const payload = {
      aud: 'authenticated',
      role: 'authenticated',
      sub: userId,
      phone: fullPhoneNumber,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days expiration
      is_new_user: isNewUser
    };

    // Sign JWT token
    const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/admin/generate-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'magiclink',
        email: `${fullPhoneNumber}@whatsapp.user`, // Just a placeholder, never used
        data: payload
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token generation error:', errorText);
      throw new Error('Failed to generate authentication token');
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.properties?.access_token;

    if (!token) {
      throw new Error('Failed to generate valid authentication token');
    }

    // Update or create user_whatsapp record
    await fetch(`${supabaseUrl}/rest/v1/user_whatsapp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        user_id: userId,
        phone: fullPhoneNumber,
        status: 'connected',
        wa_connected: true
      })
    });

    // Return success response with token
    return new Response(JSON.stringify({
      success: true,
      token,
      user_id: userId,
      is_new_user: isNewUser
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('WhatsApp Auth Verification Error:', error.message);
    return new Response(JSON.stringify({ error: error.message || 'Server error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
