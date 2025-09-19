"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useUserData } from "../context/UserDataContext"
import { useLanguage } from "../context/LanguageContext"
import AuthGuard from "../components/AuthGuard"
import {
  FaUser,
  FaEnvelope,
  FaSignOutAlt,
  FaSpinner,
  FaCalendarAlt,
  FaShieldAlt,
  FaEdit,
  FaPhone,
  FaMapMarkerAlt,
  FaGlobe,
  FaBriefcase,
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa"

export default function Profile() {
  const { user, signOut } = useAuth()
  const { userData, updateUserData, loading } = useUserData()
  const { t } = useLanguage()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'success', 'error', null
  const [hasMounted, setHasMounted] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    company: '',
    website: ''
  })

  // Set mounted state
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Update form data when userData changes
  useEffect(() => {
    try {
      if (userData) {
        setFormData({
          username: userData.username || '',
          email: userData.email || '',
          phone: userData.phone || '',
          location: userData.location || '',
          bio: userData.bio || '',
          company: userData.company || '',
          website: userData.website || ''
        })
      }
    } catch (error) {
      console.error('Error updating form data:', error)
      setHasError(true)
    }
  }, [userData])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return t('profile.notSpecified')
    if (typeof window === 'undefined') return t('profile.notSpecified') // Server-side fallback
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return t('profile.notSpecified')
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus(null)

    try {
      // Validate required fields
      if (!formData.username.trim()) {
        throw new Error(t('messages.profileUpdateError'))
      }

      await updateUserData(formData)
      setSaveStatus('success')
      setIsEditing(false)

      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error) {
      console.error('Profile save error:', error)
      setSaveStatus('error')
      // Clear error message after 5 seconds
      setTimeout(() => setSaveStatus(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to current userData
    if (userData) {
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        phone: userData.phone || '',
        location: userData.location || '',
        bio: userData.bio || '',
        company: userData.company || '',
        website: userData.website || ''
      })
    }
    setIsEditing(false)
    setSaveStatus(null)
  }

  // Error fallback
  if (hasError) {
    return (
        <div className="min-h-screen bg-[#212332] flex items-center justify-center p-6">
          <div className="text-center bg-red-500/10 border border-red-500/30 rounded-lg p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="text-red-400 text-2xl" />
            </div>
            <h3 className="text-red-400 text-xl font-semibold mb-2">Profile Error</h3>
            <p className="text-gray-300 mb-4">Unable to load profile page. Please try refreshing.</p>
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
    <AuthGuard redirectTo="/">
      <div className="p-6">
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
                {t('messages.profileUpdated')}
              </>
            ) : (
              <>
                <FaExclamationTriangle className="text-sm" />
                {t('messages.profileUpdateError')}
              </>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white mb-2">{t('profile.title')}</h1>
            <p className="text-gray-400">{t('profile.description')}</p>
          </div>
          {isEditing && (
            <div className="flex items-center gap-3">
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
                    <span>{t('common.save')}</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving || loading}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 hover:opacity-90 text-sm md:text-base font-semibold shadow-lg hover:shadow-xl active:scale-98 min-w-[140px] md:min-w-[180px] w-full md:w-auto"
              >
                <FaTimes className="text-base" />
                <span>{t('common.cancel')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Summary */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1d29] border border-gray-700/50 rounded-lg p-6">
            {/* Avatar Section */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUser className="text-white text-2xl" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-1" suppressHydrationWarning={true}>
                {userData?.username || userData?.email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-gray-400 text-sm" suppressHydrationWarning={true}>{formData.company || t('profile.cryptoTrader')}</p>
            </div>

            {/* Quick Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-gray-300">
                <FaEnvelope className="text-gray-400 text-sm w-4" />
                <span className="text-sm" suppressHydrationWarning={true}>{userData?.email || t('profile.notSpecified')}</span>
              </div>
              {formData.location && (
                <div className="flex items-center gap-3 text-gray-300">
                  <FaMapMarkerAlt className="text-gray-400 text-sm w-4" />
                  <span className="text-sm">{formData.location}</span>
                </div>
              )}
              {formData.phone && (
                <div className="flex items-center gap-3 text-gray-300">
                  <FaPhone className="text-gray-400 text-sm w-4" />
                  <span className="text-sm">{formData.phone}</span>
                </div>
              )}
            </div>

            {/* Account Status */}
            <div className="border-t border-gray-700/50 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <FaShieldAlt className="text-green-400 text-sm" />
                <span className="text-sm font-medium text-white">{t('profile.accountStatus')}</span>
              </div>
              <p className="text-green-400 text-sm">{t('profile.activeVerified')}</p>

              {user?.createdAt && hasMounted && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FaCalendarAlt className="text-gray-400 text-sm" />
                    <span className="text-sm text-gray-400">{t('profile.memberSince')}</span>
                  </div>
                  <p className="text-sm text-gray-300" suppressHydrationWarning={true}>
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Edit Profile Button */}
            {!isEditing && (
              <div className="mt-6 pt-4 border-t border-gray-700/50">
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 hover:opacity-90 disabled:opacity-50 text-sm font-semibold shadow-lg hover:shadow-xl active:scale-98"
                >
                  <FaEdit className="text-base" />
                  <span>{t('profile.editProfile')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Profile Details */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1d29] border border-gray-700/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6">{t('profile.accountInfo')}</h3>

            <div className="space-y-6">
              {/* Personal Information Section */}
              <div>
                <h4 className="text-base font-medium text-white mb-4 border-b border-gray-700/50 pb-2">
                  {t('profile.personalInfo')}
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      {t('profile.fields.username')}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={t('profile.placeholders.username')}
                      />
                    ) : (
                      <div className="bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white">
                        {formData.username || t('profile.notSpecified')}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      {t('profile.fields.email')}
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={t('profile.placeholders.email')}
                      />
                    ) : (
                      <div className="bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white">
                        {formData.email || t('profile.notSpecified')}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      {t('profile.fields.phone')}
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={t('profile.placeholders.phone')}
                      />
                    ) : (
                      <div className="bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white">
                        {formData.phone || t('profile.notSpecified')}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      {t('profile.fields.location')}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={t('profile.placeholders.location')}
                      />
                    ) : (
                      <div className="bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white">
                        {formData.location || t('profile.notSpecified')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div>
                <h4 className="text-base font-medium text-white mb-4 border-b border-gray-700/50 pb-2">
                  {t('profile.professionalInfo')}
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      {t('profile.fields.company')}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={t('profile.placeholders.company')}
                      />
                    ) : (
                      <div className="bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white">
                        {formData.company || t('profile.notSpecified')}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      {t('profile.fields.website')}
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder={t('profile.placeholders.website')}
                      />
                    ) : (
                      <div className="bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white">
                        {formData.website || t('profile.notSpecified')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div>
                <h4 className="text-base font-medium text-white mb-4 border-b border-gray-700/50 pb-2">
                  {t('profile.about')}
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {t('profile.fields.bio')}
                  </label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={t('profile.placeholders.bio')}
                    />
                  ) : (
                    <div className="bg-[#212332] border border-gray-600 rounded-lg px-3 py-2 text-white min-h-[100px]">
                      {formData.bio || t('profile.noBio')}
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border-t border-gray-700/50 pt-6">
                <h4 className="text-base font-medium text-white mb-4">
                  {t('profile.accountActions')}
                </h4>
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm"
                >
                  {isSigningOut ? (
                    <>
                      <FaSpinner className="animate-spin text-xs sm:text-sm" />
                      <span className="hidden sm:inline">{t('profile.signingOut')}</span>
                    </>
                  ) : (
                    <>
                      <FaSignOutAlt className="text-xs sm:text-sm" />
                      <span className="hidden sm:inline">{t('auth.logout')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}