"use client"
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

// Import translations
import enTranslations from '../locales/en.json'
import frTranslations from '../locales/fr.json'

const translations = {
  en: enTranslations,
  fr: frTranslations
}

const LanguageContext = createContext({})

export function LanguageProvider({ children }) {
  // PERFORMANCE OPTIMIZATION: Initialize synchronously to prevent loading delays
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Initialize language immediately on first render to avoid loading screens
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem('user-data')
        if (userData) {
          const parsedUserData = JSON.parse(userData)
          if (parsedUserData.language && translations[parsedUserData.language]) {
            return parsedUserData.language
          }
        }
      } catch (error) {
        console.error('Error reading user language from localStorage:', error)
      }
    }
    return 'fr' // Default to French
  })

  const [previewLanguage, setPreviewLanguage] = useState(null)
  const [isClient, setIsClient] = useState(typeof window !== 'undefined')
  const [isInitialized, setIsInitialized] = useState(true) // IMMEDIATE INITIALIZATION

  // Lightweight effect for any remaining client-side setup
  useEffect(() => {
    if (!isClient) {
      setIsClient(true)
    }
  }, [])

  // Sync language from user data - simplified without circular dependency
  const syncLanguageFromUserData = useCallback((userLanguage) => {
    if (userLanguage && translations[userLanguage]) {
      setCurrentLanguage(userLanguage)
    }
  }, [])

  // Preview language change (for settings page) - doesn't save
  const previewLanguageChange = useCallback((newLanguage) => {
    if (translations[newLanguage]) {
      setPreviewLanguage(newLanguage)
    }
  }, [])

  // Apply language change - saves to backend and localStorage
  const changeLanguage = useCallback(async (newLanguage) => {
    if (translations[newLanguage]) {
      console.log(`🌐 Changing language to: ${newLanguage}`)

      // Immediately update the current language state
      setCurrentLanguage(newLanguage)
      setPreviewLanguage(null) // Clear preview

      // Only update backend and localStorage if we're on the client
      if (isClient) {
        try {
          // Get auth token from localStorage for API call
          const userData = localStorage.getItem('user-data')
          const authToken = localStorage.getItem('auth-token')

          if (userData && authToken) {
            // Update the local userData immediately for instant UI response
            const parsedUserData = JSON.parse(userData)
            parsedUserData.language = newLanguage
            localStorage.setItem('user-data', JSON.stringify(parsedUserData))

            // Save to backend with proper authentication
            const response = await fetch('/api/user/settings', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
              body: JSON.stringify({ language: newLanguage }),
            })

            if (response.ok) {
              const updatedUser = await response.json()
              localStorage.setItem('user-data', JSON.stringify(updatedUser))
              console.log(`✅ Language saved to backend: ${newLanguage}`)
            } else {
              console.error('Failed to save language preference to backend')
              // Keep the local change even if backend fails
            }
          } else {
            console.log('No auth token found, language change only applied locally')
          }
        } catch (error) {
          console.error('Error saving language preference:', error)
          // Keep the local change even if backend fails
        }
      }
    }
  }, [isClient])

  // Clear language preview
  const clearPreview = useCallback(() => {
    setPreviewLanguage(null)
  }, [])

  // Translation function with nested key support (memoized)
  const t = useCallback((key, params = {}) => {
    const keys = key.split('.')
    const activeLanguage = previewLanguage || currentLanguage
    let translation = translations[activeLanguage]

    // Navigate through nested keys
    for (const k of keys) {
      translation = translation?.[k]
      if (translation === undefined) break
    }

    // Fallback to English if translation not found
    if (translation === undefined) {
      translation = translations.en
      for (const k of keys) {
        translation = translation?.[k]
        if (translation === undefined) break
      }
    }

    // If still not found, return the key
    if (translation === undefined) {
      return key
    }

    // Handle string interpolation
    if (typeof translation === 'string' && Object.keys(params).length > 0) {
      return Object.keys(params).reduce((str, param) => {
        return str.replace(new RegExp(`{${param}}`, 'g'), params[param])
      }, translation)
    }

    return translation
  }, [currentLanguage, previewLanguage])

  // Get available languages (memoized to prevent re-renders)
  const availableLanguages = useMemo(() => [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'Français', nativeName: 'Français' }
  ], [])

  // Reset to French when user logs out (default language for this French app)
  const resetToFrench = useCallback(() => {
    setCurrentLanguage('fr')
    setPreviewLanguage(null)
  }, [])

  const value = useMemo(() => ({
    currentLanguage,
    previewLanguage,
    changeLanguage,
    previewLanguageChange,
    clearPreview,
    syncLanguageFromUserData,
    resetToFrench,
    t,
    availableLanguages,
    isClient,
    isInitialized
  }), [currentLanguage, previewLanguage, changeLanguage, previewLanguageChange, clearPreview, syncLanguageFromUserData, resetToFrench, t, availableLanguages, isClient, isInitialized])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}