import bcrypt from 'bcryptjs'
import fs from 'fs/promises'
import path from 'path'

// Simple, fast JSON-based database for optimal performance
class SimpleJsonDatabase {
  constructor() {
    this.DB_PATH = path.join(process.cwd(), 'data')
    this.USERS_FILE = path.join(this.DB_PATH, 'users.json')
    this.FAVORITES_FILE = path.join(this.DB_PATH, 'favorites.json')
    this.isInitialized = false

    // In-memory cache for better performance
    this.usersCache = null
    this.favoritesCache = null
    this.cacheExpiry = null
    this.CACHE_DURATION = 30000 // 30 seconds cache
  }

  // Fast initialization with minimal file system operations
  async initialize() {
    if (this.isInitialized) return

    try {
      // Ensure data directory exists
      await fs.mkdir(this.DB_PATH, { recursive: true })

      // Initialize files only if they don't exist
      await this.ensureFile(this.USERS_FILE, [])
      await this.ensureFile(this.FAVORITES_FILE, {})

      this.isInitialized = true
      console.log('✅ Simple JSON database initialized')
    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    }
  }

  // Helper to ensure file exists with default content
  async ensureFile(filePath, defaultContent) {
    try {
      await fs.access(filePath)
    } catch {
      await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2))
    }
  }

  // Optimized file reading with caching
  async readUsers() {
    const now = Date.now()

    // Return cached data if still valid
    if (this.usersCache && this.cacheExpiry && now < this.cacheExpiry) {
      return this.usersCache
    }

    try {
      const data = await fs.readFile(this.USERS_FILE, 'utf8')
      this.usersCache = JSON.parse(data)
      this.cacheExpiry = now + this.CACHE_DURATION
      return this.usersCache
    } catch (error) {
      console.error('Error reading users:', error)
      return []
    }
  }

  // Optimized file writing with cache invalidation
  async writeUsers(users) {
    try {
      await fs.writeFile(this.USERS_FILE, JSON.stringify(users, null, 2))
      // Update cache
      this.usersCache = users
      this.cacheExpiry = Date.now() + this.CACHE_DURATION
    } catch (error) {
      console.error('Error writing users:', error)
      throw error
    }
  }

  // Fast favorites reading with caching
  async readFavorites() {
    const now = Date.now()

    if (this.favoritesCache && this.cacheExpiry && now < this.cacheExpiry) {
      return this.favoritesCache
    }

    try {
      const data = await fs.readFile(this.FAVORITES_FILE, 'utf8')
      this.favoritesCache = JSON.parse(data)
      return this.favoritesCache
    } catch (error) {
      console.error('Error reading favorites:', error)
      return {}
    }
  }

  // Optimized favorites writing
  async writeFavorites(favorites) {
    try {
      await fs.writeFile(this.FAVORITES_FILE, JSON.stringify(favorites, null, 2))
      this.favoritesCache = favorites
    } catch (error) {
      console.error('Error writing favorites:', error)
      throw error
    }
  }

  // High-performance user creation
  async createUser(email, password, username) {
    await this.initialize()

    const normalizedEmail = email.toLowerCase().trim()
    const users = await this.readUsers()

    // Fast duplicate check using Array.find (optimized for small datasets)
    if (users.find(user => user.email === normalizedEmail)) {
      throw new Error('Un utilisateur avec cet email existe déjà')
    }

    // Generate user data
    const hashedPassword = await bcrypt.hash(password, 10) // Reduced rounds for speed
    const finalUsername = username?.trim() || `user${Math.floor(Math.random() * 10000)}`

    const newUser = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

    users.push(newUser)
    await this.writeUsers(users)

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser
    return userWithoutPassword
  }

  // Ultra-fast authentication with optimized password checking
  async authenticateUser(email, password) {
    await this.initialize()

    const normalizedEmail = email.toLowerCase().trim()
    const users = await this.readUsers()

    // Fast user lookup
    const user = users.find(u => u.email === normalizedEmail)
    if (!user) {
      throw new Error('Email ou mot de passe incorrect')
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw new Error('Email ou mot de passe incorrect')
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  // Fast user lookup by ID
  async getUserById(id) {
    await this.initialize()

    const users = await this.readUsers()
    const user = users.find(u => u.id === id)

    if (!user) return null

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  // Efficient user updates
  async updateUser(userId, updates) {
    await this.initialize()

    const users = await this.readUsers()
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex === -1) {
      throw new Error('Utilisateur non trouvé')
    }

    // Filter allowed updates (exclude sensitive fields)
    const { password, id, createdAt, ...allowedUpdates } = updates

    // Apply updates
    users[userIndex] = {
      ...users[userIndex],
      ...allowedUpdates,
      updatedAt: new Date().toISOString()
    }

    await this.writeUsers(users)

    const { password: _, ...userWithoutPassword } = users[userIndex]
    return userWithoutPassword
  }

  // Fast favorites management
  async getUserFavorites(userId) {
    await this.initialize()

    const favorites = await this.readFavorites()
    return favorites[userId] || []
  }

  async addUserFavorite(userId, crypto) {
    await this.initialize()

    const favorites = await this.readFavorites()

    if (!favorites[userId]) {
      favorites[userId] = []
    }

    const normalizedSymbol = crypto.symbol.toLowerCase()

    // Check for duplicates
    if (favorites[userId].find(fav => fav.symbol.toLowerCase() === normalizedSymbol)) {
      throw new Error('Ce crypto est déjà dans vos favoris')
    }

    const newFavorite = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol: normalizedSymbol,
      name: crypto.name,
      addedAt: new Date().toISOString()
    }

    favorites[userId].push(newFavorite)
    await this.writeFavorites(favorites)

    return newFavorite
  }

  async removeUserFavorite(userId, symbol) {
    await this.initialize()

    const favorites = await this.readFavorites()

    if (!favorites[userId]) return false

    const normalizedSymbol = symbol.toLowerCase()
    const index = favorites[userId].findIndex(fav =>
      fav.symbol.toLowerCase() === normalizedSymbol
    )

    if (index === -1) return false

    const removed = favorites[userId].splice(index, 1)[0]
    await this.writeFavorites(favorites)

    return removed
  }

  // Cache management for optimal performance
  clearCache() {
    this.usersCache = null
    this.favoritesCache = null
    this.cacheExpiry = null
  }

  // Health check
  getHealth() {
    return {
      status: 'healthy',
      type: 'SimpleJSON',
      cacheStatus: this.usersCache ? 'active' : 'cold',
      isInitialized: this.isInitialized
    }
  }
}

// Create singleton instance for optimal performance
const db = new SimpleJsonDatabase()

// Exported functions with performance optimizations
export async function createUser(email, password, username) {
  return db.createUser(email, password, username)
}

export async function authenticateUser(email, password) {
  return db.authenticateUser(email, password)
}

export async function getUserById(id) {
  return db.getUserById(id)
}

export async function updateUser(userId, updates) {
  return db.updateUser(userId, updates)
}

export async function getUserFavorites(userId) {
  return db.getUserFavorites(userId)
}

export async function addUserFavorite(userId, crypto) {
  return db.addUserFavorite(userId, crypto)
}

export async function removeUserFavorite(userId, symbol) {
  return db.removeUserFavorite(userId, symbol)
}

// Utility functions
export function getDatabaseInfo() {
  return db.getHealth()
}

export function clearDatabaseCache() {
  db.clearCache()
}

export function getDatabaseType() {
  return 'SimpleJSON'
}