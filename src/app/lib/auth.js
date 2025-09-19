const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

// Pour les appels côté serveur NextJS
let cookies
try {
  const nextHeaders = require('next/headers')
  cookies = nextHeaders.cookies
} catch (error) {
  // Fallback pour les environnements qui n'ont pas next/headers
  cookies = null
}

// Configuration JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d'
const COOKIE_NAME = 'auth-token'

// Utilitaires de hashage des mots de passe
class PasswordUtils {
  static async hash(password) {
    const saltRounds = 12 // Plus sécurisé que 10
    return await bcrypt.hash(password, saltRounds)
  }

  static async compare(password, hash) {
    return await bcrypt.compare(password, hash)
  }

  // Validation de la force du mot de passe
  static validate(password) {
    const errors = []

    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule')
    }

    if (!/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Utilitaires JWT
class JWTUtils {
  // Créer un token JWT
  static create(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
      issuer: 'my-crypto',
      audience: 'crypto-users'
    })
  }

  // Vérifier et décoder un token
  static verify(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'my-crypto',
        audience: 'crypto-users'
      })
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired')
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token')
      }
      throw new Error('Token verification failed')
    }
  }

  // Décoder sans vérifier (pour debugging)
  static decode(token) {
    return jwt.decode(token)
  }
}

// Gestion des cookies sécurisés
class CookieUtils {
  // Définir un cookie d'authentification
  static setAuthCookie(token) {
    const cookieStore = cookies()

    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true, // Pas accessible via JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en prod
      sameSite: 'lax', // Protection CSRF
      maxAge: 7 * 24 * 60 * 60, // 7 jours en secondes
      path: '/'
    })
  }

  // Récupérer le token depuis les cookies
  static getAuthToken() {
    try {
      const cookieStore = cookies()
      return cookieStore.get(COOKIE_NAME)?.value || null
    } catch (error) {
      console.error('Error reading auth cookie:', error)
      return null
    }
  }

  // Supprimer le cookie d'authentification
  static clearAuthCookie() {
    const cookieStore = cookies()

    cookieStore.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immédiatement
      path: '/'
    })
  }
}

// Service d'authentification principal
class AuthService {
  // Créer une session utilisateur complète
  static async createUserSession(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000)
    }

    const token = JWTUtils.create(payload)
    CookieUtils.setAuthCookie(token)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    }
  }

  // Vérifier la session actuelle
  static async verifySession() {
    try {
      const token = CookieUtils.getAuthToken()

      if (!token) {
        return { authenticated: false, user: null }
      }

      const decoded = JWTUtils.verify(token)

      return {
        authenticated: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name
        }
      }
    } catch (error) {
      console.error('Session verification failed:', error.message)

      // Nettoyer le cookie invalide
      CookieUtils.clearAuthCookie()

      return { authenticated: false, user: null, error: error.message }
    }
  }

  // Détruire la session
  static async destroySession() {
    CookieUtils.clearAuthCookie()
    return { success: true }
  }

  // Middleware pour protéger les routes
  static async requireAuth() {
    const session = await AuthService.verifySession()

    if (!session.authenticated) {
      throw new Error('Authentication required')
    }

    return session.user
  }
}

// Validation email
class EmailUtils {
  static validate(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email) {
      return { isValid: false, error: 'Email requis' }
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Format email invalide' }
    }

    if (email.length > 255) {
      return { isValid: false, error: 'Email trop long' }
    }

    return { isValid: true }
  }

  // Normaliser l'email (lowercase, trim)
  static normalize(email) {
    return email.toLowerCase().trim()
  }
}

// Utilitaires de sécurité
class SecurityUtils {
  // Rate limiting simple (en mémoire, pour production utiliser Redis)
  static rateLimiter = new Map()

  static checkRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now()
    const windowStart = now - windowMs

    if (!this.rateLimiter.has(key)) {
      this.rateLimiter.set(key, [])
    }

    const attempts = this.rateLimiter.get(key)

    // Nettoyer les anciennes tentatives
    const recentAttempts = attempts.filter(timestamp => timestamp > windowStart)
    this.rateLimiter.set(key, recentAttempts)

    if (recentAttempts.length >= maxAttempts) {
      return {
        allowed: false,
        resetTime: windowStart + windowMs,
        remainingAttempts: 0
      }
    }

    // Ajouter la tentative actuelle
    recentAttempts.push(now)
    this.rateLimiter.set(key, recentAttempts)

    return {
      allowed: true,
      remainingAttempts: maxAttempts - recentAttempts.length
    }
  }

  // Nettoyer le rate limiter (à appeler périodiquement)
  static cleanupRateLimit() {
    const now = Date.now()
    const windowMs = 15 * 60 * 1000

    for (const [key, attempts] of this.rateLimiter.entries()) {
      const recentAttempts = attempts.filter(timestamp => timestamp > (now - windowMs))

      if (recentAttempts.length === 0) {
        this.rateLimiter.delete(key)
      } else {
        this.rateLimiter.set(key, recentAttempts)
      }
    }
  }

  // Extraire l'IP du client
  static getClientIP(request) {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const connectingIP = request.headers.get('cf-connecting-ip')

    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    return realIP || connectingIP || 'unknown'
  }
}

module.exports = {
  PasswordUtils,
  JWTUtils,
  CookieUtils,
  AuthService,
  EmailUtils,
  SecurityUtils
}