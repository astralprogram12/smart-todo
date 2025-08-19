'use client'

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check for a hash fragment (standard Supabase auth flow)
      const hashFragment = window.location.hash

      if (hashFragment && hashFragment.length > 0) {
        // Exchange the auth code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(hashFragment)

        if (error) {
          console.error('Error exchanging code for session:', error.message)
          // Redirect to error page or show error message
          navigate('/login?error=' + encodeURIComponent(error.message))
          return
        }

        if (data.session) {
          // Successfully signed in, redirect to app
          navigate('/')
          return
        }
      }

      // If we get here, no valid session was found
      navigate('/login?error=No session found')
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--nenrin-mist)]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[var(--nenrin-forest)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[var(--nenrin-sage)]">Completing your sign-in...</p>
      </div>
    </div>
  )
}
