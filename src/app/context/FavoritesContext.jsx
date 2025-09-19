'use client'

import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAuth } from './AuthContext'

const FavoritesContext = createContext()

export const useFavoritesContext = () => {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider')
  }
  return context
}

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user, authenticated } = useAuth()
  const loadingRef = useRef(false)

  const loadUserFavorites = useCallback(async () => {
    // CRITICAL FIX: Only load favorites if user is actually authenticated
    if (!authenticated || !user || loadingRef.current) {
      setFavorites([])
      setLoading(false)
      return
    }

    loadingRef.current = true

    try {
      setLoading(true)
      setError(null)

      // Get auth token for API call
      const authToken = localStorage.getItem('auth-token')
      if (!authToken) {
        console.log('No auth token found, skipping favorites load')
        setFavorites([])
        setLoading(false)
        loadingRef.current = false
        return
      }

      const response = await fetch('/api/favorites', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          setFavorites([])
          return
        }
        throw new Error(`HTTP ${response.status}: Failed to load favorites`)
      }

      const favoritesList = await response.json()

      // Ensure we have an array and convert to symbols
      const favoriteSymbols = Array.isArray(favoritesList)
        ? favoritesList.map(fav => {
            if (typeof fav === 'string') return fav.toLowerCase()
            if (fav && fav.symbol) return fav.symbol.toLowerCase()
            return null
          }).filter(Boolean)
        : []
      setFavorites(favoriteSymbols)
    } catch (err) {
      console.error('Erreur chargement favoris:', err)
      setError(err.message || 'Failed to load favorites')
      setFavorites([]) // Fallback to empty array
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [authenticated, user])

  useEffect(() => {
    // CRITICAL FIX: Only load if both authenticated AND user exists
    if (authenticated && user) {
      loadUserFavorites()
    } else {
      // Clear favorites and stop loading when not authenticated
      setFavorites([])
      setLoading(false)
      setError(null)
    }
  }, [authenticated, user, loadUserFavorites])

  const addFavorite = useCallback(async (symbol, name) => {
    if (!authenticated) {
      return {
        success: false,
        message: 'Vous devez être connecté pour ajouter des favoris'
      }
    }

    try {
      const authToken = localStorage.getItem('auth-token')
      const response = await fetch('/api/favorites', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          symbol: symbol.toLowerCase(),
          name: name
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'ajout')
      }

      // Actualiser les favoris
      await loadUserFavorites()

      return {
        success: true,
        message: `${symbol.toUpperCase()} ajouté aux favoris`
      }
    } catch (error) {
      console.error('Erreur ajout favori:', error)
      setError(error.message)
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'ajout aux favoris'
      }
    }
  }, [authenticated, loadUserFavorites])

  const removeFavorite = useCallback(async (symbol) => {
    if (!authenticated) {
      return {
        success: false,
        message: 'Vous devez être connecté pour supprimer des favoris'
      }
    }

    try {
      const authToken = localStorage.getItem('auth-token')
      const response = await fetch(`/api/favorites?symbol=${encodeURIComponent(symbol.toLowerCase())}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }

      // Actualiser les favoris
      await loadUserFavorites()

      return {
        success: true,
        message: `${symbol.toUpperCase()} retiré des favoris`
      }
    } catch (error) {
      console.error('Erreur suppression favori:', error)
      setError(error.message)
      return {
        success: false,
        message: error.message || 'Erreur lors de la suppression'
      }
    }
  }, [authenticated, loadUserFavorites])

  const isFavorite = useCallback((symbol) => {
    return favorites.includes(symbol.toLowerCase())
  }, [favorites])

  const refreshFavorites = useCallback(async () => {
    if (authenticated) {
      await loadUserFavorites()
    }
  }, [authenticated, loadUserFavorites])

  const value = useMemo(() => ({
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    refreshFavorites
  }), [favorites, loading, error, addFavorite, removeFavorite, isFavorite, refreshFavorites])

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}