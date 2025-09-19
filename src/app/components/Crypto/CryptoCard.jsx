import React from "react"
import { useFavoritesContext } from "../../context/FavoritesContext"
import { useToast } from "../../hooks/useToast"
import { useLanguage } from "../../context/LanguageContext"
import { useCryptoPerformance } from "../../context/CryptoPerformanceContext"
import Toast from "../UI/Toast"

// Fonction pour formater les prix avec précision (sans arrondi)
const formatPrice = (price, currency, t) => {
  if (!price && price !== 0) return t('common.unavailable')
  if (price === 0) return "0"
  
  // Pour les prix très petits (< 0.01), afficher jusqu'à 8 décimales
  if (price < 0.01) {
    return price.toFixed(8).replace(/\.?0+$/, "")
  }
  // Pour les prix moyens (< 1), afficher jusqu'à 6 décimales
  else if (price < 1) {
    return price.toFixed(6).replace(/\.?0+$/, "")
  }
  // Pour les prix entre 1 et 100, afficher jusqu'à 4 décimales
  else if (price < 100) {
    return price.toFixed(4).replace(/\.?0+$/, "")
  }
  // Pour les prix plus élevés, utiliser 2 décimales avec séparateurs
  else {
    return price.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    })
  }
}

// Fonction pour formater les gros nombres (market cap, volume)
const formatLargeNumber = (value, currency, isMobile = false, t) => {
  if (!value && value !== 0) return t('common.unavailable')
  if (value === 0) return "0"
  
  // Sur mobile, garder le format abrégé
  if (isMobile) {
    if (value >= 1e12) {
      return (value / 1e12).toFixed(2) + "T"
    } else if (value >= 1e9) {
      return (value / 1e9).toFixed(2) + "B"
    } else if (value >= 1e6) {
      return (value / 1e6).toFixed(2) + "M"
    } else if (value >= 1e3) {
      return (value / 1e3).toFixed(2) + "K"
    } else {
      return value.toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })
    }
  }
  
  // Sur desktop, afficher les chiffres complets
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

const Variation = ({label, value}) => (
  <div className="flex items-center gap-[0.3em] text-[0.75em]">
    <span className="text-gray-400 font-medium">{label}</span>
    {value !== null && value !== undefined ? (
      <span
        className={`font-semibold px-[0.4em] py-[0.1em] rounded ${
          value >= 0
            ? "bg-emerald-500/20 text-emerald-300"
            : "bg-red-500/20 text-red-300"
        }`}
      >
        {value >= 0 ? '+' : ''}{value.toFixed(2)}%
      </span>
    ) : (
      <span className="text-gray-500 text-xs bg-gray-600/20 px-[0.4em] py-[0.1em] rounded">
        N/A
      </span>
    )}
  </div>
)

