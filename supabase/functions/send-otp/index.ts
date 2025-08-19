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
    const fonnteToken = Deno.env.get('FONNTE_TOKEN');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    if (!fonnteToken) {
      console.error('Server Error: Missing FONNTE_TOKEN env variable.');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
    const { countryCode, phone } = await req.json();

    // Data validation
    if (!countryCode || !phone) {
      return new Response(JSON.stringify({ error: 'Country code and phone number are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Note: Removed premium plan requirement to allow new user registration
    // Premium trial will be granted after successful WhatsApp verification

    // Construct the full phone number
    const fullPhoneNumber = `${countryCode}${phone.replace(/^0+/, '')}`;

    // Update Database with the FULL Phone Number
    // Create or upsert user_whatsapp pending status
    const upsertWhatsappResponse = await fetch(`${supabaseUrl}/rest/v1/user_whatsapp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        user_id: uid,
        phone: fullPhoneNumber,
        status: 'pending',
        wa_connected: false
      })
    });

    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Create OTP entry
    const otpResponse = await fetch(`${supabaseUrl}/rest/v1/wa_verifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: uid,
        phone: fullPhoneNumber,
        code,
        status: 'pending',
        expires_at: expires
      })
    });

    // Send OTP via Fonnte
    const form = new FormData();
    form.set('target', phone);
    form.set('message', `SmartTask OTP: ${code}. Expires in 10 minutes.`);
    form.set('countryCode', String(countryCode));
    form.set('schedule', '0');
    form.set('typing', 'false');
    form.set('delay', '2');

    const fonnteResponse = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: fonnteToken },
      body: form
    });

    const fonnteText = await fonnteResponse.text();
    if (!fonnteResponse.ok) {
      console.error('Fonnte send failed:', fonnteText);
      return new Response(JSON.stringify({ error: 'Failed to send OTP via Fonnte', details: fonnteText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('OTP Send Error:', error.message);
    return new Response(JSON.stringify({ error: error?.message || 'An unknown server error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});