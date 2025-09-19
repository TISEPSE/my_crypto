import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

// Performance monitoring
const performanceMonitor = {
  startTiming: (label) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${label}-start`)
    }
  },
  endTiming: (label) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${label}-end`)
      window.performance.measure(label, `${label}-start`, `${label}-end`)
    }
  }
}

export function useCryptoData(currency = 'usd', currentPage = 1, sortBy = 'market_cap', sortOrder = 'desc', favorites = [], searchQuery = '') {
  const [cryptos, setCryptos] = useState([])
  const [favoriteCryptos, setFavoriteCryptos] = useState([])
  const [allCryptosData, setAllCryptosData] = useState([]) // Store all data for favorites filtering
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastFetch, setLastFetch] = useState(null)
  const [cacheStatus, setCacheStatus] = useState('fresh')
  const fetchingRef = useRef(false)
  const abortControllerRef = useRef(null)

  // Configuration
  const itemsPerPage = 50
  const maxCryptos = 250
  const isPaginationEnabled = true

  const fetchCryptoData = useCallback(async (isRetry = false) => {
    // Avoid concurrent requests
    if (fetchingRef.current) return
    fetchingRef.current = true

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    performanceMonitor.startTiming('crypto-fetch')

    if (isRetry) {
      setIsRetrying(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      // Use optimized internal API route instead of direct CoinGecko calls
      const queryParams = new URLSearchParams({
        vs_currency: currency
      })

      const response = await fetch(
        `/api/crypto?${queryParams}`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': 'public, max-age=60'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const allCryptoData = await response.json()

      // Handle error response
      if (allCryptoData.error) {
        throw new Error(allCryptoData.error)
      }

      performanceMonitor.endTiming('crypto-fetch')

      // Client-side filtering for search
      let filteredData = searchQuery
        ? allCryptoData.filter(crypto =>
            crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : allCryptoData

      // Client-side sorting (more responsive than server-side for UI changes)
      filteredData = [...filteredData].sort((a, b) => {
        let aValue = a[sortBy]
        let bValue = b[sortBy]

        if (sortBy === "name") {
          aValue = aValue?.toLowerCase() || ''
          bValue = bValue?.toLowerCase() || ''
        }

        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })

      // Client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedData = filteredData.slice(startIndex, endIndex)

      setCryptos(paginatedData)
      setAllCryptosData(filteredData) // Store all data for favorites filtering
      setLastFetch(Date.now())

      // Check cache status from response headers
      const cacheHeader = response.headers.get('X-Cache')
      setCacheStatus(cacheHeader === 'HIT' ? 'cached' : 'fresh')

      setRetryCount(0)
    } catch (err) {
      performanceMonitor.endTiming('crypto-fetch')

      // Don't set error if request was aborted (component unmounted or new request)
      if (err.name !== 'AbortError') {
        setError(err.message)
        setRetryCount(prev => prev + 1)
      }
    } finally {
      setLoading(false)
      setIsRetrying(false)
      setIsRefreshing(false)
      fetchingRef.current = false
    }
  }, [currency, currentPage, sortBy, sortOrder, searchQuery])

  // Mémoiser les favoris pour éviter les recalculs
  const favoriteCryptosData = useMemo(() => {
    if (!favorites.length) {
      return []
    }

    // Use all cryptos data instead of just current page for favorites
    const dataToFilter = allCryptosData.length > 0 ? allCryptosData : cryptos

    return dataToFilter.filter(crypto =>
      favorites.includes(crypto.symbol.toLowerCase())
    )
  }, [favorites, allCryptosData, cryptos])
  
  // Mettre à jour l'état uniquement quand les données changent
  useEffect(() => {
    setFavoriteCryptos(favoriteCryptosData)
  }, [favoriteCryptosData])

  const refetch = useCallback((isRetry = false) => {
    fetchCryptoData(isRetry)
  }, [fetchCryptoData])

  // Load data on mount and when parameters change
  useEffect(() => {
    fetchCryptoData()

    // Cleanup function to abort requests on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchCryptoData])

  // Ancien useEffect pour fetchFavorites supprimé car remplacé par useMemo

  return {
    cryptos,
    favoriteCryptos,
    loading,
    error,
    retryCount,
    isRetrying,
    isRefreshing,
    refetch,
    isPaginationEnabled,
    itemsPerPage,
    maxCryptos,
    lastFetch,
    cacheStatus,
    // Additional performance data
    performanceStats: {
      lastFetchTime: lastFetch,
      cacheStatus,
      retryCount
    }
  }
}