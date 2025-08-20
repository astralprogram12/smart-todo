# Nenrin OTP App - Deployment Guide

This package contains everything you need to deploy the Nenrin OTP App on various platforms.

## 📁 Package Contents

- `dist/` - Pre-built static files ready for deployment
- `src/` - Source code for development and customization
- `package.json` - Dependencies and build scripts
- `.env.example` - Environment variables template
- `vercel.json` - Vercel deployment configuration
- `README.md` - Original project documentation

## 🚀 Quick Deploy Options

### Option 1: Static File Deployment (Fastest)

If you just want to deploy the app as-is:

1. **Upload the `dist/` folder contents** to any static hosting service:
   - Netlify: Drag & drop the `dist` folder
   - Vercel: Upload the `dist` folder
   - AWS S3: Upload to S3 bucket with static hosting
   - GitHub Pages: Copy `dist` contents to repository

### Option 2: Full Development Setup

For development or customization:

1. **Upload the entire project** (excluding `node_modules`)
2. **Install dependencies**: `npm install`
3. **Configure environment variables** (see Environment Setup below)
4. **Build**: `npm run build`
5. **Deploy**: Use platform-specific deployment commands

## 🌐 Platform-Specific Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Or upload the project to GitHub and connect to Vercel dashboard.

**Environment Variables in Vercel:**
- Go to Project Settings → Environment Variables
- Add your Supabase and Fonnte credentials

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

Or drag & drop the `dist` folder to Netlify dashboard.

### AWS S3 + CloudFront

1. Create S3 bucket with static hosting enabled
2. Upload `dist/` contents to the bucket
3. Configure CloudFront distribution
4. Update bucket policy for public access

### GitHub Pages

1. Create GitHub repository
2. Copy `dist/` contents to repository root
3. Enable GitHub Pages in repository settings

### DigitalOcean App Platform

1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`

## 🔧 Environment Setup

### Required Environment Variables

Create `.env.local` file with:

```env
# Supabase Configuration (Required for backend functionality)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# WhatsApp/Fonnte Configuration (Required for OTP)
VITE_FONNTE_TOKEN=your_fonnte_api_token
```

### Getting Supabase Credentials

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → API
4. Copy the URL and anon key

### Getting Fonnte Token

1. Sign up at [fonnte.com](https://fonnte.com)
2. Go to dashboard
3. Copy your API token

## 🛠 Build Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📝 Customization

### Updating App Content

- **Homepage**: Edit `src/pages/HomePage.tsx`
- **Branding**: Update `src/components/Header.tsx`
- **Styling**: Modify `src/index.css` and Tailwind classes
- **Features**: Edit `src/pages/FeaturesPage.tsx`

### Adding Backend Integration

1. Set up Supabase project
2. Deploy edge functions from `supabase/functions/`
3. Configure authentication policies
4. Update environment variables

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Use environment variables for all API keys
- Configure CORS policies in Supabase
- Set up proper authentication policies

## 📞 Support

For deployment issues:
1. Check the original README.md for detailed project information
2. Verify all environment variables are set correctly
3. Ensure build process completes without errors

## 🎯 Post-Deployment

After successful deployment:
1. Test all pages and navigation
2. Verify responsive design on mobile
3. Test authentication flow (when backend is configured)
4. Monitor performance and loading times

---

**Your app is now ready for deployment! Choose the platform that best fits your needs.**