const CryptoCard = React.forwardRef(({coin, currency, onInfoClick, index = 0, hasInteracted = false}, ref) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesContext()
  const { toast, showToast, hideToast } = useToast()
  const { t } = useLanguage()

  // Vérifier si les données essentielles sont manquantes
  const hasMissingData = !coin.current_price && coin.current_price !== 0
  const hasMissingMarketData = (!coin.market_cap && coin.market_cap !== 0) || (!coin.total_volume && coin.total_volume !== 0)

  // Calculate percentage changes for display
  const primaryChange = coin.price_change_percentage_24h_in_currency || coin.price_change_percentage_24h || 0

  // Get secondary change (always 7 days for comparison)
  const secondaryChange = coin.price_change_percentage_7d_in_currency || 0

  // Mémorisation pour éviter le re-render complet
  const memoizedCoin = React.useMemo(() => coin, [coin])

  const handleAddToFavorites = async (e) => {
    e.stopPropagation()
    let result
    if (isFavorite(coin.symbol)) {
      result = await removeFavorite(coin.symbol)
    } else {
      result = await addFavorite(coin.symbol, coin.name)
    }
    
    if (result) {
      showToast(result.message, result.success ? 'success' : 'error', result.needsAuth)
    }
  }

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        needsAuth={toast.needsAuth}
      />
      <div
        ref={ref}
        className={`crypto-card bg-[#2a2d3e] border border-[#3a3d4e] rounded-[0.75em] p-[1em]
                   transition-all duration-300 ease-out group cursor-pointer flex flex-col h-[16em]
                   hover:border-[#3A6FF8]
                   hover:bg-gradient-to-br hover:from-[#2f3240] hover:to-[#2a2d3e] 
                   hover:opacity-95
                   relative overflow-hidden
                   animate-[fadeInUp_0.2s_ease-out_forwards] opacity-0
                   before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent 
                   before:via-[#3A6FF8]/10 before:to-transparent before:translate-x-[-100%] 
                   before:transition-transform before:duration-700 hover:before:translate-x-[100%]`}
        style={{
          animationDelay: `${index * 0.02}s`
        }}
      >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-[0.6em] flex-1 min-w-0">
          <div className="relative">
            <img
              src={coin.image}
              alt={coin.name}
              className="w-[2.2em] h-[2.2em] rounded-full object-cover object-center 
                         transition-all duration-300 ease-out
                         group-hover:opacity-80 
                         group-hover:opacity-80"
            />
            <div className="absolute -top-[0.4em] -right-[0.4em] w-[1.3em] h-[1.3em] 
                            bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full 
                            flex items-center justify-center shadow-lg border-2 border-[#2a2d3e]
                            transition-all duration-300 ease-out
                            group-hover:opacity-80 
                            group-hover:opacity-80">
              <span className="text-[0.6em] font-bold text-white leading-none">
                #{coin.market_cap_rank}
              </span>
            </div>
            {isFavorite(coin.symbol) && (
              <div className="absolute -top-[0.2em] -left-[0.2em] w-[1.1em] h-[1.1em] bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-[#2a2d3e]">
                <span className="text-[0.7em] text-white">⭐</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className="text-[1.3em] font-bold text-[#FeFeFe] truncate 
                           transition-all duration-300 ease-out
                           group-hover:text-[#3A6FF8] group-hover:drop-shadow-lg"
                title={coin.name}
              >
                {coin.name}
              </h3>
              {isFavorite(coin.symbol) && (
                <span className="text-[0.8em] text-yellow-400 animate-pulse">★</span>
              )}
            </div>
            <p className="text-[0.75em] text-gray-400 font-medium truncate">
              {coin.symbol.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end text-[1em] gap-[0.3em]">
          <Variation
            label="24h"
            value={primaryChange}
          />
          <Variation
            label="7j"
            value={secondaryChange}
          />
        </div>
      </div>

      <div className="mb-4">
        {hasMissingData ? (
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 text-center">
            <div className="text-orange-400 text-sm font-medium mb-1">
              📊 {t('crypto.card.dataUnavailable')}
            </div>
            <div className="text-orange-300/70 text-xs leading-relaxed">
              {t('crypto.card.dataUnavailableDesc')}
            </div>
          </div>
        ) : (
          <div
            className="text-[1.6em] font-bold text-[#FeFeFe] truncate
                       transition-all duration-300 ease-out
                       group-hover:opacity-90"
            title={`${formatPrice(coin.current_price, currency, t)} ${
              currency === "eur" ? "€" : "$"
            }`}
          >
            {formatPrice(coin.current_price, currency, t)}{" "}
            <span className="text-[0.7em] text-[#FeFeFe] transition-colors duration-300">
              {currency === "eur" ? "€" : "$"}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-[0.3em] text-[0.8em] text-gray-400 mb-4">
        {hasMissingMarketData && !hasMissingData ? (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-2 text-center">
            <div className="text-yellow-400 text-xs font-medium">
              ⚠️ {t('crypto.card.partialMarketData')}
            </div>
          </div>
        ) : null}
        <div className="flex justify-between items-center">
          <span className="text-gray-400">{t('crypto.card.marketCap')}</span>
          <span className="font-medium text-gray-200">
            <span className="hidden sm:inline">
              {formatLargeNumber(coin.market_cap, currency, false, t)} {coin.market_cap !== undefined ? (currency === "eur" ? "€" : "$") : ""}
            </span>
            <span className="sm:hidden">
              {formatLargeNumber(coin.market_cap, currency, true, t)} {coin.market_cap !== undefined ? (currency === "eur" ? "€" : "$") : ""}
            </span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">{t('crypto.card.volume24h')}</span>
          <span className="font-medium text-gray-200">
            <span className="hidden sm:inline">
              {formatLargeNumber(coin.total_volume, currency, false, t)} {coin.total_volume !== undefined ? (currency === "eur" ? "€" : "$") : ""}
            </span>
            <span className="sm:hidden">
              {formatLargeNumber(coin.total_volume, currency, true, t)} {coin.total_volume !== undefined ? (currency === "eur" ? "€" : "$") : ""}
            </span>
          </span>
        </div>
      </div>


      <div className="flex gap-[0.5em] mt-auto">
        <button
          onClick={handleAddToFavorites}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-[0.6em] px-[1em] rounded-[0.4em] font-medium text-[0.8em] border border-emerald-500/20 transition-all duration-200 hover:from-emerald-500 hover:to-emerald-600 hover:opacity-90"
        >
          {isFavorite(coin.symbol) ? t('crypto.card.remove') : t('crypto.card.add')}
        </button>
        <button
          onClick={() => onInfoClick?.(coin)}
          className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white py-[0.6em] px-[1em] rounded-[0.4em] font-medium text-[0.8em] border border-slate-500/20 transition-all duration-200 hover:from-slate-500 hover:to-slate-600 hover:opacity-90"
        >
          {t('crypto.card.info')}
        </button>
      </div>
      </div>
    </>
  )
})

// Mémorisation du composant pour éviter les re-renders inutiles
export default React.memo(CryptoCard, (prevProps, nextProps) => {
  // Le composant ne se re-render que si ces valeurs changent
  return (
    prevProps.coin.id === nextProps.coin.id &&
    prevProps.coin.current_price === nextProps.coin.current_price &&
    prevProps.coin.price_change_percentage_24h_in_currency === nextProps.coin.price_change_percentage_24h_in_currency &&
    prevProps.coin.price_change_percentage_7d_in_currency === nextProps.coin.price_change_percentage_7d_in_currency &&
    prevProps.coin.market_cap === nextProps.coin.market_cap &&
    prevProps.coin.total_volume === nextProps.coin.total_volume &&
    prevProps.currency === nextProps.currency &&
    prevProps.index === nextProps.index
  )
})
