import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { changeUserPassword } from '../../../lib/database-optimized'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)

// Rate limiting for password changes (in-memory, production should use Redis)
const passwordChangeAttempts = new Map()
const MAX_ATTEMPTS = 3
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes

async function getUserFromRequest(request) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, secret)
    return { id: payload.userId }
  } catch (error) {
    return null
  }
}

function checkRateLimit(userId) {
  const attempts = passwordChangeAttempts.get(userId)
  if (!attempts) return true

  const { count, lastAttempt } = attempts
  const timeSinceLastAttempt = Date.now() - lastAttempt

  // Reset if lockout time has passed
  if (timeSinceLastAttempt > LOCKOUT_TIME) {
    passwordChangeAttempts.delete(userId)
    return true
  }

  // Check if user is locked out
  return count < MAX_ATTEMPTS
}

function recordAttempt(userId, success) {
  const attempts = passwordChangeAttempts.get(userId) || { count: 0, lastAttempt: 0 }

  if (success) {
    // Reset on successful password change
    passwordChangeAttempts.delete(userId)
  } else {
    // Increment failed attempts
    passwordChangeAttempts.set(userId, {
      count: attempts.count + 1,
      lastAttempt: Date.now()
    })
  }
}

export async function POST(request) {
  const startTime = Date.now()

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      )
    }

    // Check rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Mot de passe actuel et nouveau mot de passe requis' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit être différent de l\'actuel' },
        { status: 400 }
      )
    }

    try {
      const updatedUser = await changeUserPassword(user.id, currentPassword, newPassword)
      recordAttempt(user.id, true) // Success

      const processingTime = Date.now() - startTime

      return NextResponse.json({
        success: true,
        message: 'Mot de passe modifié avec succès',
        performance: {
          processingTime: `${processingTime}ms`
        }
      })

    } catch (error) {
      recordAttempt(user.id, false) // Failure

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}