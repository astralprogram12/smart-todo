'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, whatsappAuth } from '../lib/supabase'

// 1. We remove the old function types from our interface
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  sendSimplifiedWhatsAppOTP: (phone: string, demoMode?: boolean, signupMode?: boolean) => Promise<any>
  verifySimplifiedWhatsAppOTP: (phone: string, code: string, skipVerification?: boolean, signupMode?: boolean) => Promise<any>
  signOut: () => Promise<any>
  isTestMode: boolean
  setTestMode: (enable: boolean) => void
  setAuthSession: (session: Session) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTestMode, setIsTestMode] = useState(false)

  // Load user on mount - this logic remains the same
  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user || null)
      } finally {
        setLoading(false)
      }
    }
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  function setTestMode(enable: boolean) {
    setIsTestMode(enable)
    whatsappAuth.enableTestMode(enable)
  }
  
  // 2. We keep ONLY the new, simplified functions
  async function sendSimplifiedWhatsAppOTP(phone: string, demoMode = false, signupMode = false) {
    return await whatsappAuth.sendSimplifiedOTP(phone, demoMode, signupMode)
  }

  async function verifySimplifiedWhatsAppOTP(phone: string, code: string, skipVerification = false, signupMode = false) {
    const response = await whatsappAuth.verifySimplifiedOTP(phone, code, skipVerification, signupMode)
    
    // If verification is successful and a session is returned, set it
    if (response.data?.session) {
        await setAuthSession(response.data.session)
    }
    
    return response
  }

  async function signOut() {
    return await whatsappAuth.signOut()
  }

  async function setAuthSession(sessionData: Session) {
    const { data, error } = await supabase.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
    })

    if (error) {
      console.error('Failed to set session:', error)
      return
    }

    setSession(data.session)
    setUser(data.user)
  }

  // 3. We remove the old functions from the returned value object
  const value = {
    user,
    session,
    loading,
    sendSimplifiedWhatsAppOTP,
    verifySimplifiedWhatsAppOTP,
    signOut,
    isTestMode,
    setTestMode,
    setAuthSession
  }

  return (
    <AuthContext.Provider value={value}>
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
