# Nenrin OTP App 🚀

A modern, responsive React application featuring WhatsApp OTP authentication powered by Supabase. Built with TypeScript, Tailwind CSS, and cutting-edge UI components.

## ✨ Features

- 🔐 **WhatsApp OTP Authentication** - Secure phone number verification
- 📱 **Responsive Design** - Mobile-first approach with modern UI
- 🎨 **Beautiful Dashboard** - Interactive user dashboard with animations
- 🔒 **Supabase Backend** - Robust authentication and database management
- ⚡ **Fast Performance** - Built with Vite for lightning-fast development
- 🎯 **TypeScript** - Type-safe development experience
- 🎭 **Shadcn/UI Components** - Beautiful, accessible UI components
- 🌙 **Theme Support** - Light/dark mode compatibility

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI, Shadcn/UI
- **Backend**: Supabase (Authentication, Database, Edge Functions)
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Fonnte account (for WhatsApp integration)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd nenrin-otp-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Fill in your environment variables:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# WhatsApp/Fonnte Configuration
VITE_FONNTE_TOKEN=your_fonnte_token_here
```

### 4. Supabase Setup

1. Create a new Supabase project
2. Set up your authentication policies
3. Deploy the necessary Edge Functions (if any)
4. Configure your database schema

### 5. Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### 6. Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
src/
├── components/         # Reusable UI components
├── contexts/          # React contexts (Auth, etc.)
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and configurations
├── pages/             # Application pages/routes
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── DashboardPage.tsx
│   └── ...
├── App.tsx            # Main application component
├── main.tsx          # Application entry point
└── index.css         # Global styles
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **GitHub Integration**:
   - Push your code to GitHub
   - Connect your GitHub repository to Vercel
   - Vercel will automatically detect it as a Vite project

2. **Environment Variables**:
   Add the following environment variables in Vercel dashboard:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_FONNTE_TOKEN=your_fonnte_token
   ```

3. **Deploy**:
   Vercel will automatically build and deploy your app.

### Alternative Deployment Options

- **Netlify**: Works out of the box with Vite
- **Firebase Hosting**: Configure with `firebase.json`
- **GitHub Pages**: Use `gh-pages` for static deployment

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm start` | Alias for `npm run dev` |

## 🎨 Customization

### Styling
- Modify `tailwind.config.js` for custom theme
- Update CSS variables in `src/index.css`
- Customize component styles in respective component files

### Authentication Flow
- Configure OTP settings in `src/contexts/AuthContext.tsx`
- Modify authentication pages in `src/pages/`
- Update Supabase policies as needed

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [documentation]()
2. Search existing [issues]()
3. Create a new issue with detailed information

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for the amazing backend-as-a-service
- [Shadcn/UI](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Vite](https://vitejs.dev/) for the blazing fast build tool

---

Built with ❤️ using modern web technologies
