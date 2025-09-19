import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import {
  updateUserPartial,
  updateUserSettings,
  getUserById,
  getDatabaseStats
} from '../../../lib/database-optimized'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)

// Performance: Cache JWT verification results briefly
const jwtCache = new Map()
const JWT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getUserFromRequest(request) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) return null

    // Check JWT cache first
    const cached = jwtCache.get(token)
    if (cached && Date.now() - cached.timestamp < JWT_CACHE_TTL) {
      return cached.user
    }

    const { payload } = await jwtVerify(token, secret)
    const user = { id: payload.userId }

    // Cache JWT result
    jwtCache.set(token, {
      user,
      timestamp: Date.now()
    })

    // Clean old cache entries periodically
    if (jwtCache.size > 100) {
      const now = Date.now()
      for (const [key, value] of jwtCache.entries()) {
        if (now - value.timestamp > JWT_CACHE_TTL) {
          jwtCache.delete(key)
        }
      }
    }

    return user
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

// Validation schemas for different update types
const updateValidators = {
  profile: (data) => {
    const allowed = ['username', 'email']
    const filtered = {}

    for (const key of allowed) {
      if (data.hasOwnProperty(key) && data[key] !== undefined) {
        if (key === 'email') {
          const email = String(data[key]).toLowerCase().trim()
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Format d\'email invalide')
          }
          filtered[key] = email
        } else if (key === 'username') {
          const username = String(data[key]).trim()
          if (username.length < 2 || username.length > 30) {
            throw new Error('Le nom d\'utilisateur doit contenir entre 2 et 30 caractères')
          }
          filtered[key] = username
        }
      }
    }

    return filtered
  },

  settings: (data) => {
    const allowed = ['theme', 'notifications', 'currency', 'language', 'timezone']
    const filtered = {}

    for (const key of allowed) {
      if (data.hasOwnProperty(key) && data[key] !== undefined) {
        switch (key) {
          case 'theme':
            if (!['light', 'dark', 'auto'].includes(data[key])) {
              throw new Error('Thème invalide')
            }
            break
          case 'notifications':
            filtered[key] = Boolean(data[key])
            break
          case 'currency':
            if (!/^[A-Z]{3}$/.test(data[key])) {
              throw new Error('Code de devise invalide')
            }
            break
          case 'language':
            if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(data[key])) {
              throw new Error('Code de langue invalide')
            }
            break
          case 'timezone':
            if (typeof data[key] !== 'string' || data[key].length > 50) {
              throw new Error('Fuseau horaire invalide')
            }
            break
        }
        filtered[key] = data[key]
      }
    }

    return filtered
  }
}

// PATCH: Update user profile or settings
export async function PATCH(request) {
  const startTime = Date.now()

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { updateType, data } = body

    if (!updateType || !data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Type de mise à jour et données requis' },
        { status: 400 }
      )
    }

    let updatedUser
    let validator = updateValidators[updateType]

    if (!validator) {
      return NextResponse.json(
        { error: 'Type de mise à jour non supporté' },
        { status: 400 }
      )
    }

    try {
      const validatedData = validator(data)

      if (Object.keys(validatedData).length === 0) {
        return NextResponse.json(
          { error: 'Aucune donnée valide à mettre à jour' },
          { status: 400 }
        )
      }

      if (updateType === 'settings') {
        updatedUser = await updateUserSettings(user.id, validatedData)
      } else {
        updatedUser = await updateUserPartial(user.id, validatedData)
      }

      const processingTime = Date.now() - startTime

      return NextResponse.json({
        success: true,
        user: updatedUser,
        updateType,
        updatedFields: Object.keys(validatedData),
        performance: {
          processingTime: `${processingTime}ms`
        }
      })

    } catch (validationError) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// GET: Get user profile with performance stats
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      )
    }

    const startTime = Date.now()
    const userProfile = await getUserById(user.id)

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      user: userProfile,
      performance: {
        processingTime: `${processingTime}ms`,
        cacheStats: getDatabaseStats()
      }
    })

  } catch (error) {
    console.error('Error getting user profile:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}

// POST: Batch update multiple user data types
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

    const body = await request.json()
    const { updates } = body

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Liste de mises à jour requise' },
        { status: 400 }
      )
    }

    if (updates.length > 10) {
      return NextResponse.json(
        { error: 'Trop de mises à jour (maximum 10)' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const update of updates) {
      try {
        const { updateType, data } = update
        const validator = updateValidators[updateType]

        if (!validator) {
          errors.push({ updateType, error: 'Type non supporté' })
          continue
        }

        const validatedData = validator(data)

        if (Object.keys(validatedData).length === 0) {
          errors.push({ updateType, error: 'Aucune donnée valide' })
          continue
        }

        let result
        if (updateType === 'settings') {
          result = await updateUserSettings(user.id, validatedData)
        } else {
          result = await updateUserPartial(user.id, validatedData)
        }

        results.push({
          updateType,
          success: true,
          updatedFields: Object.keys(validatedData)
        })

      } catch (updateError) {
        errors.push({
          updateType: update.updateType,
          error: updateError.message
        })
      }
    }

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      completed: results.length,
      failed: errors.length,
      results,
      errors,
      performance: {
        processingTime: `${processingTime}ms`,
        averagePerUpdate: `${Math.round(processingTime / updates.length)}ms`
      }
    })

  } catch (error) {
    console.error('Error in batch update:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}