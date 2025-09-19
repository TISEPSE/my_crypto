"use client"
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthGuard({ children, fallback = null, redirectTo = '/' }) {
  const { authenticated, loading, user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // CRITICAL FIX: Only redirect if we're not loading AND not authenticated AND NOT already on the redirect page
    if (!loading && !authenticated && !user && !hasRedirected) {
      // Check if we're already on the redirect target page to prevent infinite loops
      if (typeof window !== 'undefined' && window.location.pathname !== redirectTo) {
        console.log('AuthGuard: Redirecting unauthenticated user to login')
        setHasRedirected(true)
        // Use Next.js router instead of hard redirect to prevent infinite loops
        router.replace(redirectTo)
      }
    }
  }, [loading, authenticated, user, hasRedirected, redirectTo, router])

  // CRITICAL FIX: Show loading only if actually loading AND we don't have user data
  if (loading && !user) {
    return (
      fallback ||
      <div className="min-h-screen bg-[#212332] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500/30 border-t-orange-500"></div>
          <p className="text-gray-400">{t('auth.loginRequired')}...</p>
        </div>
      </div>
    )
  }

  // CRITICAL FIX: Only block if definitively not authenticated AND not on the login page
  if (!loading && (!authenticated || !user)) {
    // Don't show loading screen if redirect is about to happen
    if (hasRedirected) {
      return null
    }

    // Don't block content if we're already on the redirect target (login page)
    if (typeof window !== 'undefined' && window.location.pathname === redirectTo) {
      return children // Allow login page to render
    }

    return (
      <div className="min-h-screen bg-[#212332] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500/30 border-t-orange-500"></div>
          <p className="text-gray-400">{t('auth.loginRequired') || 'Authentication required'}</p>
        </div>
      </div>
    )
  }

  // Authentifié et chargé, afficher le contenu
  return children
}