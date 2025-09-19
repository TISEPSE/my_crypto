import bcrypt from 'bcryptjs'
import { prisma } from '../../../lib/prisma.js'

/**
 * Prisma-based database layer for high-performance operations
 * Replaces JSON file operations with PostgreSQL via Prisma ORM
 */

// User Management Functions
export async function createUser(email, password, username) {
  try {
    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà')
    }

    // Generate username if not provided
    const finalUsername = username?.trim() || `user${Math.floor(Math.random() * 10000)}`

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with Prisma
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: finalUsername,
        password: hashedPassword,
        phone: '',
        location: '',
        bio: '',
        company: '',
        website: '',
        language: 'fr',
        timezone: 'UTC',
        theme: 'dark',
        priceAlerts: true,
        pushNotifications: false,
        emailNotifications: true,
        soundEnabled: true,
        analytics: true,
        dataSharing: false,
        profileVisibility: 'private'
      }
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser
    return userWithoutPassword
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export async function authenticateUser(email, password) {
  try {
    const normalizedEmail = email.toLowerCase().trim()

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (!user) {
      throw new Error('Email ou mot de passe incorrect')
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw new Error('Email ou mot de passe incorrect')
    }

    // Update last login if you want to track this
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error('Error authenticating user:', error)
    throw error
  }
}

export async function getUserById(id) {
  try {
    if (!id) return null

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) return null

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}

export async function updateUser(userId, updates) {
  try {
    // Filter out sensitive fields that shouldn't be updated directly
    const { password, id, createdAt, ...allowedUpdates } = updates

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...allowedUpdates,
        updatedAt: new Date()
      }
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser
    return userWithoutPassword
  } catch (error) {
    console.error('Error updating user:', error)

    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      throw new Error('Utilisateur non trouvé')
    }
    throw error
  }
}

// Favorites Management Functions
export async function getUserFavorites(userId) {
  try {
    if (!userId) return []

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' }
    })

    return favorites
  } catch (error) {
    console.error('Error getting user favorites:', error)
    return []
  }
}

export async function addUserFavorite(userId, crypto) {
  try {
    const normalizedSymbol = crypto.symbol.toLowerCase()

    // Check if already exists
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_symbol: {
          userId,
          symbol: normalizedSymbol
        }
      }
    })

    if (existing) {
      throw new Error('Ce crypto est déjà dans vos favoris')
    }

    const newFavorite = await prisma.favorite.create({
      data: {
        userId,
        symbol: normalizedSymbol,
        name: crypto.name
      }
    })

    return newFavorite
  } catch (error) {
    console.error('Error adding favorite:', error)
    throw error
  }
}

export async function removeUserFavorite(userId, symbol) {
  try {
    const normalizedSymbol = symbol.toLowerCase()

    const removed = await prisma.favorite.deleteMany({
      where: {
        userId,
        symbol: normalizedSymbol
      }
    })

    return removed.count > 0
  } catch (error) {
    console.error('Error removing favorite:', error)
    return false
  }
}

// Utility Functions
export async function getDatabaseInfo() {
  try {
    // Get some basic stats
    const userCount = await prisma.user.count()
    const favoriteCount = await prisma.favorite.count()

    return {
      status: 'healthy',
      type: 'PostgreSQL (Prisma)',
      users: userCount,
      favorites: favoriteCount,
      connection: 'active'
    }
  } catch (error) {
    console.error('Error getting database info:', error)
    return {
      status: 'error',
      type: 'PostgreSQL (Prisma)',
      error: error.message
    }
  }
}

export function getDatabaseType() {
  return 'PostgreSQL (Prisma)'
}

export async function initializeDatabase() {
  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ PostgreSQL database connected via Prisma')
    return 'PostgreSQL'
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

// Password management
export async function changeUserPassword(userId, currentPassword, newPassword) {
  try {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('Utilisateur non trouvé')
    }

    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidCurrentPassword) {
      throw new Error('Mot de passe actuel incorrect')
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser
    return userWithoutPassword
  } catch (error) {
    console.error('Error changing password:', error)
    throw error
  }
}

// Batch operations for performance
export async function updateUserFavorites(userId, operations) {
  try {
    let changes = 0

    // Use transaction for consistency
    await prisma.$transaction(async (tx) => {
      for (const op of operations) {
        if (op.action === 'add') {
          const normalizedSymbol = op.crypto.symbol.toLowerCase()

          try {
            await tx.favorite.create({
              data: {
                userId,
                symbol: normalizedSymbol,
                name: op.crypto.name
              }
            })
            changes++
          } catch (error) {
            // Ignore if already exists (unique constraint violation)
            if (error.code !== 'P2002') {
              throw error
            }
          }
        } else if (op.action === 'remove') {
          const normalizedSymbol = op.symbol.toLowerCase()

          const result = await tx.favorite.deleteMany({
            where: {
              userId,
              symbol: normalizedSymbol
            }
          })

          if (result.count > 0) {
            changes++
          }
        }
      }
    })

    return { success: true, changes }
  } catch (error) {
    console.error('Error updating user favorites:', error)
    throw error
  }
}

// Health check and performance monitoring
export async function performHealthCheck() {
  try {
    // Test basic operations
    const start = Date.now()
    await prisma.user.count()
    const queryTime = Date.now() - start

    return {
      status: 'healthy',
      database: 'PostgreSQL',
      queryTime: `${queryTime}ms`,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      database: 'PostgreSQL',
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

// Cache management (no-op for Prisma - built-in query caching)
export function clearCache() {
  // Prisma handles its own caching
  console.log('Cache cleared (Prisma handles internal caching)')
}

// Graceful shutdown
export async function closeDatabase() {
  try {
    await prisma.$disconnect()
    console.log('✅ Database connection closed')
  } catch (error) {
    console.error('Error closing database:', error)
  }
}