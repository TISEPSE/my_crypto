import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getUserFavorites, addUserFavorite, removeUserFavorite } from '../../lib/database'

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
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
    }

    const favorites = await getUserFavorites(user.id)
    return NextResponse.json(favorites)
  } catch (error) {
    console.error('Erreur GET favorites:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
    }

    const crypto = await request.json()

    if (!crypto.symbol || !crypto.name) {
      return NextResponse.json({ error: 'Symbol et name requis' }, { status: 400 })
    }

    const newFavorite = await addUserFavorite(user.id, {
      symbol: crypto.symbol.toLowerCase(),
      name: crypto.name
    })

    return NextResponse.json({
      success: true,
      favorite: newFavorite
    })
  } catch (error) {
    console.error('Erreur POST favorites:', error)
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 })
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

    return NextResponse.json({
      success: true,
      removed: true
    })
  } catch (error) {
    console.error('Erreur DELETE favorites:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}