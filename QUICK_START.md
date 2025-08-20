# 🚀 Quick Start - Deploy in 5 Minutes

## Option A: Static Deploy (No Backend)

**Best for**: Demo, portfolio, or frontend preview

1. **Download** this package
2. **Upload** the `dist/` folder to:
   - [Netlify](https://netlify.com) (drag & drop)
   - [Vercel](https://vercel.com) (upload folder)
   - [Surge.sh](https://surge.sh) (`surge dist/`)

✅ **Done!** Your app is live in minutes.

## Option B: Full Deploy with Backend

**Best for**: Production use with authentication

### Step 1: Get Accounts
- [Supabase](https://supabase.com) (free tier available)
- [Fonnte](https://fonnte.com) (WhatsApp API)

### Step 2: Deploy to Vercel
1. Upload this folder to GitHub
2. Connect to [Vercel](https://vercel.com)
3. Add environment variables:
   ```
   VITE_SUPABASE_URL=your_url_here
   VITE_SUPABASE_ANON_KEY=your_key_here
   VITE_FONNTE_TOKEN=your_token_here
   ```

### Step 3: Setup Supabase
1. Create new project in Supabase
2. Upload SQL schema (contact for schema file)
3. Deploy edge functions

✅ **Done!** Full-featured app with authentication.

---

**Need help?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions.