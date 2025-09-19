"use client"
import React, { useState, useEffect } from 'react'
import { useCryptoPerformance } from '../../context/CryptoPerformanceContext'

const PerformanceMonitor = ({ isVisible = false }) => {
  const {
    performanceData,
    optimizationHistory,
    timePeriod
  } = useCryptoPerformance()

  const [isExpanded, setIsExpanded] = useState(false)

  if (!isVisible) return null

  const getPerformanceColor = (value, type) => {
    if (type === 'cacheHitRate') {
      if (value >= 0.8) return 'text-green-400'
      if (value >= 0.6) return 'text-yellow-400'
      return 'text-red-400'
    }
    if (type === 'responseTime') {
      if (value <= 500) return 'text-green-400'
      if (value <= 1000) return 'text-yellow-400'
      return 'text-red-400'
    }
    return 'text-gray-400'
  }

  const formatResponseTime = (ms) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-gradient-to-r from-[#2a2d3e] to-[#252837] border border-gray-600/30 rounded-2xl shadow-2xl transition-all duration-300 ${
        isExpanded ? 'w-80 h-auto' : 'w-16 h-16'
      }`}>

        {/* Collapsed View */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full h-full flex items-center justify-center text-white hover:bg-gray-700/20 rounded-2xl transition-colors"
          >
            <div className="flex flex-col items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                performanceData.averageResponseTime <= 500 ? 'bg-green-400' :
                performanceData.averageResponseTime <= 1000 ? 'bg-yellow-400' : 'bg-red-400'
              }`}></div>
              <span className="text-xs">⚡</span>
            </div>
          </button>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">Performance Monitor</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Metrics */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Response Time</span>
                <span className={`text-xs font-medium ${getPerformanceColor(performanceData.averageResponseTime, 'responseTime')}`}>
                  {formatResponseTime(performanceData.averageResponseTime)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Cache Hit Rate</span>
                <span className={`text-xs font-medium ${getPerformanceColor(performanceData.cacheHitRate, 'cacheHitRate')}`}>
                  {Math.round(performanceData.cacheHitRate * 100)}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">API Calls</span>
                <span className="text-xs font-medium text-blue-400">
                  {performanceData.apiCallCount}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Time Period</span>
                <span className="text-xs font-medium text-purple-400">
                  {timePeriod}
                </span>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-2 mb-4">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Cache Efficiency</span>
                  <span>{Math.round(performanceData.cacheHitRate * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      performanceData.cacheHitRate >= 0.8 ? 'bg-green-400' :
                      performanceData.cacheHitRate >= 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(100, performanceData.cacheHitRate * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Response Speed</span>
                  <span>{performanceData.averageResponseTime <= 500 ? 'Fast' : performanceData.averageResponseTime <= 1000 ? 'Medium' : 'Slow'}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      performanceData.averageResponseTime <= 500 ? 'bg-green-400' :
                      performanceData.averageResponseTime <= 1000 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{
                      width: `${Math.max(10, Math.min(100, 100 - (performanceData.averageResponseTime / 20)))}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Recent Optimizations */}
            {optimizationHistory.length > 0 && (
              <div>
                <h4 className="text-gray-400 text-xs font-medium mb-2">Recent Optimizations</h4>
                <div className="space-y-1 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
                  {optimizationHistory.slice(-3).map((optimization, index) => (
                    <div key={index} className="text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <span className="text-green-400">✓</span>
                        <span className="truncate">
                          {optimization.actions[0] || 'Performance optimized'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-4 pt-3 border-t border-gray-600/30">
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs px-2 py-1 rounded transition-colors"
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </button>
                <button
                  className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs px-2 py-1 rounded transition-colors"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.performance) {
                      console.log('Performance entries:', window.performance.getEntriesByType('measure'))
                    }
                  }}
                >
                  Debug
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PerformanceMonitor