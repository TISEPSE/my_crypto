import { NextResponse } from 'next/server'
import { createUser } from '../../../lib/database'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)

export async function POST(request) {
  try {
    console.log('Register API called on environment:', process.env.NODE_ENV)

    const { email, password, username } = await request.json()
    console.log('Register attempt for email:', email)

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    // Generate random username if not provided
    const finalUsername = username && username.trim() ? username.trim() : `user${Math.floor(Math.random() * 10000)}`

    // Create user
    console.log('Attempting to create user with username:', finalUsername)
    const user = await createUser(email, password, finalUsername)
    console.log('User created successfully:', user?.id)

    // Return success without auto-login for better security
    return NextResponse.json({
      message: 'Compte créé avec succès. Vous pouvez maintenant vous connecter.',
      redirect: '/login'
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du compte' },
      { status: 400 }
    )
  }
}