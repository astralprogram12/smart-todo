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
      throw new Error('Supabase configuration missing');
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': serviceRoleKey
      }
    });

    if (!userResponse.ok) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userData = await userResponse.json();
    const uid = userData.id;

    // Get request data
    const { code } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const nowIso = new Date().toISOString();

    // Find pending verification
    const verificationResponse = await fetch(`${supabaseUrl}/rest/v1/wa_verifications?user_id=eq.${uid}&status=eq.pending&expires_at=gte.${nowIso}&order=created_at.desc&limit=1`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Accept': 'application/json'
      }
    });

    if (!verificationResponse.ok) {
      throw new Error('Failed to fetch verification');
    }

    const verifications = await verificationResponse.json();
    const pending = verifications[0];

    if (!pending) {
      return new Response(JSON.stringify({ error: 'No pending code or expired' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (String(pending.code).trim() !== String(code).trim()) {
      // Update attempts
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

      return new Response(JSON.stringify({ error: 'Invalid code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Mark verification as verified
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

    // Calculate 30-day trial period
    const now = new Date();
    const trialEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

    // Update user_whatsapp status with premium trial
    await fetch(`${supabaseUrl}/rest/v1/user_whatsapp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        user_id: uid,
        phone: pending.phone,
        status: 'connected',
        wa_connected: true,
        plan: 'premium',
        plan_start: now.toISOString().split('T')[0], // YYYY-MM-DD format
        plan_end: trialEnd.toISOString().split('T')[0]   // YYYY-MM-DD format
      })
    });

    // Create or update user_plan record to premium
    await fetch(`${supabaseUrl}/rest/v1/user_plan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        user_id: uid,
        plan: 'premium'
      })
    });

    return new Response(JSON.stringify({ verified: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('OTP Verify Error:', error.message);
    return new Response(JSON.stringify({ error: error?.message || 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});