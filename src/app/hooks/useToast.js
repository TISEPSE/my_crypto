import { useState, useCallback } from 'react'

export function useToast() {
  const [toast, setToast] = useState({
    message: '',
    type: 'success', // 'success', 'error', 'warning', 'info'
    isVisible: false,
    needsAuth: false
  })

  const showToast = useCallback((message, type = 'success', needsAuth = false) => {
    setToast({
      message,
      type,
      isVisible: true,
      needsAuth
    })

    // Auto-hide après 3 secondes
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }))
    }, 3000)
  }, [])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }, [])

  return {
    toast,
    showToast,
    hideToast
  }
}