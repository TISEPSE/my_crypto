import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaUser } from 'react-icons/fa'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

export default function AuthButton({ setIsOpen }) {
  const { user, authenticated, loading, signIn, signOut } = useAuth()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      signIn()
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-[#2a2d3e] px-3 py-2 rounded-lg border border-gray-600/30">
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-400">{t('common.loading')}</span>
      </div>
    )
  }

  if (authenticated && user) {
    return (
      <div className="w-full">
        <Link
          href="/profile"
          className="block w-full hover:text-blue-300 hover:bg-gradient-to-r hover:from-blue-600/15 hover:to-blue-600/10 hover:border-blue-500/50 transition-all duration-300 rounded-lg group border border-gray-500/40 bg-gradient-to-r from-[#2a2d3e] to-[#252837] hover:opacity-90"
          onClick={(e) => {
            e.stopPropagation();
            if (setIsOpen) setIsOpen(false);
          }}
        >
          <div className="flex items-center gap-3 py-3 px-4 w-full h-full">
            <div className="w-8 h-8 rounded-full flex-shrink-0 transition-transform duration-300 group-hover:opacity-80 overflow-hidden bg-gradient-to-br from-[#3A6FF8] to-[#2952d3] flex items-center justify-center">
              <span className="text-base">👤</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate group-hover:translate-x-0.5 transition-transform duration-300">{user.name}</div>
              <div className="text-xs text-gray-400 truncate">{user.email}</div>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 w-full max-w-[240px] sm:min-w-[220px] mx-4"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="font-medium text-sm">
          {isLoading ? t('auth.connecting') : t('auth.signIn')}
        </span>
      </button>
    </div>
  )
}