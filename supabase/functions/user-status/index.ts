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

    // Ensure user_plan row exists (default free)
    const planResponse = await fetch(`${supabaseUrl}/rest/v1/user_plan?user_id=eq.${uid}&select=plan`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Accept': 'application/vnd.pgrst.object+json'
      }
    });

    let plan = 'free';
    if (planResponse.ok) {
      const planData = await planResponse.json();
      if (!planData || Object.keys(planData).length === 0) {
        // Create default plan
        await fetch(`${supabaseUrl}/rest/v1/user_plan`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: uid,
            plan: 'free'
          })
        });
        plan = 'free';
      } else {
        plan = planData.plan || 'free';
      }
    }

    const premium = plan === 'premium';

    // Get WhatsApp status
    const waResponse = await fetch(`${supabaseUrl}/rest/v1/user_whatsapp?user_id=eq.${uid}&select=phone,status,wa_connected`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Accept': 'application/vnd.pgrst.object+json'
      }
    });

    let whatsapp = {
      phone: null,
      status: 'disconnected',
      wa_connected: false
    };

    if (waResponse.ok) {
      const waData = await waResponse.json();
      if (waData && Object.keys(waData).length > 0) {
        whatsapp = {
          phone: waData.phone || null,
          status: waData.status || 'disconnected',
          wa_connected: waData.wa_connected || false
        };
      }
    }

    return new Response(JSON.stringify({
      premium,
      whatsapp
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('User Status Error:', error.message);
    return new Response(JSON.stringify({ error: error?.message || 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});