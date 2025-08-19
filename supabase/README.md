# Supabase

This directory contains the Supabase configuration, migrations, and edge functions for the Nenrin OTP App.

## Structure

- `migrations/` - Database migrations
- `functions/` - Supabase Edge Functions
- `config.toml` - Supabase CLI configuration (if using local development)

## Setup

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link to your project:
```bash
supabase link --project-ref <your-project-ref>
```

4. Run migrations:
```bash
supabase db push
```

5. Deploy functions:
```bash
supabase functions deploy
```

## Environment Variables

Make sure to set up the following environment variables in your Vercel deployment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_FONNTE_TOKEN` (for WhatsApp integration)
