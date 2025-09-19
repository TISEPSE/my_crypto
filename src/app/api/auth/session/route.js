import { NextResponse } from 'next/server'
import { AuthService } from '../../../lib/auth'

export async function GET(request) {
  try {
    // Vérifier la session actuelle
    const session = await AuthService.verifySession()

    if (!session.authenticated) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          error: session.error || 'Non authentifié'
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: session.user
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Session verification error:', error)

    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error: 'Erreur de vérification de session'
      },
      { status: 500 }
    )
  }
}