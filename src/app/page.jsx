"use client"
import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { useLanguage } from './context/LanguageContext'
import { useRouter } from 'next/navigation'
import { FaBitcoin, FaEye, FaEyeSlash } from 'react-icons/fa'

export default function Home() {
  const { signIn, signUp, loading: authLoading, authenticated } = useAuth()
  const { t, isInitialized } = useLanguage()
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // AFFICHAGE IMMÉDIAT - PLUS DE VÉRIFICATION MOUNTED
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    // Clear previous messages
    setError('')
    setSuccess('')

    // Basic validation
    if (!formData.email?.trim()) {
      setError('Email requis')
      return
    }

    if (!formData.password?.trim()) {
      setError('Mot de passe requis')
      return
    }

    if (isSignUp && formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setIsSubmitting(true)

    try {
      console.log('Form submission:', { isSignUp, email: formData.email })

      let result
      if (isSignUp) {
        result = await signUp(formData.email, formData.password, formData.username)
      } else {
        result = await signIn(formData.email, formData.password)
      }

      console.log('Auth result:', result)

      if (result.success) {
        setSuccess(result.message)
        // Si c'est une inscription réussie, basculer vers le formulaire de connexion
        if (isSignUp) {
          setTimeout(() => {
            setIsSignUp(false)
            setFormData({ email: formData.email, password: '', username: '' })
            setSuccess('Compte créé ! Vous pouvez maintenant vous connecter.')
          }, 1500)
        }
        // La redirection pour signIn est gérée dans signIn
      } else {
        setError(result.message || 'Erreur inconnue')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setError(error.message || t('auth.unexpectedError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Redirect if already authenticated using Next.js router
  useEffect(() => {
    if (authenticated) {
      console.log('User already authenticated, redirecting to /crypto')
      router.replace('/crypto')
    }
  }, [authenticated, router])

  // PERFORMANCE OPTIMIZATION: No more loading screens blocking the login form
  // Both contexts now initialize immediately, so users can see the login form instantly

  // Show loading while redirecting authenticated users
  if (authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#212332] to-[#2a2d3e] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500/30 border-t-orange-500"></div>
          <p className="text-gray-400 text-sm">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#212332] to-[#2a2d3e] flex items-center justify-center p-4 animate-fade-in overflow-hidden">
      <div className="bg-gradient-to-r from-[#2a2d3e] to-[#252837] border border-gray-600/20 rounded-2xl p-4 sm:p-8 max-w-md w-full mx-auto shadow-2xl animate-slide-up transition-all duration-200 hover:border-gray-500/40 hover:opacity-95 max-h-[90vh] overflow-y-auto">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaBitcoin className="text-white text-2xl" />
        </div>

        <div className="transition-all duration-500 ease-in-out">
          <h1 className="text-3xl font-bold text-white mb-2 text-center transition-all duration-300">
            {isSignUp ? t('auth.createAccount') : t('auth.loginRequired')}
          </h1>
          <p className="text-gray-400 mb-8 text-center transition-all duration-300">
            {isSignUp
              ? t('auth.joinUs')
              : t('auth.mustLoginToAccess')
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-6">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('auth.emailPlaceholder')}
              className="w-full bg-[#1a1d29] border border-gray-600/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:border-gray-500/50  focus:shadow-[0_0_0_3px_rgba(251,146,60,0.1)]"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          {isSignUp && (
            <div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder={t('auth.usernameOptional')}
                className="w-full bg-[#1a1d29] border border-gray-600/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:border-gray-500/50  focus:shadow-[0_0_0_3px_rgba(251,146,60,0.1)]"
                autoComplete="username"
              />
            </div>
          )}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full bg-[#1a1d29] border border-gray-600/30 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:border-gray-500/50  focus:shadow-[0_0_0_3px_rgba(251,146,60,0.1)]"
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-all duration-200 ease-smooth hover:opacity-80"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !formData.email.trim() || !formData.password.trim()}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 hover:opacity-90"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                {isSignUp ? t('auth.creatingAccount') : t('auth.connecting')}
              </div>
            ) : (
              isSignUp ? t('auth.createAccount') : t('auth.signIn')
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
              setSuccess('')
              setFormData({ email: '', password: '', username: '' })
            }}
            className="text-gray-400 hover:text-orange-500 transition-colors duration-200 text-sm font-medium"
          >
            {isSignUp
              ? t('auth.alreadyAccount')
              : t('auth.noAccount')
            }
          </button>
        </div>

        {isSignUp && (
          <p className="text-gray-500 text-xs mt-4 text-center">
            {t('auth.termsAccept')}
          </p>
        )}
      </div>
    </div>
  )
}