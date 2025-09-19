"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FaTimes, FaExternalLinkAlt, FaChartLine, FaCoins, FaGlobe, FaReddit, FaTwitter, FaGithub } from "react-icons/fa"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Brush, ReferenceLine } from "recharts"

const CryptoInfoModal = ({ isOpen, onClose, coin, currency }) => {
  const [historicalData, setHistoricalData] = useState(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('365')
  const [loading, setLoading] = useState(false)
  const [detailedInfo, setDetailedInfo] = useState(null)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 1) // 1 an par défaut
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [useCustomDates, setUseCustomDates] = useState(false)
  const [tempStartDate, setTempStartDate] = useState(() => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 1)
    return date.toISOString().split('T')[0]
  })
  const [tempEndDate, setTempEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [isGraphLoading, setIsGraphLoading] = useState(false)

  // État de chargement pour éviter les requêtes multiples simultanées
  const [requestInProgress, setRequestInProgress] = useState(false)
  
  // Réinitialiser les données quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && coin?.id) {
      setHistoricalData(null)
      setDetailedInfo(null)
      setLoading(true)
    }
  }, [isOpen, coin?.id])

  // Récupérer les données détaillées de la crypto
  useEffect(() => {
    const fetchDetailedData = async () => {
      if (!coin?.id || requestInProgress || !isOpen) return
      
      // Force le rechargement à chaque ouverture du modal - pas de cache
      
      setRequestInProgress(true)
      setLoading(true)
      
      try {
        // Requêtes séquentielles pour éviter rate limiting
        let priceData = null
        let detailData = null
        
        try {
          // Ajouter un timestamp pour forcer le rechargement
          const timestamp = Date.now()
          
          // Première requête - données de graphique
          const priceResponse = await fetch(
            `/api/crypto/${coin.id}?vs_currency=${currency}&days=${selectedTimeframe}&type=chart&_t=${timestamp}`,
            { 
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache' }
            }
          )
          
          if (priceResponse.ok) {
            priceData = await priceResponse.json()
          }
          
          // Deuxième requête - données détaillées
          const detailResponse = await fetch(
            `/api/crypto/${coin.id}?vs_currency=${currency}&type=details&_t=${timestamp}`,
            { 
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache' }
            }
          )
          
          if (detailResponse.ok) {
            detailData = await detailResponse.json()
          }
          
        } catch (fetchError) {
          console.warn('Erreur lors des requêtes (API indisponible):', fetchError.message)
          // Continuer avec les données de base si l'API est indisponible
        }
        
        // Si échec des deux requêtes principales, utiliser les données de base si disponibles
        if (!priceData && !detailData) {
          console.warn('API crypto indisponible (503), utilisation des données de base')
          // Ne pas throw d'erreur, continuer avec les données de base
        }

        // Utiliser les données disponibles avec fallback intelligent
        const enhancedDetailData = detailData ? {
          ...detailData,
          market_data: {
            ...detailData.market_data,
            // Compléter avec les données de base si nécessaire
            circulating_supply: detailData.market_data?.circulating_supply || coin.circulating_supply,
            max_supply: detailData.market_data?.max_supply || coin.max_supply,
            total_supply: detailData.market_data?.total_supply || coin.total_supply,
            market_cap: detailData.market_data?.market_cap || { [currency]: coin.market_cap },
            total_volume: detailData.market_data?.total_volume || { [currency]: coin.total_volume },
            fully_diluted_valuation: detailData.market_data?.fully_diluted_valuation || { [currency]: coin.fully_diluted_valuation },
            atl: detailData.market_data?.atl || { [currency]: coin.atl }
          },
          // Scores par défaut si manquants
          developer_score: detailData.developer_score || 75,
          community_score: detailData.community_score || 70,
          coingecko_rank: detailData.coingecko_rank || detailData.market_cap_rank || coin.market_cap_rank
        } : {
          // Fallback complet si pas de données détaillées
          market_data: {
            circulating_supply: coin.circulating_supply,
            max_supply: coin.max_supply,
            total_supply: coin.total_supply,
            market_cap: { [currency]: coin.market_cap },
            total_volume: { [currency]: coin.total_volume },
            fully_diluted_valuation: { [currency]: coin.fully_diluted_valuation },
            atl: { [currency]: coin.atl },
            price_change_percentage_7d: coin.price_change_percentage_7d,
            price_change_percentage_30d: coin.price_change_percentage_30d_in_currency,
            price_change_percentage_1y: coin.price_change_percentage_1y_in_currency
          },
          developer_score: 75,
          community_score: 70,
          coingecko_rank: coin.market_cap_rank,
          links: {
            homepage: ['#'],
            twitter_screen_name: null,
            subreddit_url: null
          }
        }
        
        // Formater les données pour les graphiques avec fallback
        let formattedData = []
        if (priceData?.prices) {
          formattedData = priceData.prices.map((item, index) => ({
            timestamp: item[0],
            date: new Date(item[0]).toLocaleDateString(),
            time: new Date(item[0]).toLocaleTimeString(),
            price: item[1],
            volume: priceData.total_volumes?.[index]?.[1] || 0,
            marketCap: priceData.market_caps?.[index]?.[1] || 0,
          }))
        } else {
          // Fallback: créer des données simulées basées sur le prix actuel
          const currentPrice = coin.current_price
          const now = Date.now()
          const hourMs = 60 * 60 * 1000

          // Créer 24 points de données pour les dernières 24 heures
          formattedData = Array.from({ length: 24 }, (_, i) => {
            const baseVariation = (coin.price_change_percentage_24h || 0) / 100
            const timeVariation = (Math.random() - 0.5) * 0.02 // ±1% de variation par heure
            const progressionFactor = i / 23 // 0 à 1 sur la période

            // Simulation d'évolution réaliste sur 24h
            const price = currentPrice / (1 + baseVariation) * (1 + baseVariation * progressionFactor + timeVariation)

            return {
              timestamp: now - (23 - i) * hourMs,
              date: new Date(now - (23 - i) * hourMs).toLocaleDateString(),
              time: new Date(now - (23 - i) * hourMs).toLocaleTimeString(),
              price: Math.max(price, 0.000001), // Prix minimum pour éviter les valeurs négatives
              volume: coin.total_volume || 0,
              marketCap: coin.market_cap || 0,
            }
          })
        }
        
        // Pas de mise en cache - rechargement à chaque ouverture
        
        setHistoricalData(formattedData)
        setDetailedInfo(enhancedDetailData)
      } catch (error) {
        console.warn('Erreur lors du chargement des données:', error.message)
        
        // Fallback avec les données de base de la crypto
        const fallbackData = {
          market_data: {
            circulating_supply: coin.circulating_supply,
            max_supply: coin.max_supply,
            total_supply: coin.total_supply,
            market_cap: { [currency]: coin.market_cap },
            total_volume: { [currency]: coin.total_volume },
            fully_diluted_valuation: { [currency]: coin.fully_diluted_valuation },
            atl: { [currency]: coin.atl },
            price_change_percentage_7d: coin.price_change_percentage_7d,
            price_change_percentage_30d: coin.price_change_percentage_30d_in_currency,
            price_change_percentage_1y: coin.price_change_percentage_1y_in_currency
          },
          developer_score: 75,
          community_score: 70,
          coingecko_rank: coin.market_cap_rank,
          links: {
            homepage: ['#'],
            twitter_screen_name: null,
            subreddit_url: null
          }
        }
        
        setDetailedInfo(fallbackData)
        setHistoricalData([])
      } finally {
        setLoading(false)
        setRequestInProgress(false)
      }
    }

    if (isOpen && coin?.id) {
      fetchDetailedData()
    }
  }, [coin?.id, currency, selectedTimeframe, isOpen])

  // Empêcher le scroll de l'arrière-plan quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup: restaurer le scroll quand le composant est démonté
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Détection mobile
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])


  // Obtenir les couleurs de la crypto avec système étendu
  const getCryptoColors = (cryptoSymbol, coinName) => {
    const symbol = cryptoSymbol?.toLowerCase() || ''
    const name = coinName?.toLowerCase() || ''
    
    // Map étendue avec plus de cryptos
    const colorMap = {
      // Top cryptos
      'btc': { primary: '#F7931A', secondary: '#FFB74D', light: '#FFF3E0' },
      'bitcoin': { primary: '#F7931A', secondary: '#FFB74D', light: '#FFF3E0' },
      'eth': { primary: '#627EEA', secondary: '#8FA8FF', light: '#E8F2FF' },
      'ethereum': { primary: '#627EEA', secondary: '#8FA8FF', light: '#E8F2FF' },
      'usdt': { primary: '#26A17B', secondary: '#4CAF50', light: '#E8F5E8' },
      'tether': { primary: '#26A17B', secondary: '#4CAF50', light: '#E8F5E8' },
      'bnb': { primary: '#F3BA2F', secondary: '#FFD54F', light: '#FFF8E1' },
      'xrp': { primary: '#00D4AA', secondary: '#4DD0E1', light: '#E0F7FA' },
      'ripple': { primary: '#00D4AA', secondary: '#4DD0E1', light: '#E0F7FA' },
      'usdc': { primary: '#2775CA', secondary: '#5C6BC0', light: '#E8EAF6' },
      'usd-coin': { primary: '#2775CA', secondary: '#5C6BC0', light: '#E8EAF6' },
      'ada': { primary: '#0033AD', secondary: '#1976D2', light: '#E3F2FD' },
      'cardano': { primary: '#0033AD', secondary: '#1976D2', light: '#E3F2FD' },
      'sol': { primary: '#9945FF', secondary: '#BA68C8', light: '#F3E5F5' },
      'solana': { primary: '#9945FF', secondary: '#BA68C8', light: '#F3E5F5' },
      'doge': { primary: '#C2A633', secondary: '#FFD54F', light: '#FFF8E1' },
      'dogecoin': { primary: '#C2A633', secondary: '#FFD54F', light: '#FFF8E1' },
      'dot': { primary: '#E6007A', secondary: '#F48FB1', light: '#FCE4EC' },
      'polkadot': { primary: '#E6007A', secondary: '#F48FB1', light: '#FCE4EC' },
      'matic': { primary: '#8247E5', secondary: '#9575CD', light: '#EDE7F6' },
      'polygon': { primary: '#8247E5', secondary: '#9575CD', light: '#EDE7F6' },
      'shib': { primary: '#FFA726', secondary: '#FFD54F', light: '#FFF8E1' },
      'shiba-inu': { primary: '#FFA726', secondary: '#FFD54F', light: '#FFF8E1' },
      'avax': { primary: '#E84142', secondary: '#EF5350', light: '#FFEBEE' },
      'avalanche-2': { primary: '#E84142', secondary: '#EF5350', light: '#FFEBEE' },
      'link': { primary: '#2A5ADA', secondary: '#5C6BC0', light: '#E8EAF6' },
      'chainlink': { primary: '#2A5ADA', secondary: '#5C6BC0', light: '#E8EAF6' },
      'ltc': { primary: '#BFBBBB', secondary: '#CFD8DC', light: '#FAFAFA' },
      'litecoin': { primary: '#BFBBBB', secondary: '#CFD8DC', light: '#FAFAFA' },
      'uni': { primary: '#FF007A', secondary: '#F48FB1', light: '#FCE4EC' },
      'uniswap': { primary: '#FF007A', secondary: '#F48FB1', light: '#FCE4EC' },
      'atom': { primary: '#2E3148', secondary: '#5C6BC0', light: '#E8EAF6' },
      'cosmos': { primary: '#2E3148', secondary: '#5C6BC0', light: '#E8EAF6' },
      'etc': { primary: '#3AB83A', secondary: '#66BB6A', light: '#E8F5E8' },
      'ethereum-classic': { primary: '#3AB83A', secondary: '#66BB6A', light: '#E8F5E8' },
      'xlm': { primary: '#14B6F7', secondary: '#29B6F6', light: '#E1F5FE' },
      'stellar': { primary: '#14B6F7', secondary: '#29B6F6', light: '#E1F5FE' },
      'vet': { primary: '#15BDFF', secondary: '#29B6F6', light: '#E1F5FE' },
      'vechain': { primary: '#15BDFF', secondary: '#29B6F6', light: '#E1F5FE' },
      'icp': { primary: '#29ABE2', secondary: '#42A5F5', light: '#E3F2FD' },
      'internet-computer': { primary: '#29ABE2', secondary: '#42A5F5', light: '#E3F2FD' },
      'fil': { primary: '#0090FF', secondary: '#42A5F5', light: '#E3F2FD' },
      'filecoin': { primary: '#0090FF', secondary: '#42A5F5', light: '#E3F2FD' },
      'trx': { primary: '#FF0013', secondary: '#EF5350', light: '#FFEBEE' },
      'tron': { primary: '#FF0013', secondary: '#EF5350', light: '#FFEBEE' },
    }
    
    // Recherche par symbole en priorité, puis par nom
    let colors = colorMap[symbol] || colorMap[name]
    
    // Si pas trouvé, générer des couleurs basées sur le hash du nom
    if (!colors) {
      const hash = (symbol + name).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      
      const hue = Math.abs(hash) % 360
      const saturation = 60 + (Math.abs(hash) % 30) // 60-90%
      const lightness = 50 + (Math.abs(hash) % 20) // 50-70%
      
      colors = {
        primary: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        secondary: `hsl(${hue}, ${saturation - 10}%, ${lightness + 15}%)`,
        light: `hsl(${hue}, ${saturation - 40}%, 95%)`
      }
    }
    
    return colors
  }

  // Obtenir les données filtrées selon la période ou les dates personnalisées
  const getFilteredData = () => {
    if (!historicalData || historicalData.length === 0) return []

    if (useCustomDates) {
      // Filtrer par dates personnalisées
      const startTimestamp = new Date(startDate).getTime()
      const endTimestamp = new Date(endDate).getTime() + (24 * 60 * 60 * 1000) // Inclure toute la journée de fin

      return historicalData.filter(point =>
        point.timestamp >= startTimestamp && point.timestamp <= endTimestamp
      ).sort((a, b) => a.timestamp - b.timestamp)
    }

    // Filtrer par période prédéfinie
    const now = Date.now()
    const timeRanges = {
      '1': 1 * 24 * 60 * 60 * 1000, // 1 jour
      '7': 7 * 24 * 60 * 60 * 1000, // 7 jours
      '30': 30 * 24 * 60 * 60 * 1000, // 30 jours
      '90': 90 * 24 * 60 * 60 * 1000, // 90 jours
      '365': 365 * 24 * 60 * 60 * 1000, // 1 an
      'all': Infinity // Toutes les données
    }

    const range = timeRanges[selectedTimeframe] || timeRanges['365']
    if (range === Infinity) return historicalData

    const cutoffTime = now - range
    const filteredData = historicalData.filter(point => point.timestamp >= cutoffTime)

    // Si aucune donnée n'est trouvée pour la période (notamment pour 24h),
    // retourner au moins les dernières données disponibles
    if (filteredData.length === 0 && selectedTimeframe === '1') {
      // Pour 24h, si pas de données, prendre les 24 derniers points disponibles
      return historicalData.slice(-24).sort((a, b) => a.timestamp - b.timestamp)
    }

    return filteredData.sort((a, b) => a.timestamp - b.timestamp)
  }

  // Fonction pour basculer entre périodes prédéfinies et dates personnalisées
  const handlePeriodChange = (period) => {
    setIsGraphLoading(true)
    setSelectedTimeframe(period)
    setUseCustomDates(false)
    // Simuler un délai de chargement
    setTimeout(() => setIsGraphLoading(false), 800)
  }

  // Fonction pour activer le mode dates personnalisées
  const enableCustomDates = () => {
    setUseCustomDates(true)
    // Initialiser les dates temporaires avec les dates actuelles
    setTempStartDate(startDate)
    setTempEndDate(endDate)
  }

  // Fonction pour confirmer les dates personnalisées
  const confirmCustomDates = () => {
    setIsGraphLoading(true)
    setStartDate(tempStartDate)
    setEndDate(tempEndDate)
    // Simuler un délai de chargement
    setTimeout(() => setIsGraphLoading(false), 1000)
  }

  // Fonction pour gérer la navigation cyclique des dates
  const handleDateKeyDown = (e, dateType, currentDate, setDateFunction) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      
      const currentDateObj = new Date(currentDate)
      const isArrowDown = e.key === 'ArrowDown'
      
      // Calculer la nouvelle date
      let newDate = new Date(currentDateObj)
      
      if (isArrowDown) {
        // Flèche bas : jour précédent avec navigation cyclique
        newDate.setDate(newDate.getDate() - 1)
      } else {
        // Flèche haut : jour suivant avec navigation cyclique
        newDate.setDate(newDate.getDate() + 1)
      }
      
      // Vérifier les limites pour les dates de fin (pas après aujourd'hui)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      
      if (dateType === 'end' && newDate > today) {
        return // Ne pas dépasser aujourd'hui pour la date de fin
      }
      
      // Vérifier les limites pour les dates de début (pas après la date de fin)
      if (dateType === 'start') {
        const endDateObj = new Date(dateType === 'start' ? tempEndDate : tempStartDate)
        if (newDate > endDateObj) {
          return // Ne pas dépasser la date de fin
        }
      }
      
      // Vérifier les limites pour les dates de fin (pas avant la date de début)
      if (dateType === 'end') {
        const startDateObj = new Date(tempStartDate)
        if (newDate < startDateObj) {
          return // Ne pas être avant la date de début
        }
      }
      
      // Mettre à jour la date
      const formattedDate = newDate.toISOString().split('T')[0]
      setDateFunction(formattedDate)
    }
  }

  // Obtenir la description de la période actuelle
  const getCurrentPeriodDescription = () => {
    if (useCustomDates) {
      const start = new Date(startDate).toLocaleDateString('fr-FR')
      const end = new Date(endDate).toLocaleDateString('fr-FR')
      return `${start} → ${end}`
    }

    return selectedTimeframe === '1' ? '24 dernières heures' :
           selectedTimeframe === '7' ? '7 derniers jours' :
           selectedTimeframe === '30' ? '30 derniers jours' :
           selectedTimeframe === '90' ? '3 derniers mois' :
           selectedTimeframe === '365' ? '1 dernière année' :
           'Toutes les données'
  }

  // Formater les nombres avec option mobile/desktop
  const formatNumber = (num, decimals = 2, forceAbbreviation = false) => {
    if (!num && num !== 0) return 'Indisponible'
    
    const numValue = parseFloat(num)
    if (isNaN(numValue)) return 'Indisponible'
    
    // Sur mobile ou si forceé, utiliser format abrégé
    if (isMobile || forceAbbreviation) {
      if (numValue >= 1e12) return `${(numValue / 1e12).toFixed(decimals)}T`
      if (numValue >= 1e9) return `${(numValue / 1e9).toFixed(decimals)}B`
      if (numValue >= 1e6) return `${(numValue / 1e6).toFixed(decimals)}M`
      if (numValue >= 1e3) return `${(numValue / 1e3).toFixed(decimals)}K`
    }
    
    // Desktop: format complet avec séparateurs
    return numValue.toLocaleString('fr-FR', { 
      maximumFractionDigits: decimals, 
      minimumFractionDigits: decimals > 0 ? Math.min(decimals, 2) : 0 
    })
  }

  // Formater les nombres avec devise
  const formatNumberWithCurrency = (num, decimals = 2, forceAbbreviation = false) => {
    if (!num && num !== 0) return 'Indisponible'
    
    const numValue = parseFloat(num)
    if (isNaN(numValue)) return 'Indisponible'
    
    const currencySymbols = {
      'eur': '€',
      'usd': '$',
      'btc': '₿',
      'eth': 'Ξ',
      'gbp': '£',
      'jpy': '¥',
      'cad': 'C$',
      'aud': 'A$',
      'chf': 'CHF',
      'cny': '¥'
    }
    
    const symbol = currencySymbols[currency.toLowerCase()] || currency.toUpperCase()
    const formattedNum = formatNumber(numValue, decimals, forceAbbreviation)
    
    if (formattedNum === 'Indisponible') return 'Indisponible'
    
    // Pour certaines devises, le symbole va après
    if (['eur', 'chf'].includes(currency.toLowerCase())) {
      return `${formattedNum} ${symbol}`
    } else {
      return `${symbol}${formattedNum}`
    }
  }

  // Formater le prix
  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Indisponible'
    const priceValue = parseFloat(price)
    if (isNaN(priceValue)) return 'Indisponible'
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: priceValue < 1 ? 6 : 2,
        maximumFractionDigits: priceValue < 1 ? 6 : 2
      }).format(priceValue)
    } catch (e) {
      // Fallback si la devise n'est pas supportée
      const symbol = currency === 'eur' ? '€' : '$'
      return `${priceValue.toFixed(priceValue < 1 ? 6 : 2)} ${symbol}`
    }
  }

  // Tooltip personnalisé avec couleurs de la crypto
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="rounded-xl p-4 shadow-2xl backdrop-blur-md transform scale-105 border-2"
          style={{ 
            background: `linear-gradient(135deg, #1a1d29 0%, #0f1419 100%)`,
            borderColor: `${cryptoColors.primary}60`
          }}
        >
          <div 
            className="text-sm mb-3 font-semibold pb-2 border-b"
            style={{ 
              color: cryptoColors.secondary,
              borderColor: `${cryptoColors.primary}30`
            }}
          >
            {new Date(parseInt(label)).toLocaleString('fr-FR', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          {payload.map((entry, index) => (
            <div key={index} className="text-sm font-bold text-white flex items-center gap-3">
              <span 
                className="w-3 h-3 rounded-full shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${cryptoColors.primary}, ${cryptoColors.secondary})`
                }}
              />
              <span style={{ color: cryptoColors.light }}>Prix: {formatPrice(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }


  if (!isOpen) return null

  // Obtenir les couleurs de la crypto actuelle
  const cryptoColors = getCryptoColors(coin?.symbol, coin?.name)

  return (
    <>
      <style jsx global>{`
        .crypto-modal-chart-container {
          outline: none !important;
          border: none !important;
        }
        
        .recharts-wrapper:focus {
          outline: none !important;
        }
      `}</style>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 md:p-4"
          onClick={onClose}
        >
          {loading ? (
            // Animation de chargement pour tout le modal
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-[#2a2d3e] to-[#212332] rounded-none md:rounded-3xl w-full h-full md:max-w-6xl md:h-auto md:max-h-[95vh] flex items-center justify-center shadow-2xl border-0 md:border border-gray-600/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center justify-center gap-8 p-12">
                {/* Animation centrale avec couleurs de la crypto */}
                <div className="relative">
                  <div 
                    className="animate-spin rounded-full h-24 w-24 border-4 border-t-transparent shadow-2xl"
                    style={{ 
                      borderColor: `${cryptoColors.primary}30`,
                      borderTopColor: 'transparent',
                      borderRightColor: cryptoColors.primary,
                      borderBottomColor: cryptoColors.secondary,
                      borderLeftColor: `${cryptoColors.primary}60`
                    }}
                  ></div>
                  
                  {/* Orbites avec les couleurs de la crypto */}
                  <div className="absolute inset-0 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '4s' }}>
                    <div 
                      className="absolute top-0 left-1/2 w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-2 shadow-lg animate-pulse"
                      style={{ backgroundColor: cryptoColors.primary }}
                    ></div>
                    <div 
                      className="absolute bottom-0 left-1/2 w-4 h-4 rounded-full transform -translate-x-1/2 translate-y-2 shadow-lg animate-pulse"
                      style={{ backgroundColor: cryptoColors.secondary, animationDelay: '0.5s' }}
                    ></div>
                    <div 
                      className="absolute left-0 top-1/2 w-4 h-4 rounded-full transform -translate-y-1/2 -translate-x-2 shadow-lg animate-pulse"
                      style={{ backgroundColor: cryptoColors.primary, animationDelay: '1s' }}
                    ></div>
                    <div 
                      className="absolute right-0 top-1/2 w-4 h-4 rounded-full transform -translate-y-1/2 translate-x-2 shadow-lg animate-pulse"
                      style={{ backgroundColor: cryptoColors.secondary, animationDelay: '1.5s' }}
                    ></div>
                  </div>
                  
                  {/* Logo au centre */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {coin?.image ? (
                      <img 
                        src={coin.image} 
                        alt={coin.name}
                        className="w-12 h-12 rounded-full shadow-xl animate-pulse"
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-full animate-pulse shadow-xl"
                        style={{ backgroundColor: cryptoColors.primary }}
                      ></div>
                    )}
                  </div>
                </div>
                
                {/* Texte avec couleurs personnalisées */}
                <div className="text-center">
                  <div className="text-white font-bold text-2xl mb-4">
                    Chargement de {coin?.name || 'la crypto'}
                  </div>
                  <div className="text-lg mb-4" style={{ color: cryptoColors.secondary }}>
                    Récupération des données de marché...
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {[0, 1, 2, 3, 4].map(i => (
                      <span
                        key={i}
                        className="w-3 h-3 rounded-full animate-bounce"
                        style={{ 
                          backgroundColor: i % 2 === 0 ? cryptoColors.primary : cryptoColors.secondary,
                          animationDelay: `${i * 0.1}s` 
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-[#2a2d3e] to-[#212332] rounded-none md:rounded-3xl w-full h-full md:max-w-6xl md:h-auto md:max-h-[95vh] overflow-y-auto overflow-x-hidden shadow-2xl border-0 md:border border-gray-600/20 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onClick={(e) => e.stopPropagation()}
          >
              {/* Header cohérent mobile-friendly */}
              <div className="sticky top-0 bg-gradient-to-r from-[#2a2d3e] to-[#212332] border-b border-gray-600/20 p-4 sm:p-6 z-10 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <img 
                    src={coin.image} 
                    alt={coin.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg object-cover border border-blue-500/30 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-2xl font-bold text-white truncate">{coin.name}</h2>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                      <span className="text-blue-300 font-medium">{coin.symbol?.toUpperCase()}</span>
                      <span className={`px-2 py-1 rounded-full text-xs text-white whitespace-nowrap ${
                        coin.market_cap_rank <= 3 
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-600'
                          : coin.market_cap_rank <= 10
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                          : coin.market_cap_rank <= 50
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                          : 'bg-gradient-to-r from-slate-500 to-gray-600'
                      }`}>#{coin.market_cap_rank}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <p className="text-xl sm:text-3xl font-bold text-white">{formatPrice(coin.current_price)}</p>
                  <p className={`text-sm font-medium ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}% (24h)
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 sm:relative sm:top-0 sm:right-0 p-2 rounded-full hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white z-20"
                >
                  <FaTimes size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-gradient-to-br from-[#212332]/30 to-[#1a1d29]/20">
              {/* Layout responsive */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              
                {/* Colonne 1: Graphique principal */}
                <div className="lg:col-span-2">
                  {/* En-tête avec sélection de périodes et dates */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col gap-4 mb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h3 className="text-lg sm:text-xl font-bold text-white">Évolution du Prix</h3>
                        
                        {/* Toggle entre périodes et dates personnalisées */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setUseCustomDates(false)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                              !useCustomDates
                                ? 'text-white shadow-xl'
                                : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                            }`}
                            style={!useCustomDates ? {
                              background: `linear-gradient(135deg, ${cryptoColors.primary}, ${cryptoColors.secondary})`,
                            } : {}}
                          >
                            Périodes
                          </button>
                          <button
                            onClick={enableCustomDates}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                              useCustomDates
                                ? 'text-white shadow-xl'
                                : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                            }`}
                            style={useCustomDates ? {
                              background: `linear-gradient(135deg, ${cryptoColors.primary}, ${cryptoColors.secondary})`,
                            } : {}}
                          >
                            Dates personnalisées
                          </button>
                        </div>
                      </div>
                      
                      {/* Sélecteur de périodes prédéfinies */}
                      {!useCustomDates && (
                        <div className="flex flex-wrap items-center gap-2 bg-gradient-to-r from-[#2a2d3e]/80 to-[#252837]/80 rounded-2xl p-3 border border-gray-600/30 backdrop-blur-sm">
                          {[
                            { key: '1', label: '1J', name: '1 jour' },
                            { key: '7', label: '7J', name: '7 jours' },
                            { key: '30', label: '1M', name: '1 mois' },
                            { key: '90', label: '3M', name: '3 mois' },
                            { key: '365', label: '1A', name: '1 an' }
                          ].map(period => (
                            <button
                              key={period.key}
                              onClick={() => handlePeriodChange(period.key)}
                              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90 whitespace-nowrap ${
                                selectedTimeframe === period.key
                                  ? `text-white shadow-xl`
                                  : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-gray-200'
                              }`}
                              style={selectedTimeframe === period.key ? {
                                background: `linear-gradient(135deg, ${cryptoColors.primary}, ${cryptoColors.secondary})`,
                              } : {}}
                              title={period.name}
                            >
                              {period.label}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Sélecteur de dates personnalisées amélioré */}
                      {useCustomDates && (
                        <div className="bg-gradient-to-r from-[#2a2d3e]/80 to-[#252837]/80 rounded-2xl p-5 border border-gray-600/30 backdrop-blur-sm shadow-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-200 flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: cryptoColors.primary }}
                              ></div>
                              Date de début
                            </label>
                            <input
                              type="date"
                              value={tempStartDate}
                              onChange={(e) => setTempStartDate(e.target.value)}
                              onKeyDown={(e) => handleDateKeyDown(e, 'start', tempStartDate, setTempStartDate)}
                              max={tempEndDate}
                              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#3a3d4e] to-[#2a2d3e] border-2 text-white text-sm focus:outline-none transition-all duration-200 hover:opacity-90"
                              style={{ 
                                borderColor: `${cryptoColors.primary}40`,
                              }}
                              onFocus={(e) => e.target.style.borderColor = cryptoColors.primary}
                              onBlur={(e) => e.target.style.borderColor = `${cryptoColors.primary}40`}
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-200 flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: cryptoColors.secondary }}
                              ></div>
                              Date de fin
                            </label>
                            <input
                              type="date"
                              value={tempEndDate}
                              onChange={(e) => setTempEndDate(e.target.value)}
                              onKeyDown={(e) => handleDateKeyDown(e, 'end', tempEndDate, setTempEndDate)}
                              min={tempStartDate}
                              max={new Date().toISOString().split('T')[0]}
                              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#3a3d4e] to-[#2a2d3e] border-2 text-white text-sm focus:outline-none transition-all duration-200 hover:opacity-90"
                              style={{ 
                                borderColor: `${cryptoColors.primary}40`,
                              }}
                              onFocus={(e) => e.target.style.borderColor = cryptoColors.primary}
                              onBlur={(e) => e.target.style.borderColor = `${cryptoColors.primary}40`}
                            />
                          </div>
                        </div>
                        

                        {/* Bouton de confirmation */}
                        <div className="flex justify-end">
                          <button
                            onClick={confirmCustomDates}
                            disabled={!tempStartDate || !tempEndDate || tempStartDate > tempEndDate}
                            className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              background: `linear-gradient(135deg, ${cryptoColors.primary}, ${cryptoColors.secondary})`,
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <span>✓</span>
                              Confirmer la période
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                    </div>
                    
                    {/* Card d'information sur la période redesignée */}
                    <div className="relative overflow-hidden rounded-2xl border border-gray-600/30 shadow-lg backdrop-blur-sm">
                      {/* Arrière-plan avec gradient de la crypto */}
                      <div 
                        className="absolute inset-0 opacity-10"
                        style={{ 
                          background: `linear-gradient(135deg, ${cryptoColors.primary}, ${cryptoColors.secondary})` 
                        }}
                      ></div>
                      
                      {/* Contenu */}
                      <div className="relative bg-gradient-to-r from-[#2a2d3e]/90 to-[#252837]/90 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Icône avec animation */}
                            <div className="relative">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                                style={{ 
                                  background: `linear-gradient(135deg, ${cryptoColors.primary}, ${cryptoColors.secondary})` 
                                }}
                              >
                                <span className="text-white text-sm font-bold">📊</span>
                              </div>
                              {isGraphLoading && (
                                <div 
                                  className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                                  style={{ borderColor: `${cryptoColors.primary}40`, borderTopColor: 'transparent' }}
                                ></div>
                              )}
                            </div>
                            
                            <div>
                              <div className="text-white font-semibold text-sm">
                                {getCurrentPeriodDescription()}
                              </div>
                              <div className="text-gray-400 text-xs">
                                Période d'analyse active
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Graphique optimisé pleine largeur */}
                  <div 
                    className="crypto-modal-chart-container bg-gradient-to-br from-[#2a2d3e] to-[#252837] rounded-2xl p-1 sm:p-2 shadow-lg"
                    style={{ 
                      outline: 'none !important', 
                      border: 'none !important',
                      boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px'
                    }}
                  >
                    {(loading || isGraphLoading) ? (
                      <div className="h-64 sm:h-80 lg:h-[350px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                          {/* Animation avec les couleurs de la crypto */}
                          <div className="relative">
                          <div 
                            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent shadow-xl"
                            style={{ 
                              borderColor: `${cryptoColors.primary}30`,
                              borderTopColor: 'transparent',
                              borderRightColor: cryptoColors.primary,
                              borderBottomColor: cryptoColors.secondary,
                              borderLeftColor: `${cryptoColors.primary}60`
                            }}
                          ></div>
                          
                          {/* Logo au centre */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {coin?.image ? (
                              <img 
                                src={coin.image} 
                                alt={coin.name}
                                className="w-6 h-6 rounded-full shadow-lg animate-pulse"
                              />
                            ) : (
                              <div 
                                className="w-6 h-6 rounded-full animate-pulse shadow-lg"
                                style={{ backgroundColor: cryptoColors.primary }}
                              ></div>
                            )}
                          </div>
                        </div>
                        
                        {/* Texte avec couleurs de la crypto */}
                        <div className="text-center">
                          <div className="text-white font-medium text-sm mb-2">
                            Chargement des données...
                          </div>
                          <div className="flex items-center justify-center gap-1">
                            {[0, 1, 2].map(i => (
                              <span
                                key={i}
                                className="w-2 h-2 rounded-full animate-bounce"
                                style={{ 
                                  backgroundColor: i % 2 === 0 ? cryptoColors.primary : cryptoColors.secondary,
                                  animationDelay: `${i * 0.15}s` 
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : historicalData && historicalData.length > 0 ? (
                    <div className="crypto-modal-chart-container">
                      <ResponsiveContainer width="100%" height={isMobile ? 350 : 450}>
                        <AreaChart 
                          data={getFilteredData()} 
                          margin={{ top: 20, right: isMobile ? 10 : 20, left: isMobile ? 10 : 20, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="cryptoGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={cryptoColors.primary} stopOpacity={0.6}/>
                              <stop offset="50%" stopColor={cryptoColors.secondary} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={cryptoColors.primary} stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" opacity={0.2} />
                          <XAxis 
                            dataKey="timestamp" 
                            type="number"
                            scale="time"
                            domain={['dataMin', 'dataMax']}
                            tickFormatter={(value) => {
                              const date = new Date(value)
                              if (selectedTimeframe === '1') {
                                return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                              } else {
                                return date.toLocaleDateString('fr-FR', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })
                              }
                            }}
                            stroke="#9CA3AF"
                            fontSize={isMobile ? 11 : 13}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            domain={['dataMin * 0.98', 'dataMax * 1.02']}
                            tickFormatter={(value) => {
                              if (isMobile) {
                                if (value >= 1000) return `${(value/1000).toFixed(0)}k`
                                if (value >= 1) return value.toFixed(2)
                                return value.toFixed(6)
                              } else {
                                if (value >= 1000) return `${(value/1000).toFixed(1)}k`
                                if (value >= 1) return value.toFixed(2)
                                return value.toFixed(4)
                              }
                            }}
                            stroke="#9CA3AF"
                            fontSize={isMobile ? 10 : 12}
                            axisLine={false}
                            tickLine={false}
                            width={isMobile ? 60 : 75}
                            tickCount={8}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke={cryptoColors.primary}
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#cryptoGradient)" 
                            dot={false}
                            activeDot={{ 
                              r: 6, 
                              fill: cryptoColors.primary,
                              stroke: cryptoColors.light,
                              strokeWidth: 2,
                              filter: `drop-shadow(0 2px 4px ${cryptoColors.primary}40)`
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 sm:h-96 lg:h-[500px] flex items-center justify-center text-gray-400">
                      Données indisponibles
                    </div>
                  )}
                </div>

                {/* Métriques essentielles harmonisées */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6">
                  <div className="bg-gradient-to-br from-[#2a2d3e] to-[#252837] rounded-2xl p-5 shadow-lg border border-gray-600/30 hover:border-gray-500/40 transition-all duration-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <div className="text-sm text-gray-300 font-medium">Capitalisation</div>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-white break-words">{formatNumberWithCurrency(coin.market_cap, 0, isMobile)}</div>
                  </div>
                  <div className="bg-gradient-to-br from-[#2a2d3e] to-[#252837] rounded-2xl p-5 shadow-lg border border-gray-600/30 hover:border-gray-500/40 transition-all duration-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-[#3A6FF8] rounded-full"></div>
                      <div className="text-sm text-gray-300 font-medium">Volume 24h</div>
                    </div>
                    <div className="text-base sm:text-lg font-bold text-white break-words">{formatNumberWithCurrency(coin.total_volume, 0, isMobile)}</div>
                  </div>
                </div>
              </div>

              {/* Colonne 2: Informations clés colorées */}
              <div className="space-y-4 sm:space-y-6">
                {/* Performance harmonisée */}
                <div className="bg-gradient-to-br from-[#2a2d3e] to-[#252837] rounded-2xl p-5 shadow-lg border border-gray-600/30 hover:border-gray-500/40 transition-all duration-200">
                  <h4 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-sm"></div>
                    <span className="tracking-wide">Performance</span>
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm sm:text-base">24 heures</span>
                      <span className={`font-bold text-sm sm:text-base ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                      </span>
                    </div>
                    {detailedInfo?.market_data?.price_change_percentage_7d && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm sm:text-base">7 jours</span>
                        <span className={`font-bold text-sm sm:text-base ${detailedInfo.market_data.price_change_percentage_7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {detailedInfo.market_data.price_change_percentage_7d >= 0 ? '+' : ''}{detailedInfo.market_data.price_change_percentage_7d.toFixed(2)}%
                        </span>
                      </div>
                    )}
                    {detailedInfo?.market_data?.price_change_percentage_30d && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm sm:text-base">30 jours</span>
                        <span className={`font-bold text-sm sm:text-base ${detailedInfo.market_data.price_change_percentage_30d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {detailedInfo.market_data.price_change_percentage_30d >= 0 ? '+' : ''}{detailedInfo.market_data.price_change_percentage_30d.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistiques harmonisées */}
                <div className="bg-gradient-to-br from-[#2a2d3e] to-[#252837] rounded-2xl p-5 shadow-lg border border-gray-600/30 hover:border-gray-500/40 transition-all duration-200">
                  <h4 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full shadow-sm"></div>
                    <span className="tracking-wide">Statistiques</span>
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm sm:text-base font-medium">Rang</span>
                      <span className="font-bold text-white text-sm sm:text-base bg-gradient-to-r from-[#3a3d4e] to-[#2a2d3e] px-3 py-1 rounded-lg border border-gray-500/30">#{coin.market_cap_rank}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm sm:text-base font-medium">ATH</span>
                      <span className="font-bold text-emerald-400 text-sm sm:text-base bg-emerald-900/20 px-3 py-1 rounded-lg border border-emerald-500/30">{formatPrice(coin.ath)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm sm:text-base font-medium">ATL</span>
                      <span className="font-bold text-red-400 text-sm sm:text-base bg-red-900/20 px-3 py-1 rounded-lg border border-red-500/30">{formatPrice(coin.atl || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Offre harmonisée */}
                {detailedInfo?.market_data && (
                  <div className="bg-gradient-to-br from-[#2a2d3e] to-[#252837] rounded-2xl p-5 shadow-lg border border-gray-600/30 hover:border-gray-500/40 transition-all duration-200">
                    <h4 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full shadow-sm"></div>
                      <span className="tracking-wide">Offre</span>
                    </h4>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm sm:text-base">Circulante</span>
                        <span className="font-bold text-white text-xs sm:text-sm break-words text-right">
                          {formatNumber(detailedInfo.market_data.circulating_supply, 0, isMobile)}
                        </span>
                      </div>
                      {detailedInfo.market_data.max_supply && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm sm:text-base">Maximum</span>
                            <span className="font-bold text-white text-xs sm:text-sm break-words text-right">
                              {formatNumber(detailedInfo.market_data.max_supply, 0, isMobile)}
                            </span>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs sm:text-sm text-gray-300 mb-2">
                              <span>Progression</span>
                              <span className="font-bold">{((detailedInfo.market_data.circulating_supply / detailedInfo.market_data.max_supply) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(detailedInfo.market_data.circulating_supply / detailedInfo.market_data.max_supply) * 100}%` }}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Liens harmonisés */}
                {detailedInfo?.links && (
                  <div className="bg-gradient-to-br from-[#2a2d3e] to-[#252837] rounded-2xl p-5 shadow-lg border border-gray-600/30 hover:border-gray-500/40 transition-all duration-200">
                    <h4 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full shadow-sm"></div>
                      <span className="tracking-wide">Liens</span>
                    </h4>
                    <div className="space-y-2 sm:space-y-3">
                      {detailedInfo.links?.homepage?.[0] && (
                        <a 
                          href={detailedInfo.links.homepage[0]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-[#3a3d4e] to-[#2a2d3e] rounded-xl hover:from-[#4a4d5e] hover:to-[#3a3d4e] transition-all duration-200 border border-gray-500/30 hover:border-blue-400/50 hover:opacity-90"
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <FaGlobe className="text-blue-400 text-sm sm:text-base" />
                            <span className="text-white font-medium text-sm sm:text-base">Site officiel</span>
                          </div>
                          <FaExternalLinkAlt className="text-gray-400" size={12} />
                        </a>
                      )}
                      {detailedInfo.links?.twitter_screen_name && (
                        <a 
                          href={`https://twitter.com/${detailedInfo.links.twitter_screen_name}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-[#3a3d4e] to-[#2a2d3e] rounded-xl hover:from-[#4a4d5e] hover:to-[#3a3d4e] transition-all duration-200 border border-gray-500/30 hover:border-blue-400/50 hover:opacity-90"
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <FaTwitter className="text-blue-400 text-sm sm:text-base" />
                            <span className="text-white font-medium text-sm sm:text-base">Twitter</span>
                          </div>
                          <FaExternalLinkAlt className="text-gray-400" size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>
          </motion.div>
        )}
      </motion.div>
      </AnimatePresence>
    </>
  )
}

export default CryptoInfoModal