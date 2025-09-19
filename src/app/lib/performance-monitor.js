// Performance monitoring utilities for crypto dashboard

// Request performance tracking
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.requestCount = 0
    this.errorCount = 0
    this.slowQueries = []
    this.maxSlowQueries = 100

    // Clean up old metrics every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000)
  }

  // Track API endpoint performance
  trackRequest(endpoint, duration, success = true, metadata = {}) {
    this.requestCount++
    if (!success) this.errorCount++

    const key = endpoint
    const existing = this.metrics.get(key) || {
      count: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: 0,
      recentTimes: []
    }

    existing.count++
    existing.totalTime += duration
    existing.minTime = Math.min(existing.minTime, duration)
    existing.maxTime = Math.max(existing.maxTime, duration)
    if (!success) existing.errors++

    // Keep track of recent response times (last 50)
    existing.recentTimes.push(duration)
    if (existing.recentTimes.length > 50) {
      existing.recentTimes.shift()
    }

    this.metrics.set(key, existing)

    // Track slow queries
    if (duration > 1000) { // > 1 second
      this.slowQueries.push({
        endpoint,
        duration,
        timestamp: new Date().toISOString(),
        metadata
      })

      // Limit slow queries storage
      if (this.slowQueries.length > this.maxSlowQueries) {
        this.slowQueries.shift()
      }
    }
  }

  // Get performance statistics
  getStats() {
    const stats = {
      overview: {
        totalRequests: this.requestCount,
        totalErrors: this.errorCount,
        errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%',
        averageResponseTime: this.getOverallAverageTime() + 'ms'
      },
      endpoints: {},
      slowQueries: this.slowQueries.slice(-20), // Last 20 slow queries
      alerts: this.generateAlerts()
    }

    for (const [endpoint, data] of this.metrics.entries()) {
      const avgTime = data.count > 0 ? Math.round(data.totalTime / data.count) : 0
      const errorRate = data.count > 0 ? (data.errors / data.count * 100).toFixed(2) : '0'

      stats.endpoints[endpoint] = {
        requestCount: data.count,
        averageTime: avgTime + 'ms',
        minTime: data.minTime === Infinity ? 0 : data.minTime + 'ms',
        maxTime: data.maxTime + 'ms',
        errorRate: errorRate + '%',
        recentAverage: this.calculateRecentAverage(data.recentTimes) + 'ms'
      }
    }

    return stats
  }

  // Generate performance alerts
  generateAlerts() {
    const alerts = []

    // High error rate alert
    if (this.requestCount > 10 && (this.errorCount / this.requestCount) > 0.1) {
      alerts.push({
        type: 'error_rate',
        severity: 'high',
        message: `Error rate is ${(this.errorCount / this.requestCount * 100).toFixed(1)}% (>${this.errorCount} errors from ${this.requestCount} requests)`
      })
    }

    // Slow endpoint alerts
    for (const [endpoint, data] of this.metrics.entries()) {
      const avgTime = data.count > 0 ? data.totalTime / data.count : 0

      if (avgTime > 2000) { // > 2 seconds average
        alerts.push({
          type: 'slow_endpoint',
          severity: 'medium',
          message: `Endpoint ${endpoint} has high average response time: ${Math.round(avgTime)}ms`
        })
      }

      if (data.count > 5 && (data.errors / data.count) > 0.2) {
        alerts.push({
          type: 'endpoint_errors',
          severity: 'high',
          message: `Endpoint ${endpoint} has high error rate: ${(data.errors / data.count * 100).toFixed(1)}%`
        })
      }
    }

    return alerts
  }

  calculateRecentAverage(times) {
    if (times.length === 0) return 0
    return Math.round(times.reduce((sum, time) => sum + time, 0) / times.length)
  }

  getOverallAverageTime() {
    if (this.metrics.size === 0) return 0

    let totalTime = 0
    let totalCount = 0

    for (const data of this.metrics.values()) {
      totalTime += data.totalTime
      totalCount += data.count
    }

    return totalCount > 0 ? Math.round(totalTime / totalCount) : 0
  }

  cleanup() {
    // Reset counters if they get too high
    if (this.requestCount > 10000) {
      this.requestCount = Math.floor(this.requestCount * 0.1)
      this.errorCount = Math.floor(this.errorCount * 0.1)

      // Scale down metrics
      for (const [key, data] of this.metrics.entries()) {
        data.count = Math.floor(data.count * 0.1)
        data.totalTime = Math.floor(data.totalTime * 0.1)
        data.errors = Math.floor(data.errors * 0.1)
        this.metrics.set(key, data)
      }
    }

    // Clear old slow queries
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    this.slowQueries = this.slowQueries.filter(query =>
      new Date(query.timestamp) > oneHourAgo
    )
  }

  reset() {
    this.metrics.clear()
    this.requestCount = 0
    this.errorCount = 0
    this.slowQueries = []
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Database performance monitoring
export class DatabasePerformanceMonitor {
  constructor() {
    this.operations = new Map()
    this.cacheHits = 0
    this.cacheMisses = 0
    this.totalFileReads = 0
    this.totalFileWrites = 0
    this.lockWaits = []
  }

  trackOperation(operation, duration, cached = false) {
    if (cached) {
      this.cacheHits++
    } else {
      this.cacheMisses++
    }

    const existing = this.operations.get(operation) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      cached: 0,
      uncached: 0
    }

    existing.count++
    existing.totalTime += duration
    existing.avgTime = Math.round(existing.totalTime / existing.count)

    if (cached) {
      existing.cached++
    } else {
      existing.uncached++
    }

    this.operations.set(operation, existing)
  }

  trackFileOperation(type) {
    if (type === 'read') {
      this.totalFileReads++
    } else if (type === 'write') {
      this.totalFileWrites++
    }
  }

  trackLockWait(filePath, waitTime) {
    this.lockWaits.push({
      filePath,
      waitTime,
      timestamp: new Date().toISOString()
    })

    // Keep only recent lock waits
    if (this.lockWaits.length > 100) {
      this.lockWaits.shift()
    }
  }

  getStats() {
    const totalCacheRequests = this.cacheHits + this.cacheMisses
    const cacheHitRate = totalCacheRequests > 0
      ? ((this.cacheHits / totalCacheRequests) * 100).toFixed(1)
      : '0'

    const stats = {
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: cacheHitRate + '%',
        totalRequests: totalCacheRequests
      },
      fileOperations: {
        reads: this.totalFileReads,
        writes: this.totalFileWrites,
        total: this.totalFileReads + this.totalFileWrites
      },
      operations: {},
      locks: {
        totalWaits: this.lockWaits.length,
        recentWaits: this.lockWaits.slice(-10),
        avgWaitTime: this.getAverageLockWait() + 'ms'
      }
    }

    for (const [operation, data] of this.operations.entries()) {
      const cacheEfficiency = data.count > 0
        ? ((data.cached / data.count) * 100).toFixed(1)
        : '0'

      stats.operations[operation] = {
        totalCalls: data.count,
        averageTime: data.avgTime + 'ms',
        cachedCalls: data.cached,
        uncachedCalls: data.uncached,
        cacheEfficiency: cacheEfficiency + '%'
      }
    }

    return stats
  }

  getAverageLockWait() {
    if (this.lockWaits.length === 0) return 0

    const total = this.lockWaits.reduce((sum, wait) => sum + wait.waitTime, 0)
    return Math.round(total / this.lockWaits.length)
  }

  reset() {
    this.operations.clear()
    this.cacheHits = 0
    this.cacheMisses = 0
    this.totalFileReads = 0
    this.totalFileWrites = 0
    this.lockWaits = []
  }
}

