"use client"
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#212332] text-[#FeFeFe] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#2a2d3e] border border-[#3a3d4e] rounded-lg p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-red-400 text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-[#FeFeFe] mb-2">
                Erreur d'affichage
              </h2>
              <p className="text-gray-400 mb-4">
                Une erreur s'est produite lors du chargement de cette page.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Cela peut être dû à une incompatibilité avec votre navigateur.
              </p>
            </div>
            
            <div>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-md font-medium hover:from-blue-500 hover:to-blue-600 transition-all duration-200"
              >
                Recharger la page
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <p>Si le problème persiste, essayez avec un navigateur plus récent.</p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary