"use client"

import { useState, useEffect } from "react"
import { useUserData } from "../context/UserDataContext"
import { useLanguage } from "../context/LanguageContext"
import { useAuth } from "../context/AuthContext"
import AuthGuard from "../components/AuthGuard"
import SimpleToggle from "../components/UI/SimpleToggle"
import LanguageSettings from "../components/Settings/LanguageSettings"
import {
  FaCog,
  FaUser,
  FaBell,
  FaShieldAlt,
  FaPalette,
  FaSave,
  FaLock,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaMoon,
  FaSun,
  FaGlobe,
  FaDatabase,
  FaDownload,
  FaTrash,
  FaExclamationTriangle,
  FaCheck,
  FaCheckCircle,
  FaSpinner,
  FaSignOutAlt
} from "react-icons/fa"

function SettingsContent() {
  const { userData, updateUserSettings, loading } = useUserData()
  const { t, currentLanguage, previewLanguage, changeLanguage, previewLanguageChange, clearPreview } = useLanguage()
  const { signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [hasError, setHasError] = useState(false)
  const [settings, setSettings] = useState({
    // General
    username: '',
    email: '',
    language: 'fr',
    timezone: 'UTC',

    // Notifications
    priceAlerts: true,
    pushNotifications: false,
    emailNotifications: true,
    soundEnabled: true,

    // Security
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorAuth: false,

    // Appearance
    theme: 'dark',
    accentColor: 'orange',
    compactMode: false,
    animations: true,

    // Privacy
    analytics: true,
    dataSharing: false,
    profileVisibility: 'private'
  })

  // Load user data into settings
  useEffect(() => {
    try {
      if (userData) {
        setSettings({
          username: userData.username || '',
          email: userData.email || '',
          language: userData.language || currentLanguage || 'fr',
          timezone: userData.timezone || 'UTC',

          // Notifications
          priceAlerts: userData.notifications?.priceAlerts ?? true,
          pushNotifications: userData.notifications?.pushNotifications ?? false,
          emailNotifications: userData.notifications?.emailNotifications ?? true,
          soundEnabled: userData.notifications?.soundEnabled ?? true,

          // Security - passwords should remain empty
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          twoFactorAuth: false,

          // Appearance
          theme: userData.theme || 'dark',
          accentColor: 'orange',
          compactMode: false,
          animations: true,

          // Privacy
          analytics: userData.privacy?.analytics ?? true,
          dataSharing: userData.privacy?.dataSharing ?? false,
          profileVisibility: userData.privacy?.profileVisibility || 'private'
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setHasError(true)
    }
  }, [userData, currentLanguage])

  // Clear preview when leaving page without saving
  useEffect(() => {
    return () => {
      if (clearPreview) {
        clearPreview()
      }
    }
  }, [clearPreview])

  const tabs = [
    { id: 'general', name: t('settings.tabs.general'), icon: FaCog },
    { id: 'notifications', name: t('settings.tabs.notifications'), icon: FaBell },
    { id: 'security', name: t('settings.tabs.security'), icon: FaShieldAlt },
    { id: 'appearance', name: t('settings.tabs.appearance'), icon: FaPalette },
    { id: 'privacy', name: t('settings.tabs.privacy'), icon: FaLock },
    { id: 'data', name: t('settings.tabs.data'), icon: FaDatabase }
  ]

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))

    // Preview language changes without saving
    if (key === 'language') {
      // Use preview function instead of immediate change
      if (previewLanguageChange) {
        previewLanguageChange(value)
      }
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus(null)

    try {
      // Check if we have user data first
      if (!userData) {
        throw new Error('User data not available')
      }

      // Apply language change if it was previewed
      if (settings.language !== currentLanguage) {
        await changeLanguage(settings.language)
      }

      await updateUserSettings(settings)
      setSaveStatus('success')

      // Clear preview state
      if (clearPreview) {
        clearPreview()
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error) {
      console.error('Settings save error:', error)
      setSaveStatus('error')
      // Clear error message after 5 seconds
      setTimeout(() => setSaveStatus(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }


  const SettingRow = ({ icon: Icon, title, description, children }) => (
    <div className="flex items-center justify-between p-4 bg-[#212332] rounded-lg border border-gray-700/30">
      <div className="flex items-center gap-3 flex-1">
        {Icon && <Icon className="text-gray-400 text-sm" />}
        <div>
          <h4 className="text-white font-medium text-sm">{title}</h4>
          {description && <p className="text-gray-400 text-xs mt-1">{description}</p>}
        </div>
      </div>
      <div className="ml-4">
        {children}
      </div>
    </div>
  )

  // Error fallback
  if (hasError) {
    return (
        <div className="min-h-screen bg-[#212332] flex items-center justify-center p-6">
          <div className="text-center bg-red-500/10 border border-red-500/30 rounded-lg p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="text-red-400 text-2xl" />
            </div>
            <h3 className="text-red-400 text-xl font-semibold mb-2">Settings Error</h3>
            <p className="text-gray-300 mb-4">Unable to load settings page. Please try refreshing.</p>
            <button
              onClick={() => {
                setHasError(false)
                window.location.reload()
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
            >
              Refresh Page
            </button>
          </div>
        </div>
    )
  }

  return (
      <div className="p-6 animate-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        {/* Success/Error Messages */}
        {saveStatus && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
            saveStatus === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {saveStatus === 'success' ? (
              <>
                <FaCheckCircle className="text-sm" />
                {t('messages.settingsUpdated')}
              </>
            ) : (
              <>
                <FaExclamationTriangle className="text-sm" />
                {t('messages.settingsUpdateError')}
              </>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white mb-2">{t('settings.title')}</h1>
            <p className="text-gray-400">{t('settings.description')}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 hover:opacity-90 disabled:opacity-50 text-sm md:text-base font-semibold shadow-lg hover:shadow-xl active:scale-98 min-w-[140px] md:min-w-[180px] w-full md:w-auto"
          >
            {isSaving ? (
              <>
                <FaSpinner className="animate-spin text-base" />
                <span>{t('common.loading')}</span>
              </>
            ) : (
              <>
                <FaSave className="text-base" />
                <span>{t('settings.saveSettings')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1d29] border border-gray-700/50 rounded-lg p-4 animate-slide-in">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-2 py-2 sm:px-3 sm:py-2.5 rounded-lg text-left transition-all duration-200 text-sm sm:text-base ${
                      activeTab === tab.id
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-lg shadow-orange-500/10'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                    }`}
                  >
                    <Icon className="text-sm sm:text-base" />
                    <span className="truncate">{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-[#1a1d29] border border-gray-700/50 rounded-lg p-6 animate-slide-up">

            {/* General Settings */}
            {activeTab === 'general' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FaCog className="text-gray-400 text-lg" />
                  <h2 className="text-xl font-semibold text-white">{t('settings.general.title')}</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-white mb-4 border-b border-gray-700/50 pb-2">
                      {t('settings.general.accountInfo')}
                    </h3>
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          {t('profile.fields.username')}
                        </label>
                        <input
                          type="text"
                          value={settings.username}
                          onChange={(e) => handleSettingChange('username', e.target.value)}
                          className="w-full bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 ease-smooth hover:border-gray-500"
                          placeholder={t('profile.placeholders.username')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          {t('profile.fields.email')}
                        </label>
                        <input
                          type="email"
                          value={settings.email}
                          onChange={(e) => handleSettingChange('email', e.target.value)}
                          className="w-full bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 ease-smooth hover:border-gray-500"
                          placeholder={t('profile.placeholders.email')}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-white mb-4 border-b border-gray-700/50 pb-2">
                      {t('settings.general.regionalSettings')}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <LanguageSettings
                          value={previewLanguage || settings.language || currentLanguage}
                          onChange={(value) => handleSettingChange('language', value)}
                          disabled={isSaving}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          {t('settings.general.timezone')}
                        </label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => handleSettingChange('timezone', e.target.value)}
                          className="w-full bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 ease-smooth hover:border-gray-500"
                        >
                          <option value="UTC">{t('settings.general.timezones.UTC')}</option>
                          <option value="EST">{t('settings.general.timezones.EST')}</option>
                          <option value="PST">{t('settings.general.timezones.PST')}</option>
                          <option value="CET">{t('settings.general.timezones.CET')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FaBell className="text-blue-400 text-lg" />
                  <h2 className="text-xl font-semibold text-white">{t('settings.notifications.title')}</h2>
                </div>

                <div className="space-y-4">
                  <SettingRow
                    icon={FaBell}
                    title={t('settings.notifications.priceAlerts')}
                    description={t('settings.notifications.priceAlertsDesc')}
                  >
                    <SimpleToggle
                      enabled={settings.priceAlerts}
                      onChange={(value) => handleSettingChange('priceAlerts', value)}
                      aria-label="Toggle price alerts"
                    />
                  </SettingRow>

                  <SettingRow
                    title={t('settings.notifications.pushNotifications')}
                    description={t('settings.notifications.pushNotificationsDesc')}
                  >
                    <SimpleToggle
                      enabled={settings.pushNotifications}
                      onChange={(value) => handleSettingChange('pushNotifications', value)}
                      aria-label="Toggle push notifications"
                    />
                  </SettingRow>

                  <SettingRow
                    title={t('settings.notifications.emailNotifications')}
                    description={t('settings.notifications.emailNotificationsDesc')}
                  >
                    <SimpleToggle
                      enabled={settings.emailNotifications}
                      onChange={(value) => handleSettingChange('emailNotifications', value)}
                      aria-label="Toggle email notifications"
                    />
                  </SettingRow>

                  <SettingRow
                    title={t('settings.notifications.soundEffects')}
                    description={t('settings.notifications.soundEffectsDesc')}
                  >
                    <SimpleToggle
                      enabled={settings.soundEnabled}
                      onChange={(value) => handleSettingChange('soundEnabled', value)}
                      aria-label="Toggle sound effects"
                    />
                  </SettingRow>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FaShieldAlt className="text-green-400 text-lg" />
                  <h2 className="text-xl font-semibold text-white">{t('settings.security.title')}</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-white mb-4 border-b border-gray-700/50 pb-2">
                      {t('settings.security.passwordManagement')}
                    </h3>
                    <div className="bg-[#212332] rounded-lg p-4 border border-gray-700/30">
                      <div className="space-y-4">
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            {t('settings.security.currentPassword')}
                          </label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={settings.currentPassword}
                            onChange={(e) => handleSettingChange('currentPassword', e.target.value)}
                            placeholder={t('settings.security.currentPassword')}
                            className="w-full bg-[#1a1d29] border border-gray-600 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 ease-smooth hover:border-gray-500"
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-9 text-gray-400 hover:text-white transition-all duration-200 hover:opacity-80"
                          >
                            {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                          </button>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            {t('settings.security.newPassword')}
                          </label>
                          <input
                            type="password"
                            value={settings.newPassword}
                            onChange={(e) => handleSettingChange('newPassword', e.target.value)}
                            placeholder={t('settings.security.newPassword')}
                            className="w-full bg-[#1a1d29] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 ease-smooth hover:border-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            {t('settings.security.confirmNewPassword')}
                          </label>
                          <input
                            type="password"
                            value={settings.confirmPassword}
                            onChange={(e) => handleSettingChange('confirmPassword', e.target.value)}
                            placeholder={t('settings.security.confirmNewPassword')}
                            className="w-full bg-[#1a1d29] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 ease-smooth hover:border-gray-500"
                          />
                        </div>
                        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg transition-all duration-200 hover:opacity-90 text-sm font-medium w-full sm:w-auto min-h-[44px]">
                          {t('settings.security.updatePassword')}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-white mb-4 border-b border-gray-700/50 pb-2">
                      {t('settings.security.additionalSecurity')}
                    </h3>
                    <SettingRow
                      icon={FaKey}
                      title={t('settings.security.twoFactorAuth')}
                      description={t('settings.security.twoFactorAuthDesc')}
                    >
                      <SimpleToggle
                        enabled={settings.twoFactorAuth}
                        onChange={(value) => handleSettingChange('twoFactorAuth', value)}
                        aria-label="Toggle two-factor authentication"
                      />
                    </SettingRow>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FaPalette className="text-purple-400 text-lg" />
                  <h2 className="text-xl font-semibold text-white">{t('settings.appearance.title')}</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-white mb-4 border-b border-gray-700/50 pb-2">
                      {t('settings.appearance.themeSelection')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-4 border border-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700/10 bg-[#212332] transition-all duration-200 hover:border-gray-600">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={settings.theme === 'dark'}
                          onChange={(e) => handleSettingChange('theme', e.target.value)}
                          className="text-orange-500"
                        />
                        <FaMoon className="text-indigo-400" />
                        <span className="text-gray-300">{t('settings.appearance.darkMode')}</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 border border-gray-700/50 rounded-lg cursor-pointer opacity-50 bg-[#212332]">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          disabled
                          className="text-orange-500"
                        />
                        <FaSun className="text-yellow-400" />
                        <span className="text-gray-300">{t('settings.appearance.lightMode')}</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-white mb-4 border-b border-gray-700/50 pb-2">
                      {t('settings.appearance.displayOptions')}
                    </h3>
                    <div className="space-y-4">
                      <SettingRow
                        title={t('settings.appearance.compactMode')}
                        description={t('settings.appearance.compactModeDesc')}
                      >
                        <SimpleToggle
                          enabled={settings.compactMode}
                          onChange={(value) => handleSettingChange('compactMode', value)}
                          aria-label="Toggle compact mode"
                        />
                      </SettingRow>

                      <SettingRow
                        title={t('settings.appearance.animations')}
                        description={t('settings.appearance.animationsDesc')}
                      >
                        <SimpleToggle
                          enabled={settings.animations}
                          onChange={(value) => handleSettingChange('animations', value)}
                          aria-label="Toggle animations"
                        />
                      </SettingRow>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FaLock className="text-red-400 text-lg" />
                  <h2 className="text-xl font-semibold text-white">{t('settings.privacy.title')}</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-white mb-4 border-b border-gray-700/50 pb-2">
                      {t('settings.privacy.dataUsage')}
                    </h3>
                    <div className="space-y-4">
                      <SettingRow
                        title={t('settings.privacy.analytics')}
                        description={t('settings.privacy.analyticsDesc')}
                      >
                        <SimpleToggle
                          enabled={settings.analytics}
                          onChange={(value) => handleSettingChange('analytics', value)}
                          aria-label="Toggle analytics and performance data"
                        />
                      </SettingRow>

                      <SettingRow
                        title={t('settings.privacy.dataSharing')}
                        description={t('settings.privacy.dataSharingDesc')}
                      >
                        <SimpleToggle
                          enabled={settings.dataSharing}
                          onChange={(value) => handleSettingChange('dataSharing', value)}
                          aria-label="Toggle data sharing"
                        />
                      </SettingRow>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-white mb-4 border-b border-gray-700/50 pb-2">
                      {t('settings.privacy.profileVisibility')}
                    </h3>
                    <div className="bg-[#212332] rounded-lg p-4 border border-gray-700/30">
                      <div className="space-y-3">
                        {['public', 'friends', 'private'].map((visibility) => (
                          <label key={visibility} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="profileVisibility"
                              value={visibility}
                              checked={settings.profileVisibility === visibility}
                              onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                              className="text-orange-500"
                            />
                            <span className="text-gray-300 capitalize">{t(`settings.privacy.${visibility}`)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Storage */}
            {activeTab === 'data' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <FaDatabase className="text-yellow-400 text-lg" />
                  <h2 className="text-xl font-semibold text-white">{t('settings.data.title')}</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-white mb-4 border-b border-gray-700/50 pb-2">
                      {t('settings.data.dataManagement')}
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-[#212332] rounded-lg p-4 border border-gray-700/30">
                        <div className="flex items-start gap-3">
                          <FaDownload className="text-blue-400 text-lg mt-1" />
                          <div className="flex-1">
                            <h4 className="text-white font-medium mb-2">{t('settings.data.exportData')}</h4>
                            <p className="text-gray-400 text-sm mb-3">
                              {t('settings.data.exportDataDesc')}
                            </p>
                            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-all duration-200 hover:opacity-90 text-sm font-medium w-full sm:w-auto min-h-[44px]">
                              {t('settings.data.downloadData')}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#212332] rounded-lg p-4 border border-red-500/20">
                        <div className="flex items-start gap-3">
                          <FaExclamationTriangle className="text-red-400 text-lg mt-1" />
                          <div className="flex-1">
                            <h4 className="text-white font-medium mb-2">{t('settings.data.clearData')}</h4>
                            <p className="text-gray-400 text-sm mb-1">
                              {t('settings.data.clearDataDesc')}
                            </p>
                            <p className="text-red-400 text-sm mb-3">{t('settings.data.clearDataWarning')}</p>
                            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-all duration-200 hover:opacity-90 text-sm font-medium w-full sm:w-auto min-h-[44px]">
                              {t('settings.data.clearAllData')}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#212332] rounded-lg p-4 border border-red-500/20">
                        <div className="flex items-start gap-3">
                          <FaSignOutAlt className="text-red-400 text-lg mt-1" />
                          <div className="flex-1">
                            <h4 className="text-white font-medium mb-2">{t('auth.disconnect')}</h4>
                            <p className="text-gray-400 text-sm mb-3">
                              {t('auth.disconnectDescription') || 'Se déconnecter de votre session actuelle'}
                            </p>
                            <button
                              onClick={signOut}
                              className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-lg transition-all duration-200 hover:opacity-90 text-base font-semibold w-full sm:w-auto min-h-[50px] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-98"
                            >
                              <FaSignOutAlt className="text-sm" />
                              {t('auth.disconnect')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  return (
    <AuthGuard redirectTo="/">
      <SettingsContent />
    </AuthGuard>
  )
}