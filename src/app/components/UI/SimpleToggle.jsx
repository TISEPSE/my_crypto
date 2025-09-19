"use client"

import React from 'react'

/**
 * Simple, uniform toggle switch component
 * @param {boolean} enabled - Whether the toggle is on/off
 * @param {function} onChange - Callback when toggle state changes
 * @param {boolean} disabled - Whether the toggle is disabled
 * @param {string} size - Size variant: 'sm', 'md', 'lg'
 * @param {string} ariaLabel - Accessibility label
 * @param {string} id - Component ID
 */
const SimpleToggle = ({
  enabled = false,
  onChange,
  disabled = false,
  size = 'md',
  'aria-label': ariaLabel,
  id
}) => {
  // Size configurations
  const sizes = {
    sm: {
      track: 'w-8 h-5',
      thumb: 'w-3.5 h-3.5 top-0.5 left-0.5',
      translateX: 'translate-x-3.5'
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5 top-0.5 left-0.5',
      translateX: 'translate-x-5'
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6 top-0.5 left-0.5',
      translateX: 'translate-x-7'
    }
  }

  const sizeConfig = sizes[size]

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!enabled)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <div
      role="switch"
      aria-checked={enabled}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      id={id}
      className={`
        relative inline-flex items-center select-none
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer focus:outline-none'}
      `}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      {/* Track */}
      <div className={`
        relative ${sizeConfig.track} rounded-full
        transition-colors duration-200 ease-in-out
        ${enabled
          ? 'bg-blue-500'
          : 'bg-gray-600'
        }
        ${!disabled && enabled && 'hover:bg-blue-600'}
        ${!disabled && !enabled && 'hover:bg-gray-500'}
        ${!disabled && 'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-800'}
      `}>

        {/* Toggle thumb */}
        <div className={`
          absolute ${sizeConfig.thumb} bg-white rounded-full shadow-sm
          transform transition-transform duration-200 ease-in-out
          ${enabled ? sizeConfig.translateX : 'translate-x-0'}
        `} />
      </div>
    </div>
  )
}

export default SimpleToggle