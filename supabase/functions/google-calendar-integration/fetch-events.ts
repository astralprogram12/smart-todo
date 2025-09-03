import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { google } from 'https://googleapis.deno.dev/v1/apis/calendar/v3.ts';

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

  const { data: events } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  if (!events.items) {
    return new Response(JSON.stringify({ message: 'No upcoming events found.' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const scheduledActions = events.items.map((event) => ({
    user_id: user.id,
    action_type: 'send_notification',
    action_payload: { message: 'the schedule form google calendar' },
    schedule_type: 'one_time',
    schedule_value: event.start.dateTime || event.start.date,
    status: 'active',
    timezone: event.start.timeZone || 'GMT+7',
    next_run_at: event.start.dateTime || event.start.date,
    summary: event.summary,
  }));

  const { error: insertError } = await supabaseAdmin.from('scheduled_actions').insert(scheduledActions);

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ message: 'Successfully fetched and scheduled events.' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
