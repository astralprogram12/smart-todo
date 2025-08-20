# Vercel Environment Variables Setup

## Required Variables

Set these in your Vercel project dashboard:

### 1. Go to your Vercel project
- Dashboard → Project → Settings → Environment Variables

### 2. Add these variables:

**Variable Name:** `VITE_SUPABASE_URL`
**Value:** Your Supabase project URL (e.g., https://abcdefgh.supabase.co)
**Environments:** Production, Preview, Development

**Variable Name:** `VITE_SUPABASE_ANON_KEY`
**Value:** Your Supabase anon/public key
**Environments:** Production, Preview, Development

**Variable Name:** `VITE_FONNTE_TOKEN` (Optional)
**Value:** Your Fonnte API token for WhatsApp
**Environments:** Production, Preview, Development

### 3. Common Issues

❌ **Wrong prefix:** `NEXT_PUBLIC_SUPABASE_URL` (Next.js style)
✅ **Correct prefix:** `VITE_SUPABASE_URL` (Vite style)

❌ **Missing prefix:** `SUPABASE_URL`
✅ **With prefix:** `VITE_SUPABASE_URL`

❌ **Wrong environment:** Only set for "Development"
✅ **All environments:** Production, Preview, Development

### 4. After Setting Variables

1. Redeploy your application
2. Variables are only loaded during build time
3. Check the deployment logs to ensure build succeeded

### 5. Verification

Once deployed with correct variables:
- App should load without "placeholder" values
- OTP functionality should work
- No console errors related to Supabase

## Getting Your Supabase Credentials

1. Go to your Supabase dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → use as `VITE_SUPABASE_URL`
   - **anon/public key** → use as `VITE_SUPABASE_ANON_KEY`

⚠️ **Never use the service_role key for frontend applications!**
