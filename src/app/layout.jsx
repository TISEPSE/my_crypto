"use client"
import { useState, memo, useCallback } from "react"
import { usePathname } from "next/navigation"
import { AuthProvider } from "./context/AuthContext"
import { UserDataProvider } from "./context/UserDataContext"
import { LanguageProvider } from "./context/LanguageContext"
import Navbar from "./components/navbar"
import PageTransition from "./components/PageTransition"
import { CryptoProvider } from "./context/CryptoContext"
import { FavoritesProvider } from "./context/FavoritesContext"
import { CryptoPerformanceProvider } from "./context/CryptoPerformanceContext"
import ErrorBoundary from "./components/ErrorBoundary"
import { Analytics } from "@vercel/analytics/next"
import { Geist, Geist_Mono } from "next/font/google"
import LanguageSync from "./components/LanguageSync"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

const LayoutContent = memo(function LayoutContent({ children }) {
  const pathname = usePathname()

  // Pages où la navbar doit être cachée
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/'

  return (
    <>
      {!isAuthPage && <Navbar />}
      <main
        className={`transition-all duration-300 ease-in-out ${
          !isAuthPage
            ? "pt-20 min-h-screen bg-[#212332]"
            : ""
        }`}
      >
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </>
  )
})

const RootLayout = memo(function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <title>My Crypto - Personal Cryptocurrency Dashboard</title>
        <meta name="description" content="Your personal cryptocurrency portfolio tracker and dashboard. Monitor prices, manage favorites, and stay updated with the crypto market." />
        <meta name="keywords" content="cryptocurrency, crypto, dashboard, portfolio, bitcoin, ethereum, trading" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ErrorBoundary>
          <AuthProvider>
            <UserDataProvider>
              <LanguageProvider>
                <LanguageSync />
                <FavoritesProvider>
                  <CryptoProvider>
                    <CryptoPerformanceProvider>
                      <LayoutContent>
                        {children}
                      </LayoutContent>
                    </CryptoPerformanceProvider>
                  </CryptoProvider>
                </FavoritesProvider>
              </LanguageProvider>
            </UserDataProvider>
          </AuthProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
})

export default RootLayout