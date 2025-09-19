"use client"
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from './AuthContext'

const UserDataContext = createContext({})

export function UserDataProvider({ children }) {
  const { user: authUser, authenticated, updateUser: updateAuthUser } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(false)

  // Sync user data with auth user
  useEffect(() => {
    if (authenticated && authUser) {
      // Auto-populate profile data from auth user
      const populatedUserData = {
        ...authUser,
        // Ensure username is populated from email if not set
        username: authUser.username || authUser.email?.split('@')[0] || '',
        // Ensure email is set from auth user
        email: authUser.email || '',
        // Set defaults for missing fields
        phone: authUser.phone || '',
        location: authUser.location || '',
        bio: authUser.bio || '',
        company: authUser.company || '',
        website: authUser.website || '',
        // Ensure language setting is available
        language: authUser.language || 'en',
        timezone: authUser.timezone || 'UTC',
        theme: authUser.theme || 'dark',
        // Ensure notification settings exist
        notifications: authUser.notifications || {
          priceAlerts: true,
          pushNotifications: false,
          emailNotifications: true,
          soundEnabled: true
        },
        // Ensure privacy settings exist
        privacy: authUser.privacy || {
          analytics: true,
          dataSharing: false,
          profileVisibility: 'private'
        }
      }
      setUserData(populatedUserData)
    } else {
      setUserData(null)
    }
  }, [authenticated, authUser])

  // Fetch fresh user data from server
  const refreshUserData = useCallback(async () => {
    if (!authenticated) return

    try {
      setLoading(true)
      const response = await fetch('/api/user/profile')

      if (response.ok) {
        const freshUserData = await response.json()
        setUserData(freshUserData)

        // Update localStorage to sync with AuthContext
        localStorage.setItem('user-data', JSON.stringify(freshUserData))

        return freshUserData
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    } finally {
      setLoading(false)
    }
  }, [authenticated])

  // Update user data
  const updateUserData = useCallback(async (updates) => {
    if (!authenticated) {
      throw new Error('User not authenticated')
    }

    try {
      setLoading(true)
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const updatedUser = await response.json()

      // Update local state
      setUserData(updatedUser)

      // Update localStorage to sync with AuthContext
      localStorage.setItem('user-data', JSON.stringify(updatedUser))

      return updatedUser
    } catch (error) {
      console.error('Error updating user data:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [authenticated])

  // Update user settings
  const updateUserSettings = useCallback(async (settings) => {
    if (!authenticated) {
      throw new Error('User not authenticated')
    }

    try {
      setLoading(true)

      // Separate profile updates from settings updates
      const profileUpdates = {}
      const settingsUpdates = {}

      // Profile fields that should go to /api/user/profile
      const profileFields = ['username', 'email', 'phone', 'location', 'bio', 'company', 'website']

      // Settings fields that should go to /api/user/settings
      const settingsFields = [
        'language', 'timezone', 'theme',
        'priceAlerts', 'pushNotifications', 'emailNotifications', 'soundEnabled',
        'analytics', 'dataSharing', 'profileVisibility'
      ]

      // Separate the updates
      Object.keys(settings).forEach(key => {
        if (profileFields.includes(key)) {
          profileUpdates[key] = settings[key]
        } else if (settingsFields.includes(key)) {
          settingsUpdates[key] = settings[key]
        }
      })

      let updatedUser = userData

      // Update profile if there are profile changes
      if (Object.keys(profileUpdates).length > 0) {
        const profileResponse = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileUpdates),
        })

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json()
          throw new Error(errorData.error || 'Failed to update profile')
        }

        updatedUser = await profileResponse.json()
      }

      // Update settings if there are setting changes
      if (Object.keys(settingsUpdates).length > 0) {
        const settingsResponse = await fetch('/api/user/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settingsUpdates),
        })

        if (!settingsResponse.ok) {
          const errorData = await settingsResponse.json()
          throw new Error(errorData.error || 'Failed to update settings')
        }

        updatedUser = await settingsResponse.json()
      }

      // Update local state
      setUserData(updatedUser)

      // Update localStorage to sync with AuthContext
      if (typeof window !== 'undefined') {
        localStorage.setItem('user-data', JSON.stringify(updatedUser))
      }

      // Also update AuthContext to keep it in sync
      if (updateAuthUser && typeof updateAuthUser === 'function') {
        updateAuthUser(updatedUser)
      }

      return updatedUser
    } catch (error) {
      console.error('Error updating user settings:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [authenticated])

  const value = useMemo(() => ({
    userData,
    loading,
    refreshUserData,
    updateUserData,
    updateUserSettings
  }), [userData, loading, refreshUserData, updateUserData, updateUserSettings])

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  )
}

export const useUserData = () => {
  const context = useContext(UserDataContext)
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider')
  }
  return context
}