// Global database performance monitor
export const dbPerformanceMonitor = new DatabasePerformanceMonitor()

// Rate limiter for API endpoints
export class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
    this.requests = new Map()

    // Cleanup old entries
    setInterval(() => this.cleanup(), windowMs)
  }

  checkLimit(identifier) {
    const now = Date.now()
    const windowStart = now - this.windowMs

    const userRequests = this.requests.get(identifier) || []

    // Filter out old requests
    const validRequests = userRequests.filter(time => time > windowStart)

    if (validRequests.length >= this.maxRequests) {
      return false
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(identifier, validRequests)

    return true
  }

  cleanup() {
    const now = Date.now()
    const windowStart = now - this.windowMs

    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => time > windowStart)

      if (validRequests.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, validRequests)
      }
    }
  }

  getStats() {
    return {
      activeUsers: this.requests.size,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests,
      totalTrackedRequests: Array.from(this.requests.values())
        .reduce((sum, requests) => sum + requests.length, 0)
    }
  }
}

// Create rate limiters for different endpoints
export const rateLimiters = {
  auth: new RateLimiter(60 * 1000, 5), // 5 requests per minute for auth
  general: new RateLimiter(60 * 1000, 60), // 60 requests per minute for general APIs
  favorites: new RateLimiter(60 * 1000, 30), // 30 requests per minute for favorites
  passwordChange: new RateLimiter(60 * 1000, 3) // 3 requests per minute for password changes
}

// Middleware helper for performance tracking
export function withPerformanceTracking(handler, endpoint) {
  return async (request) => {
    const startTime = Date.now()
    let success = true
    let response

    try {
      response = await handler(request)
      success = response.status < 400
    } catch (error) {
      success = false
      throw error
    } finally {
      const duration = Date.now() - startTime
      performanceMonitor.trackRequest(endpoint, duration, success)
    }

    return response
  }
}

// Middleware helper for rate limiting
export function withRateLimit(handler, limiterKey, identifier) {
  return async (request) => {
    const rateLimiter = rateLimiters[limiterKey] || rateLimiters.general

    if (!rateLimiter.checkLimit(identifier)) {
      return new Response(JSON.stringify({
        error: 'Trop de requêtes. Veuillez réessayer plus tard.',
        rateLimitExceeded: true
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return await handler(request)
  }
}