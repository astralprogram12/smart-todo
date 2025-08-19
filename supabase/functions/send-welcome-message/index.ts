// send-welcome-message/index.ts

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
    console.log('Starting welcome message send process')
    
    // Get environment variables
    const fonnteToken = Deno.env.get('FONNTE_TOKEN')

    if (!fonnteToken) {
      console.error('Server Error: Missing FONNTE_TOKEN env variable.')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get request data
    const { phone } = await req.json()
    console.log('Received phone number for welcome message:', phone)
    
    // Validate phone
    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      console.error('Invalid phone number format')
      return new Response(JSON.stringify({ error: 'Valid phone number is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Normalize phone number (add country code if missing, handle leading zeros)
    const normalizedPhone = normalizePhoneNumber(phone)
    console.log('Normalized phone number:', normalizedPhone)

    // Welcome message content
    const welcomeMessage = `All set 🌱

I'm Nenrin — calm help for tasks, reminders, and your private journal.

Just message me in your own words, and I'll take care of the rest.`

    // Extract country code and local phone number
    const countryCode = normalizedPhone.startsWith('1') ? '1' : normalizedPhone.slice(0, -10)
    console.log('Extracted country code:', countryCode)

    // Send welcome message via Fonnte
    console.log('Preparing to send welcome message via Fonnte API')
    const form = new FormData()
    form.set('target', normalizedPhone)
    form.set('message', welcomeMessage)
    form.set('countryCode', String(countryCode))
    form.set('schedule', '0')
    form.set('typing', 'false')
    form.set('delay', '2')

    console.log('Sending welcome message via Fonnte API with target:', normalizedPhone)
    const fonnteResponse = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: fonnteToken },
      body: form
    })

    console.log('Fonnte API response status:', fonnteResponse.status)
    const fonnteRespText = await fonnteResponse.text()
    console.log('Fonnte API response body:', fonnteRespText)

    if (!fonnteResponse.ok) {
      console.error('Fonnte send failed:', fonnteRespText)
      throw new Error('Failed to send welcome message via WhatsApp')
    }

    console.log('Welcome message sending process completed successfully')

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome message sent to your WhatsApp'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Welcome Message Send Error:', error.message)
    return new Response(
      JSON.stringify({ error: error?.message || 'An unknown server error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
