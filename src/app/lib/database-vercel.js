import bcrypt from 'bcryptjs'

// In-memory database for Vercel deployment
// In production, you should use a real database like PostgreSQL, MongoDB, or Planetscale

class VercelDatabase {
  constructor() {
    // Initialize in-memory data
    this.users = []
    this.favorites = {}
    this.initialized = false
    this.cache = new Map()
  }

  // Initialize with environment variables or defaults
  async initialize() {
    if (this.initialized) return

    try {
      // Try to load data from environment variables (base64 encoded JSON)
      if (process.env.DB_USERS) {
        this.users = JSON.parse(Buffer.from(process.env.DB_USERS, 'base64').toString('utf8'))
      }
      if (process.env.DB_FAVORITES) {
        this.favorites = JSON.parse(Buffer.from(process.env.DB_FAVORITES, 'base64').toString('utf8'))
      }
    } catch (error) {
      console.log('No existing data found in environment, starting fresh')
      // Start with empty data
      this.users = []
      this.favorites = {}
    }

    this.initialized = true
    console.log(`Database initialized - Users: ${this.users.length}, Favorites: ${Object.keys(this.favorites).length}`)
  }

  // Note: In a serverless environment, data won't persist between function calls
  // For production, integrate with a real database service
}

const db = new VercelDatabase()

// Ensure database is initialized
export async function ensureInitialized() {
  await db.initialize()
}

// User Management
export async function createUser(email, password, username) {
  await ensureInitialized()

  try {
    // Check if user already exists
    const existingUser = db.users.find(user => user.email === email.toLowerCase())
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate username if not provided
    const finalUsername = username?.trim() || `user${Date.now().toString(36).slice(-4)}`

    const newUser = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase().trim(),
      username: finalUsername,
      password: hashedPassword,
      phone: '',
      location: '',
      bio: '',
      company: '',
      website: '',
      language: 'fr', // Default to French for this user
      timezone: 'UTC',
      theme: 'dark',
      notifications: {
        priceAlerts: true,
        pushNotifications: false,
        emailNotifications: true,
        soundEnabled: true
      },
      privacy: {
        analytics: true,
        dataSharing: false,
        profileVisibility: 'private'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    db.users.push(newUser)

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser
    return userWithoutPassword
  } catch (error) {
    throw error
  }
}

export async function authenticateUser(email, password) {
  await ensureInitialized()

  try {
    const normalizedEmail = email.toLowerCase().trim()
    const user = db.users.find(user => user.email === normalizedEmail)

    if (!user) {
      throw new Error('Email ou mot de passe incorrect')
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw new Error('Email ou mot de passe incorrect')
    }

    // Update last login
    user.lastLogin = new Date().toISOString()
    user.updatedAt = new Date().toISOString()

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    throw error
  }
}

export async function getUserById(id) {
  await ensureInitialized()

  if (!id) return null

  try {
    const user = db.users.find(user => user.id === id)
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
  await ensureInitialized()

  try {
    const userIndex = db.users.findIndex(user => user.id === userId)
    if (userIndex === -1) {
      throw new Error('Utilisateur non trouvé')
    }

    // Apply updates
    const updatedUser = {
      ...db.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    db.users[userIndex] = updatedUser

    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser
    return userWithoutPassword
  } catch (error) {
    throw error
  }
}

// Favorites Management
export async function getUserFavorites(userId) {
  await ensureInitialized()

  if (!userId) return []

  try {
    return db.favorites[userId] || []
  } catch (error) {
    console.error('Error getting user favorites:', error)
    return []
  }
}

export async function addUserFavorite(userId, crypto) {
  await ensureInitialized()

  try {
    if (!db.favorites[userId]) {
      db.favorites[userId] = []
    }

    // Check if already exists
    const normalizedSymbol = crypto.symbol.toLowerCase()
    const exists = db.favorites[userId].find(fav =>
      fav.symbol.toLowerCase() === normalizedSymbol
    )

    if (exists) {
      throw new Error('Ce crypto est déjà dans vos favoris')
    }

    const newFavorite = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol: normalizedSymbol,
      name: crypto.name,
      addedAt: new Date().toISOString()
    }

    db.favorites[userId].push(newFavorite)

    return newFavorite
  } catch (error) {
    throw error
  }
}

export async function removeUserFavorite(userId, symbol) {
  await ensureInitialized()

  try {
    if (!db.favorites[userId]) {
      return false
    }

    const normalizedSymbol = symbol.toLowerCase()
    const index = db.favorites[userId].findIndex(fav =>
      fav.symbol.toLowerCase() === normalizedSymbol
    )

    if (index === -1) {
      return false
    }

    const removed = db.favorites[userId].splice(index, 1)[0]
    return removed
  } catch (error) {
    console.error('Error removing favorite:', error)
    return false
  }
}

// Utility functions for development
export function getDatabaseStats() {
  return {
    users: db.users.length,
    favorites: Object.keys(db.favorites).length,
    totalFavorites: Object.values(db.favorites).reduce((acc, favs) => acc + favs.length, 0)
  }
}

export function clearDatabase() {
  db.users = []
  db.favorites = {}
  db.cache.clear()
}

// Export current data (for backup/migration)
export function exportDatabase() {
  return {
    users: db.users.map(({ password, ...user }) => user), // Export without passwords
    favorites: db.favorites
  }
}