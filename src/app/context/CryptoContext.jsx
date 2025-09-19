"use client"

import { createContext, useContext, useState } from "react"

const CryptoContext = createContext()

export function CryptoProvider({ children }) {
  const [cryptoPaginationData, setCryptoPaginationData] = useState(null)

  return (
    <CryptoContext.Provider value={{ cryptoPaginationData, setCryptoPaginationData }}>
      {children}
    </CryptoContext.Provider>
  )
}

export function useCryptoContext() {
  const context = useContext(CryptoContext)
  if (!context) {
    return { cryptoPaginationData: null, setCryptoPaginationData: () => {} }
  }
  return context
}