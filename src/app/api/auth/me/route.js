import { NextResponse } from 'next/server'
import { AuthService } from '../../../lib/auth'
import { getUserById, getUserFavorites } from '../../../lib/database'

export async function GET(request) {
  try {
    // Vérifier l'authentification
    const user = await AuthService.requireAuth()

    // Récupérer les informations complètes de l'utilisateur
    const userDetails = await getUserById(user.id)

    if (!userDetails) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer les favoris
    const favorites = await getUserFavorites(user.id)

    return NextResponse.json(
      {
        user: {
          id: userDetails.id,
          email: userDetails.email,
          username: userDetails.username,
          createdAt: userDetails.createdAt,
          updatedAt: userDetails.updatedAt,
          phone: userDetails.phone,
          location: userDetails.location,
          bio: userDetails.bio,
          company: userDetails.company,
          website: userDetails.website,
          language: userDetails.language,
          timezone: userDetails.timezone,
          theme: userDetails.theme,
          priceAlerts: userDetails.priceAlerts,
          pushNotifications: userDetails.pushNotifications,
          emailNotifications: userDetails.emailNotifications,
          soundEnabled: userDetails.soundEnabled,
          analytics: userDetails.analytics,
          dataSharing: userDetails.dataSharing,
          profileVisibility: userDetails.profileVisibility
        },
        favorites: favorites,
        stats: {
          favoritesCount: favorites.length,
          memberSince: userDetails.createdAt
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get user profile error:', error)

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication requise' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    )
  }
}