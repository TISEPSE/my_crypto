import React from "react"

const CryptoPagination = ({
  currentPage,
  onPageChange,
  cryptosLength,
  itemsPerPage = 40,
  totalPages = 1,
  hasNextPage = true,
  className = ""
}) => {
  const handlePrevious = () => {
    onPageChange(Math.max(1, currentPage - 1))
  }

  const handleNext = () => {
    onPageChange(currentPage + 1)
  }

  // État des boutons
  const isNextDisabled = !hasNextPage || cryptosLength < itemsPerPage

  return (
    <>
      {/* Pagination desktop/tablette */}
      <div className={`hidden sm:flex justify-center items-center gap-3 mt-8 ${className}`}>
        <button
          disabled={currentPage === 1}
          onClick={handlePrevious}
          className="bg-[#3a3d4e] hover:bg-[#4a4d5e] disabled:bg-[#2a2d3e] text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Précédent</span>
        </button>

        <div className="flex items-center gap-2 px-3 py-2 bg-[#2a2d3e] rounded-lg border border-[#3a3d4e]">
          <span className="text-gray-300 text-sm">
            Page {currentPage} / {totalPages}
          </span>
          <span className="text-xs text-gray-400">
            ({cryptosLength} cryptos)
          </span>
        </div>

        <button
          disabled={isNextDisabled}
          onClick={handleNext}
          className="bg-[#3A6FF8] hover:bg-[#2952d3] disabled:bg-[#2a2d3e] text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>Suivant</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Pagination mobile - Rendu dans le composant parent */}
      <div className="sm:hidden">
        <div className="h-20"></div> {/* Spacer pour éviter que le contenu soit caché */}
      </div>
    </>
  )
}

export default CryptoPagination