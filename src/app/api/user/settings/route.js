import { NextResponse } from 'next/server'
import { getUserById, updateUser } from '../../../lib/database'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)

async function getUserFromRequest(request) {
  try {
    // Try to get user ID from Authorization header (for localStorage auth)
    const authHeader = request.headers.get('authorization')

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { payload } = await jwtVerify(token, secret)
      return await getUserById(payload.userId)
    }

    // Fallback to cookie-based auth
    const token = request.cookies.get('auth-token')?.value
    if (token) {
      const { payload } = await jwtVerify(token, secret)
      return await getUserById(payload.userId)
    }

    return null
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const settings = await request.json()

    // Prepare settings update
    const allowedSettings = [
      'language', 'timezone', 'theme'
    ]

    const allowedNotifications = [
      'priceAlerts', 'pushNotifications', 'emailNotifications', 'soundEnabled'
    ]

    const allowedPrivacy = [
      'analytics', 'dataSharing', 'profileVisibility'
    ]

    const updates = {}

    // Handle general settings
    allowedSettings.forEach(key => {
      if (settings[key] !== undefined) {
        updates[key] = settings[key]
      }
    })

    // Handle notifications
    const notifications = { ...user.notifications }
    let notificationsUpdated = false
    allowedNotifications.forEach(key => {
      if (settings[key] !== undefined) {
        notifications[key] = settings[key]
        notificationsUpdated = true
      }
    })
    if (notificationsUpdated) {
      updates.notifications = notifications
    }

    // Handle privacy settings
    const privacy = { ...user.privacy }
    let privacyUpdated = false
    allowedPrivacy.forEach(key => {
      if (settings[key] !== undefined) {
        privacy[key] = settings[key]
        privacyUpdated = true
      }
    })
    if (privacyUpdated) {
      updates.privacy = privacy
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Aucun paramètre valide à mettre à jour' },
        { status: 400 }
      )
    }

    const updatedUser = await updateUser(user.id, updates)

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour des paramètres' },
      { status: 400 }
    )
  }
}