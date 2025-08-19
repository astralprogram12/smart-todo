'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, whatsappAuth } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  sendWhatsAppOTP: (phone: string) => Promise<any>
  verifyWhatsAppOTP: (phone: string, code: string, signupMode?: boolean) => Promise<any>
  sendSimplifiedWhatsAppOTP: (phone: string, demoMode?: boolean, signupMode?: boolean) => Promise<any>
  verifySimplifiedWhatsAppOTP: (phone: string, code: string, skipVerification?: boolean, signupMode?: boolean) => Promise<any>
  signOut: () => Promise<any>
  isTestMode: boolean
  setTestMode: (enable: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTestMode, setIsTestMode] = useState(false)

  // Load user on mount
  useEffect(() => {
    async function loadUser() {
      try {
        // Try to get session from Supabase
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user || null)
        
        // If no session, check localStorage for demo sessions
        if (!session) {
          try {
            const localSession = localStorage.getItem('supabase.auth.token')
            if (localSession) {
              const parsed = JSON.parse(localSession)
              if (parsed.currentSession?.user) {
                console.log('Found demo session in localStorage')
                setUser(parsed.currentSession.user)
              }
            }
          } catch (e) {
            console.error('Failed to get demo session from localStorage:', e)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    loadUser()

    // Set up auth listener - KEEP SIMPLE, avoid any async operations in callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // NEVER use any async operations in callback
        setSession(session)
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Toggle test mode
  function setTestMode(enable: boolean) {
    setIsTestMode(enable)
    whatsappAuth.enableTestMode(enable)
  }

  // WhatsApp authentication methods
  async function sendWhatsAppOTP(phone: string) {
    return await whatsappAuth.sendOTP(phone)
  }

  async function verifyWhatsAppOTP(phone: string, code: string, signupMode = false) {
    return await whatsappAuth.verifyOTP(phone, code, signupMode)
  }
  
  // Simplified WhatsApp authentication methods
  async function sendSimplifiedWhatsAppOTP(phone: string, demoMode = false, signupMode = false) {
    return await whatsappAuth.sendSimplifiedOTP(phone, demoMode, signupMode)
  }

  async function verifySimplifiedWhatsAppOTP(phone: string, code: string, skipVerification = false, signupMode = false) {
    return await whatsappAuth.verifySimplifiedOTP(phone, code, skipVerification, signupMode)
  }

  async function signOut() {
    return await whatsappAuth.signOut()
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      sendWhatsAppOTP,
      verifyWhatsAppOTP,
      sendSimplifiedWhatsAppOTP,
      verifySimplifiedWhatsAppOTP,
      signOut,
      isTestMode,
      setTestMode
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
