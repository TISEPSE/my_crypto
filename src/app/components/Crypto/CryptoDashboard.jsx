"use client"
import React, {useState, useEffect, useRef, useCallback, useMemo} from "react"
import {useCryptoData} from "../../hooks/useCryptoData"
import {useCryptoPreferences} from "../../hooks/useCryptoPreferences"
import {useCryptoContext} from "../../context/CryptoContext"
import { useCryptoPerformance } from "../../context/CryptoPerformanceContext"
import { useCryptoFallback } from "../../hooks/useCryptoFallback"
import CryptoCard from "../../components/Crypto/CryptoCard"
import CryptoToolbar from "./CryptoToolbar"
import CryptoPagination from "./CryptoPagination"
import CryptoInfoModal from "./CryptoInfoModal"
import {
  CryptoErrorState,
  CryptoLoadingState,
  CryptoRetryNotification,
} from "../Crypto/CryptoState"
import { useFavoritesContext } from "../../context/FavoritesContext"
import { useAuth } from "../../context/AuthContext"

const CryptoDashboard = ({isNavOpen, setIsNavOpen}) => {
  const {setCryptoPaginationData} = useCryptoContext()
  const {
    fetchCryptoDataOptimized,
    performanceData,
    trackAPICall
  } = useCryptoPerformance()
  const {
    handleError,
    isUsingFallback,
    cacheFallbackData,
    getPerformanceInsights
  } = useCryptoFallback()

  const [currentPage, setCurrentPage] = useState(1)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [showCards, setShowCards] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [displayedCryptos, setDisplayedCryptos] = useState([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedCrypto, setSelectedCrypto] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [performanceInsights, setPerformanceInsights] = useState([])
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const observer = useRef()

  // Récupération des préférences
  const {
    hydrated,
    currency,
    setCurrency,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  } = useCryptoPreferences()

  // Hook pour les favoris
  const { favorites, isFavorite, refreshFavorites } = useFavoritesContext()
  
  // Hook pour la session utilisateur
  const { user, authenticated, loading: authLoading } = useAuth()

  // Enhanced data fetching with optimizations
  const {
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
    performanceStats
  } = useCryptoData(currency, currentPage, sortBy, sortOrder, favorites, searchQuery)

  // Cache successful responses for fallback
  useEffect(() => {
    if (cryptos && cryptos.length > 0 && !error) {
      cacheFallbackData(cryptos)
    }
  }, [cryptos, error, cacheFallbackData])

  // Update performance insights (throttled to prevent loops)
  useEffect(() => {
    const timer = setTimeout(() => {
      const insights = getPerformanceInsights()
      setPerformanceInsights(insights)
    }, 1000) // Throttle updates

    return () => clearTimeout(timer)
  }, [isUsingFallback])


  // Tri des cryptos (memoized to prevent infinite loops)
  const sortCryptos = useCallback((cryptosList) => {
    return [...cryptosList].sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (sortBy === "name") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [sortBy, sortOrder])

  // Enhanced filtering logic with 24h period support
  const filteredCryptos = useMemo(() => {
    if (filterType === 'favorites') {
      const sortedFavorites = sortCryptos(favoriteCryptos)
      return sortedFavorites
    } else {
      return sortCryptos(cryptos)
    }
  }, [cryptos, favoriteCryptos, filterType, sortBy, sortOrder])

  // Auto-refresh crypto data on dashboard load
  useEffect(() => {
    // Trigger immediate refresh when dashboard first loads and is hydrated
    if (hydrated) {
      console.log('🔄 Auto-refreshing crypto data on dashboard load')
      refetch()
    }
  }, [hydrated, refetch]) // Trigger when hydrated becomes true

  // Gestion du changement de page avec scroll automatique
  const handlePageChange = newPage => {
    setCurrentPage(newPage)
    window.scrollTo({top: 0, behavior: "smooth"})
  }

  // Gestion de la pagination
  const handlePrevious = useCallback(() => {
    handlePageChange(Math.max(1, currentPage - 1))
  }, [currentPage])

  const handleNext = useCallback(() => {
    handlePageChange(currentPage + 1)
  }, [currentPage])

  // Calcul de pagination basé sur les 250 cryptos max (ou résultats de recherche)
  const maxPages = filterType === 'favorites' ? 1 : Math.ceil(maxCryptos / itemsPerPage)
  const totalPages = maxPages
  
  // Désactiver "Suivant" si on dépasse la limite ou pas assez de cryptos
  const isNextDisabled = filterType === 'favorites' || 
                        currentPage >= maxPages ||
                        cryptos.length < itemsPerPage

  // Reset de la page courante uniquement quand filterType ou recherche change (sans scroll)
  // Le tri ne doit PAS remettre à la page 1 pour garder la position de l'utilisateur
  useEffect(() => {
    setCurrentPage(1)
    // Ne pas scroller automatiquement pour éviter les remontées en haut
  }, [filterType, searchQuery])

  // Validation de la page courante après changement de tri pour éviter les pages inexistantes
  useEffect(() => {
    if (filterType !== 'favorites' && currentPage > maxPages && maxPages > 0) {
      setCurrentPage(maxPages)
    }
  }, [currentPage, maxPages, filterType])

  // Détection d'interaction pour accélérer les animations
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true)
    }

    window.addEventListener('keydown', handleInteraction)

    return () => {
      window.removeEventListener('keydown', handleInteraction)
    }
  }, [])

  // Mise à jour du context avec les données de pagination
  useEffect(() => {
    if (isPaginationEnabled) {
      setCryptoPaginationData({
        isPaginationEnabled: true,
        currentPage,
        totalPages,
        isNextDisabled,
        handlePrevious,
        handleNext,
      })
    } else {
      setCryptoPaginationData({isPaginationEnabled: false})
    }
  }, [
    isPaginationEnabled,
    currentPage,
    totalPages,
    isNextDisabled,
    setCryptoPaginationData,
  ])

  // Gestion des clics sur les cartes
  const handleAddCrypto = coin => {
    // Logique d'ajout ici
  }

  const handleInfoCrypto = coin => {
    setSelectedCrypto(coin)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCrypto(null)
  }

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Gestion du scroll infini mobile
  const loadMoreCryptos = useCallback(() => {
    if (loadingMore || !isMobile) return
    
    setLoadingMore(true)
    const nextBatch = 20
    const currentLength = displayedCryptos.length
    const nextCryptos = filteredCryptos.slice(0, currentLength + nextBatch)
    
    setTimeout(() => {
      setDisplayedCryptos(nextCryptos)
      setLoadingMore(false)
    }, 500)
  }, [filteredCryptos, displayedCryptos, loadingMore, isMobile])

  // Observer pour le scroll infini
  const lastCryptoRef = useCallback((node) => {
    if (loadingMore || !isMobile) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && displayedCryptos.length < filteredCryptos.length) {
        loadMoreCryptos()
      }
    })
    if (node) observer.current.observe(node)
  }, [loadingMore, displayedCryptos.length, filteredCryptos.length, loadMoreCryptos, isMobile])

  // Mise à jour des cryptos affichées
  useEffect(() => {
    if (isMobile && filterType !== 'favorites') {
      setDisplayedCryptos(filteredCryptos.slice(0, 20))
    } else {
      // Desktop ou favoris, afficher tout
      setDisplayedCryptos(filteredCryptos)
    }
  }, [filteredCryptos, isMobile, filterType])

  // Effet pour déclencher l'animation des cartes (seulement pour les changements de page)
  useEffect(() => {
    if (displayedCryptos.length > 0 && !loading && !isRefreshing) {
      setShowCards(false)
      const timer = setTimeout(() => setShowCards(true), 50)
      return () => clearTimeout(timer)
    }
  }, [displayedCryptos.length, loading, isRefreshing, filterType, currentPage]) // Animation sur changement de page/filtre

  // Attendre l'hydratation
  if (!hydrated) return null

  // États d'erreur et de chargement
  if (error && !isRetrying && cryptos.length === 0) {
    return (
      <CryptoErrorState
        error={error}
        retryCount={retryCount}
        onRetry={() => refetch()}
      />
    )
  }

  if (isRetrying && cryptos.length === 0) {
    return <CryptoLoadingState retryCount={retryCount} />
  }

  if (loading && cryptos.length === 0 && !authLoading) {
    return <CryptoLoadingState retryCount={retryCount} />
  }

  // If authenticated but still loading auth, show a different loading state
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#212332] flex items-center justify-center z-50 min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500/30 border-t-orange-500"></div>
          <p className="text-gray-400">Loading user session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-[#FeFeFe] overflow-x-hidden p-6">
      {/* Enhanced toolbar with time period controls */}
      <CryptoToolbar
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        currency={currency}
        setCurrency={setCurrency}
        loading={loading}
        isRetrying={isRetrying}
        retryCount={retryCount}
        filterType={filterType}
        setFilterType={setFilterType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        performanceData={performanceData}
        isUsingFallback={isUsingFallback}
      />

      {/* Contenu principal */}
      <div className="max-w-9xl mx-auto pt-6 pb-6">


        {/* Notification de retry */}
        {isRetrying && cryptos.length > 0 && (
          <CryptoRetryNotification
            retryCount={retryCount}
            isAutoRetry={false}
          />
        )}


        {/* Message pour utilisateurs sans favoris */}
        {filterType === 'favorites' && filteredCryptos.length === 0 && !loading && authenticated && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="bg-gradient-to-r from-[#2a2d3e] to-[#252837] border border-gray-600/20 rounded-2xl p-8 max-w-md mx-auto text-center shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">⭐</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {favorites.length === 0 ? "Aucun favori ajouté" : "Favoris introuvables"}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {favorites.length === 0 
                  ? "Commencez à ajouter des cryptomonnaies à vos favoris en cliquant sur l'étoile des cartes crypto."
                  : "Vos cryptomonnaies favorites ne sont pas disponibles actuellement. Essayez de rafraîchir la page."
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setFilterType('all')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90"
                >
                  Voir toutes les cryptos
                </button>
                {favorites.length > 0 && (
                  <button
                    onClick={() => refetch()}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90"
                  >
                    Actualiser
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Performance insights banner */}
        {isUsingFallback && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">⚠️</span>
              <span className="text-amber-400 text-sm font-medium">
                Using cached data due to API issues. Data may not be current.
              </span>
            </div>
          </div>
        )}

        {performanceInsights.length > 0 && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="text-blue-400 text-sm">
              <strong>Performance Insights:</strong>
              <ul className="mt-1 space-y-1">
                {performanceInsights.map((insight, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className={insight.priority === 'high' ? 'text-red-400' : insight.priority === 'medium' ? 'text-yellow-400' : 'text-blue-400'}>•</span>
                    {insight.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Enhanced crypto grid with 24h data support */}
        {filteredCryptos.length > 0 && (
          <div className="crypto-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-5">
            {showCards && filteredCryptos.map((coin, index) => {
              const isLast = index === filteredCryptos.length - 1
              const shouldAddRef = isLast && isMobile && filterType !== 'favorites'
              return (
                <CryptoCard
                  key={coin.id}
                  coin={coin}
                  currency={currency}
                  onAddClick={handleAddCrypto}
                  onInfoClick={handleInfoCrypto}
                  index={index}
                  hasInteracted={hasInteracted}
                  ref={shouldAddRef ? lastCryptoRef : null}
                />
              )
            })}
          </div>
        )}

        {/* No data message when no cryptos are available */}
        {!loading && !isRetrying && filteredCryptos.length === 0 && filterType !== 'favorites' && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="bg-gradient-to-r from-[#2a2d3e] to-[#252837] border border-gray-600/20 rounded-2xl p-8 max-w-md mx-auto text-center shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                No Crypto Data Available
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Unable to load cryptocurrency data. Please check your connection and try refreshing the page.
              </p>
              <button
                onClick={() => refetch()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-90"
              >
                Refresh Data
              </button>
            </div>
          </div>
        )}



        {/* Indicateur de chargement mobile (seulement si pas en mode "tout") */}
        {isMobile && loadingMore && filterType !== 'favorites' && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-400">Chargement...</span>
          </div>
        )}

        {/* Message fin de liste mobile (seulement si pas en mode "tout") */}
        {isMobile && filterType !== 'favorites' && displayedCryptos.length === filteredCryptos.length && displayedCryptos.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">Vous avez vu toutes les cryptomonnaies disponibles</p>
          </div>
        )}

        {/* Pagination - Affichée seulement sur desktop et pas pour les favoris */}
        {isPaginationEnabled && cryptos.length > 0 && filterType !== 'favorites' && (
          <div className="hidden lg:block">
            <CryptoPagination
              currentPage={currentPage}
              onPageChange={handlePageChange}
              cryptosLength={filteredCryptos.length}
              itemsPerPage={itemsPerPage}
              totalPages={totalPages}
              hasNextPage={!isNextDisabled}
            />
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile Filters */}
      {isMobile && (
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center z-40 hover:shadow-purple-500/50 transition-all duration-300 active:scale-95"
          style={{ touchAction: 'manipulation' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
        </button>
      )}

      {/* Mobile Filter Modal */}
      {isFilterModalOpen && isMobile && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsFilterModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full bg-gradient-to-br from-[#212332] via-[#1a1d29] to-[#151821] rounded-t-3xl max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-600/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Filtres & Options</h3>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Filter Type */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-300">Type d'affichage</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 border transition-all duration-300 ${
                      filterType === 'all'
                        ? 'bg-gradient-to-br from-blue-500/25 to-indigo-600/25 border-blue-500/60 text-blue-300'
                        : 'bg-gradient-to-br from-[#2a2d3e]/90 to-[#252837]/90 border-gray-600/40 text-gray-300'
                    }`}
                  >
                    <span className="text-lg">🌐</span>
                    <span className="text-sm font-medium">Toutes</span>
                  </button>
                  <button
                    onClick={() => setFilterType('favorites')}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 border transition-all duration-300 ${
                      filterType === 'favorites'
                        ? 'bg-gradient-to-br from-amber-500/25 to-orange-600/25 border-amber-500/60 text-amber-300'
                        : 'bg-gradient-to-br from-[#2a2d3e]/90 to-[#252837]/90 border-gray-600/40 text-gray-300'
                    }`}
                  >
                    <span className="text-lg">⭐</span>
                    <span className="text-sm font-medium">Favoris</span>
                  </button>
                </div>
              </div>

              {/* Currency */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-300">Devise</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCurrency('eur')}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 border transition-all duration-300 ${
                      currency === 'eur'
                        ? 'bg-gradient-to-br from-emerald-500/25 to-teal-600/25 border-emerald-500/60 text-emerald-300'
                        : 'bg-gradient-to-br from-[#2a2d3e]/90 to-[#252837]/90 border-gray-600/40 text-gray-300'
                    }`}
                  >
                    <span className="text-lg">🇪🇺</span>
                    <span className="text-sm font-medium">EUR</span>
                  </button>
                  <button
                    onClick={() => setCurrency('usd')}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 border transition-all duration-300 ${
                      currency === 'usd'
                        ? 'bg-gradient-to-br from-emerald-500/25 to-teal-600/25 border-emerald-500/60 text-emerald-300'
                        : 'bg-gradient-to-br from-[#2a2d3e]/90 to-[#252837]/90 border-gray-600/40 text-gray-300'
                    }`}
                  >
                    <span className="text-lg">🇺🇸</span>
                    <span className="text-sm font-medium">USD</span>
                  </button>
                </div>
              </div>

              {/* Sort Options */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-300">Trier par</label>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSortBy('current_price')
                      setSortOrder(sortBy === 'current_price' && sortOrder === 'desc' ? 'asc' : 'desc')
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border transition-all duration-300 ${
                      sortBy === 'current_price'
                        ? 'bg-gradient-to-br from-green-500/25 to-emerald-600/25 border-green-500/60 text-green-300'
                        : 'bg-gradient-to-br from-[#2a2d3e]/90 to-[#252837]/90 border-gray-600/40 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">💰</span>
                      <span className="text-sm font-medium">Prix</span>
                    </div>
                    {sortBy === 'current_price' && (
                      <span className="text-lg">{sortOrder === 'desc' ? '⬇️' : '⬆️'}</span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSortBy('market_cap')
                      setSortOrder(sortBy === 'market_cap' && sortOrder === 'desc' ? 'asc' : 'desc')
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border transition-all duration-300 ${
                      sortBy === 'market_cap'
                        ? 'bg-gradient-to-br from-purple-500/25 to-pink-600/25 border-purple-500/60 text-purple-300'
                        : 'bg-gradient-to-br from-[#2a2d3e]/90 to-[#252837]/90 border-gray-600/40 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📊</span>
                      <span className="text-sm font-medium">Capitalisation</span>
                    </div>
                    {sortBy === 'market_cap' && (
                      <span className="text-lg">{sortOrder === 'desc' ? '⬇️' : '⬆️'}</span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSortBy('price_change_percentage_24h')
                      setSortOrder(sortBy === 'price_change_percentage_24h' && sortOrder === 'desc' ? 'asc' : 'desc')
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border transition-all duration-300 ${
                      sortBy === 'price_change_percentage_24h'
                        ? 'bg-gradient-to-br from-orange-500/25 to-red-600/25 border-orange-500/60 text-orange-300'
                        : 'bg-gradient-to-br from-[#2a2d3e]/90 to-[#252837]/90 border-gray-600/40 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📈</span>
                      <span className="text-sm font-medium">Variation 24h</span>
                    </div>
                    {sortBy === 'price_change_percentage_24h' && (
                      <span className="text-lg">{sortOrder === 'desc' ? '⬇️' : '⬆️'}</span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSortBy('name')
                      setSortOrder(sortBy === 'name' && sortOrder === 'desc' ? 'asc' : 'desc')
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border transition-all duration-300 ${
                      sortBy === 'name'
                        ? 'bg-gradient-to-br from-blue-500/25 to-indigo-600/25 border-blue-500/60 text-blue-300'
                        : 'bg-gradient-to-br from-[#2a2d3e]/90 to-[#252837]/90 border-gray-600/40 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🔤</span>
                      <span className="text-sm font-medium">Nom</span>
                    </div>
                    {sortBy === 'name' && (
                      <span className="text-lg">{sortOrder === 'desc' ? '⬇️' : '⬆️'}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30"
              >
                Appliquer les filtres
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'informations détaillées */}
      <CryptoInfoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        coin={selectedCrypto}
        currency={currency}
      />
    </div>
  )
}

export default CryptoDashboard
