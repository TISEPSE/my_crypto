"use client"
import CryptoDashboard from "../components/Crypto/CryptoDashboard"
import AuthGuard from "../components/AuthGuard"

export default function CryptoPage() {
  return (
    <AuthGuard redirectTo="/">
      <CryptoDashboard />
    </AuthGuard>
  )
}