import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { google } from 'https://googleapis.deno.dev/v1/apis/calendar/v3.ts';

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const channelId = req.headers.get('X-Goog-Channel-ID');
  if (!channelId) {
    return new Response(JSON.stringify({ error: 'Missing channel ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: tokenData, error: tokenError } = await supabaseAdmin
    .from('google_calendar_tokens')
    .select('user_id, access_token, refresh_token')
    .eq('channel_id', channelId)
    .single();

  if (tokenError || !tokenData) {
    return new Response(JSON.stringify({ error: 'Could not find user for this channel' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { user_id, access_token, refresh_token } = tokenData;

  const oauth2Client = new google.auth.OAuth2(
    Deno.env.get('GOOGLE_CLIENT_ID'),
    Deno.env.get('GOOGLE_CLIENT_SECRET')
  );

  oauth2Client.setCredentials({
    access_token,
    refresh_token,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const { data: events } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 1,
    singleEvents: true,
    orderBy: 'startTime',
  });

  if (!events.items || events.items.length === 0) {
    return new Response(JSON.stringify({ message: 'No new events found.' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const event = events.items[0];

  const { error: insertError } = await supabaseAdmin.from('scheduled_actions').insert([
    {
      user_id,
      action_type: 'send_notification',
      action_payload: { message: 'the schedule form google calendar' },
      schedule_type: 'one_time',
      schedule_value: event.start.dateTime || event.start.date,
      status: 'active',
      timezone: event.start.timeZone || 'GMT+7',
      next_run_at: event.start.dateTime || event.start.date,
      summary: event.summary,
    },
  ]);

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ message: 'Successfully processed webhook.' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
