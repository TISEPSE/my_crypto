"use client"
import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

export default function PageTransition({ children }) {
  const [animationClass, setAnimationClass] = useState('')
  const [displayChildren, setDisplayChildren] = useState(children)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const isFirstRender = useRef(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Skip animation on first render to avoid hydration issues
    if (isFirstRender.current) {
      isFirstRender.current = false
      setDisplayChildren(children)
      return
    }

    // Only animate if component is mounted (client-side)
    if (!mounted) return

    // Démarrer l'animation de sortie
    setAnimationClass('page-transition-exit')
    
    // Attendre que l'animation de sortie se termine
    const exitTimeout = setTimeout(() => {
      setDisplayChildren(children)
      
      // Démarrer l'animation d'entrée
      setTimeout(() => {
        setAnimationClass('page-transition-enter')
        
        // Nettoyer la classe d'animation après l'entrée
        setTimeout(() => {
          setAnimationClass('')
        }, 300)
      }, 20)
    }, 200)

    return () => clearTimeout(exitTimeout)
  }, [pathname, children, mounted])

  // Render without animation class during SSR
  if (!mounted) {
    return (
      <div className="relative w-full h-full">
        <div className="w-full h-full">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div className={`w-full h-full ${animationClass}`}>
        {displayChildren}
      </div>
    </div>
  )
}