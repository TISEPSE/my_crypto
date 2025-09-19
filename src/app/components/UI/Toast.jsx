import React, { useState, useEffect } from 'react'

const Toast = ({ message, type = 'success', isVisible, onClose, duration = 3000, needsAuth = false }) => {
  const [shouldRender, setShouldRender] = useState(false)
  const [animationClass, setAnimationClass] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleClose = () => {
    setAnimationClass('animate-toast-out')
    setTimeout(() => {
      setShouldRender(false)
      onClose()
    }, 300)
  }

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      // Petite attente pour déclencher l'animation d'entrée
      setTimeout(() => {
        setAnimationClass(needsAuth ? 'animate-toast-in animate-pulse' : 'animate-toast-in')
      }, 10)
      
      // Auto-fermeture pour tous les toasts, mais plus long pour needsAuth
      const timer = setTimeout(() => {
        handleClose()
      }, needsAuth ? duration * 2 : duration) // Plus long pour les toasts d'auth
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, needsAuth])

  if (!shouldRender) return null

  const getToastStyles = () => {
    if (needsAuth) {
      return `fixed top-4 right-4 z-50 rounded-lg shadow-2xl transform transition-all duration-300 ease-in-out max-w-sm ${animationClass} bg-gradient-to-br from-[#2a2d3e] via-[#3a3d4e] to-[#4a4d5e] text-white border border-[#5a5d6e]/50 backdrop-blur-sm`
    }
    
    const baseStyles = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out flex items-center gap-3 max-w-sm ${animationClass}`
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-emerald-600 text-white border border-emerald-500`
      case 'error':
        return `${baseStyles} bg-red-600 text-white border border-red-500`
      case 'info':
        return `${baseStyles} bg-blue-600 text-white border border-blue-500`
      default:
        return `${baseStyles} bg-gray-600 text-white border border-gray-500`
    }
  }

  const getIcon = () => {
    if (needsAuth) return '🔐'
    
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'info':
        return 'ℹ'
      default:
        return '•'
    }
  }

  // Design spécial pour les toasts d'authentification
  if (needsAuth) {
    return (
      <div className={getToastStyles()}>
        <div className="relative p-6">
          {/* Bouton de fermeture */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200 flex items-center justify-center text-white/70 hover:text-white group"
          >
            <svg 
              className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Contenu */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl">
              {getIcon()}
            </div>
            <div className="flex-1 pt-1">
              <h4 className="font-semibold text-lg mb-2 text-white">
                Connexion requise
              </h4>
              <p className="text-white/90 text-sm leading-relaxed mb-4">
                {message}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={handleClose}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm font-medium transition-colors duration-200 text-white/80 hover:text-white"
                >
                  Plus tard
                </button>
                <button 
                  onClick={async () => {
                    setIsConnecting(true)
                    try {
                      // Redirect to custom Google OAuth endpoint
                      window.location.href = '/api/auth/google'
                    } catch (error) {
                      console.error('Erreur de connexion:', error)
                      setIsConnecting(false)
                    }
                  }}
                  disabled={isConnecting}
                  className="px-4 py-2 bg-[#3A6FF8] text-white hover:bg-[#2A5FE8] disabled:bg-gray-500 disabled:text-gray-300 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  {isConnecting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {isConnecting ? 'Connexion...' : 'Se connecter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Design normal pour les autres toasts
  return (
    <div className={getToastStyles()}>
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
        {getIcon()}
      </div>
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200 flex items-center justify-center text-xs"
      >
        ✕
      </button>
    </div>
  )
}

export default Toast