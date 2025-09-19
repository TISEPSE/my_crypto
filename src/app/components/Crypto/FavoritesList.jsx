import React from 'react'
import { useFavoritesContext } from '../../context/FavoritesContext'
import { useAuth } from '../../context/AuthContext'

const FavoritesList = ({ onCryptoSelect }) => {
  const { favorites, loading, error, removeFavorite } = useFavoritesContext()
  const { user, authenticated } = useAuth()

  if (loading) {
    return (
      <div className="text-gray-400 text-center py-6 bg-[#2a2d3e]/50 rounded-lg border border-[#3a3d4e]/50">
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Chargement...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-400 text-center py-6 bg-[#2a2d3e]/50 rounded-lg border border-red-500/20">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Erreur: {error}</span>
        </div>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="text-gray-400 text-center py-8 bg-[#2a2d3e]/50 rounded-lg border border-[#3a3d4e]/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-amber-500/20 to-orange-600/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-300">Aucun favori pour le moment</div>
            <div className="text-xs text-gray-500 mt-1">Ajoutez des cryptos à vos favoris pour les voir ici</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#2a2d3e] border border-[#3a3d4e] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="text-gray-400 text-sm font-medium">
            {favorites.length} crypto{favorites.length > 1 ? 's' : ''} favori{favorites.length > 1 ? 's' : ''}
          </div>
          {authenticated && (
            <div className="flex items-center gap-1 text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Privés</span>
            </div>
          )}
        </div>
        <div className="w-6 h-6 bg-gradient-to-r from-amber-500/20 to-orange-600/20 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
        {favorites.map((favorite, index) => (
          <div
            key={favorite.id}
            className="group bg-[#1e212f] hover:bg-[#252837] border border-[#3a3d4e]/50 hover:border-[#3A6FF8]/50 rounded-lg p-3 transition-all duration-200 hover:opacity-95 cursor-pointer"
            onClick={() => onCryptoSelect?.(favorite.symbol)}
            style={{
              animationDelay: `${index * 0.05}s`
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-500/20 to-orange-600/20 rounded-full flex items-center justify-center border border-amber-500/30">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[#FeFeFe] font-semibold text-sm group-hover:text-white transition-colors">
                    {favorite.name}
                  </div>
                  <div className="text-gray-400 text-xs font-medium">
                    {favorite.symbol.toUpperCase()}
                  </div>
                </div>
              </div>
              
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  await removeFavorite(favorite.symbol)
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 p-2 rounded-lg"
                title="Retirer des favoris"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FavoritesList