"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FaBitcoin, FaCog, FaUser, FaSignOutAlt, FaChartLine, FaBars, FaTimes } from "react-icons/fa"
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Navbar() {
  const [hasMounted, setHasMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { t } = useLanguage()

  const navItems = [
    { href: "/crypto", label: t('navigation.dashboard'), icon: FaBitcoin },
    { href: "/profile", label: t('navigation.profile'), icon: FaUser },
    { href: "/settings", label: t('navigation.settings'), icon: FaCog },
  ]

  const isActiveRoute = (href) => {
    const cleanPathname = pathname.replace(/\/$/, '') || '/';
    const cleanHref = href.replace(/\/$/, '') || '/';
    return cleanPathname === cleanHref;
  }

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Close menu on route change with smooth transition
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Optimized body scroll prevention with performance improvements
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = '0px' // Prevent layout shift
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      document.documentElement.style.overflow = ''
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      document.documentElement.style.overflow = ''
    }
  }, [menuOpen])

  if (!hasMounted) return null

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#212332] border-b border-gray-700/50">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/crypto" className="flex items-center gap-3 hover:opacity-80 transition-all duration-300 z-50 relative">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
              <FaBitcoin className="text-white text-sm" />
            </div>
            <h1 className="text-xl font-semibold text-white">{t('navigation.myCrypto')}</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-80 ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-lg shadow-orange-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  <Icon className="text-sm" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1d29] rounded-lg border border-gray-700/50">
                <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                  <FaUser className="text-xs text-white" />
                </div>
                <span className="text-sm font-medium text-gray-300">
                  {user.username || user.email?.split('@')[0] || t('common.user')}
                </span>
              </div>
            )}
          </div>

          {/* Mobile Menu Button - Improved */}
          <div className="md:hidden flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1d29] rounded-xl border border-gray-700/50 shadow-lg">
                <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <FaUser className="text-xs text-white" />
                </div>
                <span className="text-sm font-medium text-gray-300 max-w-24 truncate">
                  {user.username || user.email?.split('@')[0] || t('common.user')}
                </span>
              </div>
            )}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="p-2.5 text-gray-400 hover:text-white transition-all duration-300 hover:bg-gray-700/30 rounded-xl z-[110] relative active:scale-95 focus:outline-none select-none bg-[#1a1d29] border border-gray-600/30"
              aria-label={menuOpen ? t('common.close') : 'Menu'}
              style={{ minWidth: '42px', minHeight: '42px', touchAction: 'manipulation' }}
            >
              <div className={`transition-all duration-300 ${menuOpen ? 'rotate-90' : 'rotate-0'}`}>
                {menuOpen ? (
                  <FaTimes className="text-lg" />
                ) : (
                  <FaBars className="text-lg" />
                )}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Enhanced Full-Screen Mobile Menu */}
      <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${
        menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`} style={{ top: '80px' }}>
        {/* Optimized Background Overlay */}
        <div
          className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-all duration-300 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Enhanced Menu Content */}
        <div className={`absolute inset-0 bg-gradient-to-br from-[#212332] via-[#1a1d29] to-[#151821] transition-all duration-500 ease-out overflow-hidden ${
          menuOpen ? 'transform translate-x-0' : 'transform translate-x-full'
        }`}>
          <div className="flex flex-col h-full overflow-y-auto pb-safe">
            {/* Enhanced Navigation Items */}
            <nav className="flex-1 px-6 py-6">
              <div className="space-y-2">
                {navItems.map((item, index) => {
                  const Icon = item.icon
                  const isActive = isActiveRoute(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 active:scale-98 group ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 text-orange-400 border border-orange-500/30 shadow-lg shadow-orange-500/10'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700/40 hover:border-gray-600/50 border border-transparent active:bg-gray-700/60'
                      }`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        opacity: menuOpen ? 1 : 0,
                        transform: menuOpen ? 'translateX(0)' : 'translateX(20px)',
                        transition: `all 0.3s ease-out ${index * 50}ms`
                      }}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-500 to-yellow-500 shadow-lg shadow-orange-500/20'
                          : 'bg-gray-700/50 group-hover:bg-gray-600/70 group-active:bg-gray-600'
                      }`}>
                        <Icon className="text-lg text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="text-lg font-semibold">{item.label}</span>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.href === '/crypto' && (t('navigation.dashboard') || 'Tableau de bord')}
                          {item.href === '/profile' && (t('navigation.profile') || 'Profil utilisateur')}
                          {item.href === '/settings' && (t('navigation.settings') || 'Paramètres')}
                        </div>
                      </div>
                      <div className={`transition-all duration-300 ${
                        isActive ? 'text-orange-400' : 'text-gray-600 group-hover:text-gray-400'
                      }`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Enhanced Menu Footer */}
            <div className="px-6 py-6 border-t border-gray-700/30 bg-gradient-to-r from-[#1a1d29]/50 to-[#151821]/50">
              <button
                onClick={signOut}
                className="flex items-center gap-4 px-5 py-4 w-full text-left rounded-2xl transition-all duration-300 text-gray-300 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 group active:scale-98 active:bg-red-500/20"
              >
                <div className="w-12 h-12 bg-gray-700/50 group-hover:bg-red-500/20 group-active:bg-red-500/30 rounded-xl flex items-center justify-center transition-all duration-300">
                  <FaSignOutAlt className="text-lg" />
                </div>
                <div className="flex-1">
                  <span className="text-lg font-semibold">{t('auth.disconnect') || 'Se déconnecter'}</span>
                  <div className="text-xs text-gray-500 mt-1">{t('auth.logoutDescription') || 'Fermer la session'}</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}