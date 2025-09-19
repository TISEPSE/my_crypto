"use client"
import { useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useUserData } from '../context/UserDataContext'
import { useAuth } from '../context/AuthContext'

/**
 * Component that handles synchronization from user data to language context
 * This ensures that language preference is consistent across the application
 */
export default function LanguageSync() {
  const { syncLanguageFromUserData, resetToFrench, isInitialized, currentLanguage } = useLanguage()
  const { userData } = useUserData()
  const { authenticated } = useAuth()
  const hasSynced = useRef(false)

  // One-time sync when both contexts are ready and user data is available
  useEffect(() => {
    if (
      isInitialized &&
      authenticated &&
      userData?.language &&
      !hasSynced.current &&
      userData.language !== currentLanguage
    ) {
      syncLanguageFromUserData(userData.language)
      hasSynced.current = true
    }
  }, [userData?.language, syncLanguageFromUserData, isInitialized, currentLanguage, authenticated])

  // Reset to French when user logs out
  useEffect(() => {
    if (isInitialized && !authenticated) {
      resetToFrench()
      hasSynced.current = false
    }
  }, [authenticated, isInitialized, resetToFrench])

  // Reset sync flag when user changes (for logout/login scenarios)
  useEffect(() => {
    if (!userData) {
      hasSynced.current = false
    }
  }, [userData])

  // This component doesn't render anything
  return null
}