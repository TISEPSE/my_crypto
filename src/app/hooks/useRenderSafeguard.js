import { useRef, useEffect } from 'react'

/**
 * Development hook to detect potential infinite render loops
 * Automatically warns when a component renders too frequently
 */
export function useRenderSafeguard(componentName = 'Component', maxRenders = 50) {
  const renderCount = useRef(0)
  const lastResetTime = useRef(Date.now())

  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  renderCount.current++

  // Reset counter every 10 seconds
  const now = Date.now()
  if (now - lastResetTime.current > 10000) {
    renderCount.current = 1
    lastResetTime.current = now
  }

  // Warn if too many renders
  if (renderCount.current === maxRenders) {
    console.warn(
      `🚨 RENDER LOOP WARNING: ${componentName} has rendered ${maxRenders} times in 10 seconds. ` +
      'This might indicate an infinite loop. Check useEffect dependencies and memoization.'
    )
  }

  // Error if critical threshold
  if (renderCount.current === maxRenders * 2) {
    console.error(
      `🔥 CRITICAL: ${componentName} has rendered ${maxRenders * 2} times! ` +
      'Infinite loop detected. Check component dependencies immediately.'
    )
  }

  // Auto-reset if way too many renders
  if (renderCount.current > maxRenders * 3) {
    renderCount.current = 1
    lastResetTime.current = now
    console.error(
      `💥 EMERGENCY RESET: ${componentName} render count reset due to extreme loop.`
    )
  }
}

/**
 * Hook to monitor specific state changes for loops
 */
export function useStateChangeMonitor(stateName, stateValue, maxChanges = 20) {
  const changeCount = useRef(0)
  const lastValue = useRef(stateValue)
  const lastResetTime = useRef(Date.now())

  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  // Detect state change
  if (lastValue.current !== stateValue) {
    changeCount.current++
    lastValue.current = stateValue
  }

  // Reset counter every 5 seconds
  const now = Date.now()
  if (now - lastResetTime.current > 5000) {
    changeCount.current = 0
    lastResetTime.current = now
  }

  // Warn if too many state changes
  if (changeCount.current === maxChanges) {
    console.warn(
      `🔄 STATE LOOP WARNING: "${stateName}" has changed ${maxChanges} times in 5 seconds. ` +
      'Current value:', stateValue
    )
  }
}