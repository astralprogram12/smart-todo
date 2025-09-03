import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { google } from 'https://googleapis.deno.dev/v1/apis/calendar/v3.ts';
import { v4 as uuidv4 } from 'https://deno.land/std@0.168.0/uuid/mod.ts';

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: { user } } = await supabaseAdmin.auth.getUser(req.headers.get('Authorization').replace('Bearer ', ''));

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: tokens, error: tokensError } = await supabaseAdmin
    .from('google_calendar_tokens')
    .select('access_token, refresh_token')
    .eq('user_id', user.id)
    .single();

  if (tokensError || !tokens) {
    return new Response(JSON.stringify({ error: 'No Google Calendar connection found for this user.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const oauth2Client = new google.auth.OAuth2(
    Deno.env.get('GOOGLE_CLIENT_ID'),
    Deno.env.get('GOOGLE_CLIENT_SECRET')
  );

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-integration/new-event-webhook`;

  const { data: channel } = await calendar.events.watch({
    calendarId: 'primary',
    requestBody: {
      id: uuidv4.generate(),
      type: 'web_hook',
      address: webhookUrl,
    },
  });

  if (!channel) {
    return new Response(JSON.stringify({ error: 'Could not create webhook.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error: updateError } = await supabaseAdmin
    .from('google_calendar_tokens')
    .update({ channel_id: channel.id })
    .eq('user_id', user.id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ message: 'Successfully registered webhook.' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
