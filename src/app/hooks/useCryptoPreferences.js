import { useState, useEffect, useCallback } from 'react'

export function useCryptoPreferences() {
  const [hydrated, setHydrated] = useState(false)
  const [currency, setCurrency] = useState('usd')
  const [sortBy, setSortBy] = useState('market_cap')
  const [sortOrder, setSortOrder] = useState('desc')
  const [category, setCategory] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Charger les préférences depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cryptoPreferences')
      if (saved) {
        const parsedPreferences = JSON.parse(saved)
        setCurrency(parsedPreferences.currency || 'usd')
        setSortBy(parsedPreferences.sortBy || 'market_cap')
        setSortOrder(parsedPreferences.sortOrder || 'desc')
        setCategory(parsedPreferences.category || '')
        setShowFavoritesOnly(parsedPreferences.showFavoritesOnly || false)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences crypto:', error)
    } finally {
      setHydrated(true)
    }
  }, [])

  // Sauvegarder les préférences dans localStorage
  const savePreferences = useCallback(() => {
    try {
      const preferences = {
        currency,
        sortBy,
        sortOrder,
        category,
        showFavoritesOnly
      }
      localStorage.setItem('cryptoPreferences', JSON.stringify(preferences))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences crypto:', error)
    }
  }, [currency, sortBy, sortOrder, category, showFavoritesOnly])

  // Sauvegarder à chaque changement
  useEffect(() => {
    if (hydrated) {
      savePreferences()
    }
  }, [hydrated, savePreferences])

  const updateCurrency = useCallback((newCurrency) => {
    setCurrency(newCurrency)
  }, [])

  const updateSorting = useCallback((newSortBy, newSortOrder = 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }, [])

  const updateCategory = useCallback((newCategory) => {
    setCategory(newCategory)
  }, [])

  const toggleFavoritesOnly = useCallback(() => {
    setShowFavoritesOnly(prev => !prev)
  }, [])

  const resetPreferences = useCallback(() => {
    setCurrency('usd')
    setSortBy('market_cap')
    setSortOrder('desc')
    setCategory('')
    setShowFavoritesOnly(false)
  }, [])

  return {
    hydrated,
    currency,
    setCurrency: updateCurrency,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    category,
    setCategory: updateCategory,
    showFavoritesOnly,
    toggleFavoritesOnly,
    resetPreferences
  }
}