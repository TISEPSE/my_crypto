import React from "react"
import { useLanguage } from "../../context/LanguageContext"

const CryptoToolbar = ({
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  currency,
  setCurrency,
  loading,
  isRetrying,
  retryCount,
  filterType,
  setFilterType,
  searchQuery,
  setSearchQuery,
  performanceData,
  isUsingFallback = false,
}) => {
  const { t } = useLanguage()
  const sortOptions = [
    { value: "market_cap", label: t('crypto.toolbar.sortOptions.market_cap'), shortLabel: t('crypto.toolbar.sortOptions.market_cap') },
    { value: "current_price", label: t('crypto.toolbar.sortOptions.current_price'), shortLabel: t('crypto.toolbar.sortOptions.current_price') },
    { value: "name", label: t('crypto.toolbar.sortOptions.name'), shortLabel: t('crypto.toolbar.sortOptions.name') },
    { value: "market_cap_rank", label: t('crypto.toolbar.sortOptions.market_cap_rank'), shortLabel: t('crypto.toolbar.sortOptions.market_cap_rank') },
  ]

  const filterOptions = [
    { value: "all", label: t('crypto.toolbar.filterOptions.all'), shortLabel: t('crypto.toolbar.filterOptions.all'), icon: "🌐" },
    { value: "favorites", label: t('crypto.toolbar.filterOptions.favorites'), shortLabel: t('crypto.toolbar.filterOptions.favorites'), icon: "⭐" },
  ]


  return (
    <div className="border-b border-gray-600/20 z-40">
      <div className="w-full px-4 sm:px-6 py-4">
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between w-full">
          <div className="flex items-center gap-6 flex-1 justify-between">
            {/* Tri */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-300">{t('crypto.toolbar.sort')}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const currentIndex = sortOptions.findIndex(option => option.value === sortBy);
                    const nextIndex = (currentIndex + 1) % sortOptions.length;
                    setSortBy(sortOptions[nextIndex].value);
                  }}
                  className="bg-gradient-to-r from-[#2a2d3e] to-[#252837] hover:from-[#3a3d4e] hover:to-[#353847] text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-600/30 hover:border-gray-500/50 min-w-[120px] text-left"
                >
                  {sortOptions.find(option => option.value === sortBy)?.label}
                </button>
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="bg-gradient-to-r from-[#2a2d3e] to-[#252837] hover:from-[#3a3d4e] hover:to-[#353847] text-white px-2 py-2 rounded-lg text-sm transition-all duration-200 border border-gray-600/30 hover:border-gray-500/50 w-9 flex items-center justify-center"
                >
                  {sortOrder === 'desc' ? '🔽' : '🔼'}
                </button>
              </div>
            </div>

            {/* Filtre */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-300">{t('crypto.toolbar.filter')}</span>
              </div>
              <button
                onClick={() => setFilterType(filterType === 'all' ? 'favorites' : 'all')}
                className="bg-gradient-to-r from-[#2a2d3e] to-[#252837] hover:from-[#3a3d4e] hover:to-[#353847] text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-600/30 hover:border-gray-500/50 min-w-[90px] flex items-center gap-2"
              >
                <span>{filterOptions.find(option => option.value === filterType)?.icon}</span>
                <span>{filterOptions.find(option => option.value === filterType)?.label}</span>
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-300">{t('crypto.toolbar.search')}</span>
              </div>
              <input
                type="text"
                placeholder={t('crypto.toolbar.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gradient-to-r from-[#2a2d3e] to-[#252837] text-white px-3 py-2 rounded-lg text-sm border border-gray-600/30 focus:border-purple-500/50 focus:outline-none transition-all duration-200 min-w-[220px] placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-2 py-2 rounded-lg text-sm transition-all duration-200 w-7 h-7 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>



            {/* Devise */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-300">{t('crypto.toolbar.currency')}</span>
              </div>
              <button
                onClick={() => setCurrency(currency === 'eur' ? 'usd' : 'eur')}
                className="bg-gradient-to-r from-[#2a2d3e] to-[#252837] hover:from-[#3a3d4e] hover:to-[#353847] text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-gray-600/30 hover:border-gray-500/50 min-w-[60px]"
              >
                {currency === 'eur' ? 'EUR' : 'USD'}
              </button>
            </div>


          </div>

        </div>

        {/* Mobile - Search bar only */}
        <div className="md:hidden space-y-3">
          {/* Search bar */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={t('crypto.toolbar.searchPlaceholderMobile') || "Rechercher une crypto..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gradient-to-r from-[#2a2d3e] to-[#252837] text-white pl-10 pr-10 py-3 rounded-xl text-sm border border-gray-600/30 focus:border-purple-500/60 focus:outline-none transition-all duration-300 placeholder-gray-500 focus:shadow-lg focus:shadow-purple-500/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-all duration-200 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CryptoToolbar
