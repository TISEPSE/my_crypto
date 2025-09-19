"use client"

import { motion } from 'framer-motion'
import { FaRedo, FaExclamationTriangle } from 'react-icons/fa'

export default function NotFound() {
  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e] flex flex-col justify-center items-center p-6 relative">
      <div className="text-center flex-1 flex flex-col justify-center">
        {/* Logo centré dans son cercle */}
        <div className="w-20 h-20 mx-auto bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl mb-8">
          <span className="text-3xl">⚠️</span>
        </div>

        {/* Titre principal */}
        <h1 className="text-2xl font-bold text-white mb-4">
          Erreur d'affichage
        </h1>

        {/* Description */}
        <p className="text-slate-400 mb-8 max-w-md">
          Une erreur s'est produite lors du chargement de cette page.
        </p>

        {/* Bouton principal */}
        <button
          onClick={handleReload}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 hover:opacity-90 mx-auto"
        >
          Recharger la page
        </button>
      </div>

      {/* Petit texte en bas */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-slate-500 text-sm">
          Cela peut être dû à une incompatibilité avec votre navigateur.
        </p>
        <p className="text-slate-500 text-sm mt-1">
          Si le problème persiste, essayez avec un navigateur plus récent.
        </p>
      </div>
    </div>
  )
}
