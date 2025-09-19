"use client"
import React from 'react'
import { FaGlobe, FaCheck, FaInfoCircle, FaEye } from 'react-icons/fa'
import { useLanguage } from '../../context/LanguageContext'

export default function LanguageSettings({ value, onChange, disabled = false }) {
  const { availableLanguages, t, currentLanguage, previewLanguage } = useLanguage()

  const handleLanguageSelect = (languageCode) => {
    if (!disabled && onChange) {
      onChange(languageCode)
    }
  }

  // Determine which language is currently being previewed
  const isPreviewActive = previewLanguage && previewLanguage !== currentLanguage

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <FaGlobe className="text-gray-400 text-lg" />
        <h3 className="text-base font-medium text-white">{t('settings.general.language')}</h3>
        {isPreviewActive && (
          <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <FaEye className="text-blue-400 text-xs" />
            <span className="text-blue-400 text-xs font-medium">Preview</span>
          </div>
        )}
      </div>

      <div className="grid gap-3">
        {availableLanguages.map((language) => {
          const isSelected = value === language.code
          const isCurrent = language.code === currentLanguage
          const isPreviewSelected = language.code === previewLanguage

          return (
            <label
              key={language.code}
              className={`
                flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-200 relative
                ${disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-gray-700/20'
                }
                ${isSelected
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : 'bg-[#212332] border-gray-700/50 text-gray-300 hover:border-gray-600'
                }
                ${isPreviewSelected && !isSelected
                  ? 'ring-2 ring-blue-400/50'
                  : ''
                }
              `}
            >
              <input
                type="radio"
                name="language"
                value={language.code}
                checked={isSelected}
                onChange={() => handleLanguageSelect(language.code)}
                disabled={disabled}
                className="sr-only"
              />

              {/* Flag Icon */}
              <div className="text-xl">
                {language.code === 'fr' ? '🇫🇷' : '🇺🇸'}
              </div>

              {/* Language Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-sm">
                    {language.nativeName}
                  </div>
                  {isCurrent && !isPreviewActive && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
                      Current
                    </span>
                  )}
                  {isPreviewSelected && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                      Previewing
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {language.name}
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                  <FaCheck className="text-white text-xs" />
                </div>
              )}
            </label>
          )
        })}
      </div>

      {/* Enhanced Info Section */}
      <div className={`rounded-lg p-4 border transition-all duration-300 ${
        isPreviewActive
          ? 'bg-blue-500/5 border-blue-500/20'
          : 'bg-gray-700/20 border-gray-700/30'
      }`}>
        <div className="flex items-start gap-3">
          <FaInfoCircle className={`text-sm mt-0.5 ${
            isPreviewActive ? 'text-blue-400' : 'text-gray-400'
          }`} />
          <div className="space-y-2 text-sm">
            <div className={isPreviewActive ? 'text-blue-300' : 'text-gray-400'}>
              {isPreviewActive
                ? t('settings.general.languagePreviewActive')
                : t('settings.general.languagePreviewNote')
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}