import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getUserFavorites, addUserFavorite, removeUserFavorite } from '../../lib/database-optimized'
import { performanceMonitor, withPerformanceTracking, withRateLimit, rateLimiters } from '../../lib/performance-monitor'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)

// Helper to get user from JWT token
async function getUserFromRequest(request) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, secret)
    return { id: payload.userId }
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}

export async function GET(request) {
  const startTime = Date.now()

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
    }

    // Rate limiting
    if (!rateLimiters.favorites.checkLimit(user.id)) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
        { status: 429 }
      )
    }

    const favorites = await getUserFavorites(user.id)
    const processingTime = Date.now() - startTime

    // Track performance
    performanceMonitor.trackRequest('GET /api/favorites', processingTime, true)

    return NextResponse.json(favorites)
  } catch (error) {
    const processingTime = Date.now() - startTime
    performanceMonitor.trackRequest('GET /api/favorites', processingTime, false)
    console.error('Erreur GET favorites:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request) {
  const startTime = Date.now()

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
    }

    // Rate limiting
    if (!rateLimiters.favorites.checkLimit(user.id)) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
        { status: 429 }
      )
    }

    const crypto = await request.json()

    if (!crypto.symbol || !crypto.name) {
      return NextResponse.json({ error: 'Symbol et name requis' }, { status: 400 })
    }

    const newFavorite = await addUserFavorite(user.id, {
      symbol: crypto.symbol.toLowerCase(),
      name: crypto.name
    })

    const processingTime = Date.now() - startTime
    performanceMonitor.trackRequest('POST /api/favorites', processingTime, true)

    return NextResponse.json({
      success: true,
      favorite: newFavorite,
      performance: { processingTime: `${processingTime}ms` }
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    performanceMonitor.trackRequest('POST /api/favorites', processingTime, false)
    console.error('Erreur POST favorites:', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request) {
  const startTime = Date.now()

  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
    }

    // Rate limiting
    if (!rateLimiters.favorites.checkLimit(user.id)) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol requis' }, { status: 400 })
    }

    const removed = await removeUserFavorite(user.id, symbol.toLowerCase())

    if (!removed) {
      return NextResponse.json({ error: 'Favori non trouvé' }, { status: 404 })
    }

    const processingTime = Date.now() - startTime
    performanceMonitor.trackRequest('DELETE /api/favorites', processingTime, true)

    return NextResponse.json({
      success: true,
      removed,
      performance: { processingTime: `${processingTime}ms` }
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    performanceMonitor.trackRequest('DELETE /api/favorites', processingTime, false)
    console.error('Erreur DELETE favorites:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}