import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getUserById } from '../../../lib/database'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)

export async function GET(request) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Vérification JWT et récupération des données utilisateur
    const { payload } = await jwtVerify(token, secret)
    const user = await getUserById(payload.userId)

    if (!user) {
      // User not found in database, token is invalid
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: user
    })
  } catch (error) {
    console.error('Auth verification error:', error)
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}