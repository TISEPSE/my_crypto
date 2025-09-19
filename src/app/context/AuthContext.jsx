"use client"
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const router = useRouter()
  // PERFORMANCE OPTIMIZATION: Initialize auth state synchronously to prevent loading delays
  const [user, setUser] = useState(() => {
    // Initialize user state immediately on first render to avoid loading screens
    if (typeof window !== 'undefined') {
      try {
        const storedUserData = localStorage.getItem('user-data')
        if (storedUserData) {
          const userData = JSON.parse(storedUserData)
          return userData
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-data')
        }
      }
    }
    return null
  })

  const [authenticated, setAuthenticated] = useState(() => {
    // CRITICAL FIX: Initialize authentication state based on BOTH user data AND auth token
    if (typeof window !== 'undefined') {
      try {
        const storedUserData = localStorage.getItem('user-data')
        const authToken = localStorage.getItem('auth-token')
        // Must have both user data AND valid auth token to be considered authenticated
        return !!(storedUserData && authToken)
      } catch (error) {
        return false
      }
    }
    return false
  })

  const [loading, setLoading] = useState(false) // IMMEDIATE READY STATE - no blocking

  // Lightweight effect for any remaining setup (non-blocking)
  useEffect(() => {
    // This effect is now just for consistency checks, not initial loading
    // The UI can render immediately without waiting for this
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (!email || !password) {
      return { success: false, message: 'Email et mot de passe requis' }
    }

    try {
      console.log('Attempting login with:', { email })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        }),
        credentials: 'include' // Important for cookies
      })

      const data = await response.json()
      console.log('Login response:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de connexion')
      }

      if (!data.user) {
        throw new Error('Données utilisateur manquantes')
      }

      // Store auth token if provided by the API
      if (data.token) {
        localStorage.setItem('auth-token', data.token)
      }

      // Update state immediately
      setUser(data.user)
      setAuthenticated(true)
      localStorage.setItem('user-data', JSON.stringify(data.user))

      console.log('Login successful, redirecting to /crypto')

      // Small delay to ensure state is updated, then use router
      setTimeout(() => {
        router.replace('/crypto')
      }, 100)

      return { success: true, message: data.message || 'Connexion réussie' }
    } catch (error) {
      console.error('Sign in error:', error)
      // Clear any stale data on error
      setUser(null)
      setAuthenticated(false)
      localStorage.removeItem('user-data')
      localStorage.removeItem('auth-token')
      return { success: false, message: error.message }
    }
  }, [])

  const signUp = useCallback(async (email, password, username) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de création de compte')
      }

      // Registration successful, redirect to login page (which is '/')
      setTimeout(() => {
        router.replace('/')
      }, 100)

      return { success: true, message: data.message }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, message: error.message }
    }
  }, [])

  const signOut = useCallback(async () => {
    console.log('Logging out user...')

    // Immediately clear local state to prevent UI glitches
    setUser(null)
    setAuthenticated(false)
    localStorage.removeItem('user-data')
    localStorage.removeItem('auth-token')

    try {
      // Call logout API to clear server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout API error (non-critical):', error)
      // Don't block logout on API errors
    }

    // Force immediate redirect to login page
    console.log('Redirecting to login page')
    router.replace('/') // Use Next.js router to prevent refresh loops
  }, [])

  const updateUser = useCallback((newUserData) => {
    setUser(newUserData)
    if (newUserData) {
      localStorage.setItem('user-data', JSON.stringify(newUserData))
    }
  }, [])

  const value = useMemo(() => ({
    user,
    authenticated,
    loading,
    signIn,
    signUp,
    signOut,
    updateUser
  }), [user, authenticated, loading, signIn, signUp, signOut, updateUser])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}