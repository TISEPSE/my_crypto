import { NextResponse } from 'next/server'
import { getUserById, updateUser } from '../../../lib/database'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)

async function getUserFromToken(request) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, secret)
    return await getUserById(payload.userId)
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export async function GET(request) {
  try {
    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const updates = await request.json()

    // Validate updates
    const allowedFields = [
      'username', 'email', 'phone', 'location', 'bio', 'company', 'website'
    ]

    const filteredUpdates = {}
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key]
      }
    })

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée valide à mettre à jour' },
        { status: 400 }
      )
    }

    // Validate username if provided
    if (filteredUpdates.username && filteredUpdates.username.trim().length < 2) {
      return NextResponse.json(
        { error: 'Le nom d\'utilisateur doit contenir au moins 2 caractères' },
        { status: 400 }
      )
    }

    // Validate email if provided
    if (filteredUpdates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(filteredUpdates.email)) {
        return NextResponse.json(
          { error: 'Adresse email invalide' },
          { status: 400 }
        )
      }
    }

    const updatedUser = await updateUser(user.id, filteredUpdates)

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour du profil' },
      { status: 400 }
    )
  }
}