# Deployment Guide 🚀

Step-by-step guide to deploy the Nenrin OTP App to production using Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Supabase project
- Fonnte account (for WhatsApp integration)

## 🔄 Step 1: GitHub Setup

### 1.1 Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `nenrin-otp-app` or your preferred name
3. Keep it public or private as needed
4. Don't initialize with README (we already have one)

### 1.2 Upload Your Code

```bash
# Navigate to your project folder
cd nenrin-otp-app

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Nenrin OTP App"

# Add remote origin (replace with your repo URL)
git remote add origin https://github.com/yourusername/nenrin-otp-app.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🔗 Step 2: Vercel Deployment

### 2.1 Connect GitHub to Vercel

1. Go to [Vercel](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it as a Vite project

### 2.2 Configure Build Settings

Vercel should automatically detect:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

If not, set these manually.

### 2.3 Environment Variables

In Vercel dashboard, go to your project settings and add these environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_FONNTE_TOKEN=your_fonnte_token_here
```

**How to get these values:**

- **Supabase URL & Key**: Go to your Supabase project settings > API
- **Fonnte Token**: Get from your Fonnte dashboard

### 2.4 Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be live at `https://your-project-name.vercel.app`

## 🗺 Step 3: Supabase Configuration

### 3.1 Database Setup

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Run any necessary migrations from the `supabase/migrations/` folder

### 3.2 Authentication Setup

1. Go to "Authentication" > "Settings"
2. Configure your authentication settings
3. Add your Vercel domain to "Site URL" and "Redirect URLs"
4. Set up WhatsApp provider configuration if needed

### 3.3 Edge Functions (if applicable)

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref <your-project-ref>`
4. Deploy functions: `supabase functions deploy`

## ⚙️ Step 4: Custom Domain (Optional)

1. In Vercel dashboard, go to project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Update Supabase authentication settings with new domain

## 🛠 Troubleshooting

### Build Fails

**Issue**: TypeScript errors during build

**Solution**:
```bash
# Fix TypeScript errors or temporarily disable strict checks
npm run build -- --mode production
```

### Environment Variables Not Working

**Issue**: Environment variables are undefined

**Solution**:
1. Ensure variables start with `VITE_`
2. Redeploy after adding variables
3. Check variable names for typos

### Supabase Connection Issues

**Issue**: Cannot connect to Supabase

**Solution**:
1. Verify URL and key are correct
2. Check RLS policies
3. Ensure domain is whitelisted in Supabase

### WhatsApp OTP Not Working

**Issue**: OTP messages not sending

**Solution**:
1. Verify Fonnte token is correct
2. Check phone number format
3. Ensure sufficient Fonnte credits
4. Check edge function logs

## 🔄 Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy on every push to main branch
- Create preview deployments for pull requests
- Show deployment status in GitHub

## 📊 Monitoring

### Vercel Analytics
1. Enable Vercel Analytics in project settings
2. Monitor performance and usage

### Supabase Monitoring
1. Check Supabase dashboard for:
   - API usage
   - Database performance
   - Authentication metrics
   - Edge function logs

## 🔒 Security Checklist

- ☑️ Environment variables are secure
- ☑️ RLS policies are properly configured
- ☑️ CORS settings are correct
- ☑️ API keys have appropriate permissions
- ☑️ Custom domain has SSL (Vercel provides this automatically)

## 🚆 Performance Optimization

1. **Enable Vercel Analytics**: Monitor Core Web Vitals
2. **Optimize Images**: Use appropriate formats and sizes
3. **Bundle Analysis**: Use `npm run build -- --analyze`
4. **Caching**: Leverage Vercel's edge caching

## 🎆 Success!

Your Nenrin OTP App is now live! 🎉

**Next Steps:**
- Share your app URL
- Monitor performance and usage
- Collect user feedback
- Plan future enhancements

---

**Need Help?** Check the main README.md for troubleshooting tips or create an issue in the GitHub repository.
