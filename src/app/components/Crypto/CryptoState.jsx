import React from "react"

export const CryptoErrorState = ({ error, retryCount, onRetry }) => (
  <div className="min-h-screen bg-[#212332] flex items-center justify-center px-4">
    <div className="text-center bg-red-500/10 border border-red-500/30 rounded-lg p-8 max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-red-400 text-xl font-semibold mb-2">Erreur de chargement</h3>
      <p className="text-gray-300 mb-4">{error}</p>
      {retryCount > 0 && (
        <p className="text-yellow-400 text-sm mb-4">
          Tentatives de reconnexion: {retryCount}
        </p>
      )}
      <button
        onClick={onRetry}
        className="bg-[#3A6FF8] hover:bg-[#2952d3] text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg"
      >
        Réessayer
      </button>
    </div>
  </div>
)

export const CryptoLoadingState = ({ retryCount }) => (
  <div className="fixed inset-0 bg-gradient-to-br from-[#1a1d29] to-[#212332] flex items-center justify-center z-50 min-h-screen">
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 border-4 border-[#3A6FF8]/30 rounded-full animate-spin border-t-[#3A6FF8]"></div>
      <p className="mt-4 text-white text-lg font-medium">Loading crypto data...</p>
      {retryCount > 0 && (
        <p className="mt-2 text-gray-400 text-sm">
          Attempt {retryCount}
        </p>
      )}
    </div>
  </div>
)

export const CryptoRetryNotification = ({ retryCount, isAutoRetry = false, nextRetryIn = null, maxRetries = 5 }) => (
  <div className="mb-6 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-center gap-3">
    <div className="w-5 h-5 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
      <svg className="w-3 h-3 text-orange-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </div>
    <div className="flex-1">
      <p className="text-orange-400 text-sm font-medium">
        {isAutoRetry ? "Auto-refresh en cours" : "Problème de connexion détecté"}
      </p>
      <p className="text-gray-300 text-xs">
        {isAutoRetry ? (
          <>
            Tentative automatique {retryCount}/{maxRetries}
            {nextRetryIn && nextRetryIn > 0 && ` • Prochaine tentative dans ${nextRetryIn}s`}
          </>
        ) : (
          `Tentative de reconnexion ${retryCount} • Prochaine tentative dans 5s`
        )}
      </p>
    </div>
  </div>
)