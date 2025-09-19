import { useState, useCallback, useRef, useEffect } from 'react'

// Fallback data for when APIs fail
const FALLBACK_CRYPTO_DATA = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    current_price: 45000,
    market_cap: 850000000000,
    market_cap_rank: 1,
    price_change_percentage_24h: 2.5,
    total_volume: 25000000000,
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    current_price: 3200,
    market_cap: 380000000000,
    market_cap_rank: 2,
    price_change_percentage_24h: 1.8,
    total_volume: 15000000000,
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
  }
]

// Error classification for better handling
const ERROR_TYPES = {
  NETWORK: 'network',
  RATE_LIMIT: 'rate_limit',
  SERVER: 'server',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown'
}

const classifyError = (error) => {
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return ERROR_TYPES.TIMEOUT
  }
  if (error.message.includes('429') || error.message.includes('rate limit')) {
    return ERROR_TYPES.RATE_LIMIT
  }
  if (error.message.includes('5')) {
    return ERROR_TYPES.SERVER
  }
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return ERROR_TYPES.NETWORK
  }
  return ERROR_TYPES.UNKNOWN
}

// Circuit breaker pattern for API reliability
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5
    this.recoveryTimeout = options.recoveryTimeout || 60000 // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 120000 // 2 minutes

    this.state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0
    this.lastFailureTime = null
    this.nextAttempt = null
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  onSuccess() {
    this.failureCount = 0
    this.state = 'CLOSED'
  }

  onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.recoveryTimeout
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.nextAttempt
    }
  }
}

export function useCryptoFallback() {
  const [fallbackData, setFallbackData] = useState(null)
  const [errorHistory, setErrorHistory] = useState([])
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const circuitBreaker = useRef(new CircuitBreaker({
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
    monitoringPeriod: 60000  // 1 minute
  }))

  // Store successful responses for fallback
  const cacheFallbackData = useCallback((data) => {
    if (data && Array.isArray(data) && data.length > 0) {
      const fallbackCache = {
        data: data.slice(0, 20), // Store top 20 for fallback
        timestamp: Date.now(),
        source: 'api_cache'
      }

      setFallbackData(fallbackCache)
      localStorage.setItem('crypto_fallback_cache', JSON.stringify(fallbackCache))
    }
  }, [])

  // Load cached fallback data on mount
  useEffect(() => {
    const cached = localStorage.getItem('crypto_fallback_cache')
    if (cached) {
      try {
        const parsedCache = JSON.parse(cached)
        const age = Date.now() - parsedCache.timestamp

        // Use cached data if less than 1 hour old
        if (age < 3600000) {
          setFallbackData(parsedCache)
        }
      } catch (error) {
        console.warn('Failed to load fallback cache:', error)
      }
    }
  }, [])

  // Enhanced error handling with fallback strategies
  const handleError = useCallback(async (error, retryFn) => {
    const errorType = classifyError(error)
    const errorRecord = {
      type: errorType,
      message: error.message,
      timestamp: Date.now(),
      retryable: errorType !== ERROR_TYPES.RATE_LIMIT
    }

    setErrorHistory(prev => [...prev.slice(-9), errorRecord])

    let fallbackStrategy = 'none'
    let fallbackResult = null

    try {
      switch (errorType) {
        case ERROR_TYPES.RATE_LIMIT:
          fallbackStrategy = 'cached_data'
          fallbackResult = await getFallbackData('cache')
          break

        case ERROR_TYPES.TIMEOUT:
        case ERROR_TYPES.NETWORK:
          fallbackStrategy = 'retry_with_fallback'
          // Try once more with longer timeout
          try {
            fallbackResult = await circuitBreaker.current.execute(retryFn)
          } catch (retryError) {
            fallbackResult = await getFallbackData('cache_or_default')
          }
          break

        case ERROR_TYPES.SERVER:
          fallbackStrategy = 'fallback_data'
          fallbackResult = await getFallbackData('cache_or_default')
          break

        default:
          fallbackStrategy = 'default_data'
          fallbackResult = await getFallbackData('default')
      }

      if (fallbackResult) {
        setIsUsingFallback(true)
        return {
          success: true,
          data: fallbackResult.data,
          fallback: true,
          strategy: fallbackStrategy,
          source: fallbackResult.source
        }
      }

    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
    }

    return {
      success: false,
      error: errorRecord,
      fallback: false,
      strategy: 'none'
    }
  }, [])

  // Get fallback data with different strategies
  const getFallbackData = useCallback(async (strategy) => {
    switch (strategy) {
      case 'cache':
        if (fallbackData && fallbackData.data) {
          return {
            data: fallbackData.data,
            source: 'cache',
            timestamp: fallbackData.timestamp
          }
        }
        break

      case 'cache_or_default':
        if (fallbackData && fallbackData.data) {
          return {
            data: fallbackData.data,
            source: 'cache',
            timestamp: fallbackData.timestamp
          }
        }
        // Fall through to default

      case 'default':
        return {
          data: FALLBACK_CRYPTO_DATA,
          source: 'default',
          timestamp: Date.now()
        }

      default:
        return null
    }
  }, [fallbackData])

  // Recovery mechanism
  const attemptRecovery = useCallback(async (originalFetchFn) => {
    const circuitState = circuitBreaker.current.getState()

    if (circuitState.state === 'OPEN') {
      return {
        success: false,
        message: 'Circuit breaker is open, waiting for recovery window'
      }
    }

    try {
      const result = await circuitBreaker.current.execute(originalFetchFn)
      setIsUsingFallback(false)
      return {
        success: true,
        data: result,
        recovered: true
      }
    } catch (error) {
      return await handleError(error, originalFetchFn)
    }
  }, [handleError])

  // Performance insights based on error patterns (memoized to prevent loops)
  const getPerformanceInsights = useCallback(() => {
    if (errorHistory.length === 0) return []

    const recentErrors = errorHistory.slice(-10)
    const errorsByType = recentErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    }, {})

    const insights = []

    if (errorsByType[ERROR_TYPES.RATE_LIMIT] > 2) {
      insights.push({
        type: 'optimization',
        message: 'Consider implementing request throttling',
        priority: 'high'
      })
    }

    if (errorsByType[ERROR_TYPES.TIMEOUT] > 3) {
      insights.push({
        type: 'performance',
        message: 'Network timeouts detected, consider caching optimization',
        priority: 'medium'
      })
    }

    if (isUsingFallback) {
      insights.push({
        type: 'status',
        message: 'Currently using fallback data',
        priority: 'info'
      })
    }

    return insights
  }, [errorHistory.length, isUsingFallback])

  return {
    // Error handling
    handleError,
    errorHistory,
    getPerformanceInsights,

    // Fallback management
    fallbackData,
    isUsingFallback,
    cacheFallbackData,
    getFallbackData,

    // Recovery
    attemptRecovery,
    circuitBreakerState: circuitBreaker.current.getState(),

    // Utils
    classifyError,
    ERROR_TYPES
  }
}