import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { url, method } = req;
  const { searchParams, pathname } = new URL(url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (method === 'GET' && pathname.endsWith('/oauth-callback') && code && state) {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: stateData, error: stateError } = await supabaseAdmin
      .from('oauth_state')
      .select('user_id')
      .eq('state', state)
      .single();

    if (stateError || !stateData) {
      return new Response(JSON.stringify({ error: 'Invalid state parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await supabaseAdmin.from('oauth_state').delete().eq('state', state);

    const { user_id } = stateData;

    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-integration/oauth-callback`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error_description }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { access_token, refresh_token } = data;

    const { error } = await supabaseAdmin.from('google_calendar_tokens').upsert(
      {
        user_id: user_id,
        access_token,
        refresh_token,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${Deno.env.get('APP_URL')}/google-callback-success`,
      },
    });
  }

  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
});
