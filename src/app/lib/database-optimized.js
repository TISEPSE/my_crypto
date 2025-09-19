import fs from 'fs/promises'
import path from 'path'
import bcrypt from 'bcryptjs'

const DB_PATH = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DB_PATH, 'users.json')
const FAVORITES_FILE = path.join(DB_PATH, 'favorites.json')

// Performance optimization: In-memory cache with TTL
class DatabaseCache {
  constructor(ttlMinutes = 10) {
    this.cache = new Map()
    this.ttl = ttlMinutes * 60 * 1000 // Convert to milliseconds
    this.lastModified = new Map()

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  set(key, value, filePath) {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      filePath
    })
  }

  async get(key, filePath) {
    const cached = this.cache.get(key)
    if (!cached) return null

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    // Check if file has been modified since cached
    try {
      const stats = await fs.stat(filePath)
      const fileModified = stats.mtime.getTime()
      const lastMod = this.lastModified.get(filePath) || 0

      if (fileModified > lastMod) {
        this.cache.delete(key)
        this.lastModified.set(filePath, fileModified)
        return null
      }
    } catch (error) {
      // File doesn't exist or can't be accessed, invalidate cache
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  invalidate(key) {
    this.cache.delete(key)
  }

  invalidateByPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  cleanup() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key)
      }
    }
  }

  clear() {
    this.cache.clear()
    this.lastModified.clear()
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Global cache instance
const dbCache = new DatabaseCache(15) // 15 minutes TTL

// File locking mechanism to prevent concurrent write issues
class FileLock {
  constructor() {
    this.locks = new Map()
  }

  async acquire(filePath) {
    // Wait for existing lock to be released
    while (this.locks.has(filePath)) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    this.locks.set(filePath, true)
  }

  release(filePath) {
    this.locks.delete(filePath)
  }
}

const fileLock = new FileLock()

// Optimized file operations with caching
async function readJsonFile(filePath, cacheKey) {
  // Try cache first
  const cached = await dbCache.get(cacheKey, filePath)
  if (cached !== null) {
    return cached
  }

  try {
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'))
    dbCache.set(cacheKey, data, filePath)
    return data
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return default based on file type
      const defaultData = filePath.includes('users') ? [] : {}
      await writeJsonFile(filePath, defaultData, cacheKey)
      return defaultData
    }
    throw error
  }
}

async function writeJsonFile(filePath, data, cacheKey) {
  await fileLock.acquire(filePath)

  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true })

    // Write with atomic operation (write to temp file, then rename)
    const tempFile = `${filePath}.tmp`
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2))
    await fs.rename(tempFile, filePath)

    // Update cache
    dbCache.set(cacheKey, data, filePath)

    // Update last modified time
    dbCache.lastModified.set(filePath, Date.now())
  } finally {
    fileLock.release(filePath)
  }
}

// Ensure data directory and files exist
export async function ensureDataFiles() {
  try {
    await fs.mkdir(DB_PATH, { recursive: true })

    // Initialize users file if it doesn't exist
    try {
      await fs.access(USERS_FILE)
    } catch {
      await writeJsonFile(USERS_FILE, [], 'users')
    }

    // Initialize favorites file if it doesn't exist
    try {
      await fs.access(FAVORITES_FILE)
    } catch {
      await writeJsonFile(FAVORITES_FILE, {}, 'favorites')
    }
  } catch (error) {
    console.error('Error ensuring data files:', error)
    throw error
  }
}

// Optimized user management with caching
export async function createUser(email, password, username) {
  await ensureDataFiles()

  try {
    const users = await readJsonFile(USERS_FILE, 'users')

    // Optimized user existence check with early return
    const existingUser = users.find(user => user.email === email)
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà')
    }

    // Hash password with optimized rounds for performance/security balance
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate username with better collision avoidance
    const finalUsername = username?.trim() ||
      `user${Date.now().toString(36).slice(-4)}${Math.floor(Math.random() * 100)}`

    const newUser = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase().trim(),
      username: finalUsername,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      settings: {
        theme: 'light',
        notifications: true,
        currency: 'USD'
      }
    }

    users.push(newUser)
    await writeJsonFile(USERS_FILE, users, 'users')

    // Cache user data separately for faster lookups
    dbCache.set(`user_${newUser.id}`, newUser, USERS_FILE)

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser
    return userWithoutPassword
  } catch (error) {
    throw error
  }
}

export async function authenticateUser(email, password) {
  await ensureDataFiles()

  try {
    const users = await readJsonFile(USERS_FILE, 'users')
    const normalizedEmail = email.toLowerCase().trim()

    // Optimized user lookup with early exit
    const user = users.find(user => user.email === normalizedEmail)
    if (!user) {
      throw new Error('Email ou mot de passe incorrect')
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw new Error('Email ou mot de passe incorrect')
    }

    // Update last login time efficiently (partial update)
    await updateUserPartial(user.id, { lastLogin: new Date().toISOString() })

    // Cache authenticated user
    dbCache.set(`user_${user.id}`, user, USERS_FILE)

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    throw error
  }
}

// Highly optimized user lookup with individual user caching
export async function getUserById(id) {
  if (!id) return null

  try {
    // Check individual user cache first
    const cachedUser = await dbCache.get(`user_${id}`, USERS_FILE)
    if (cachedUser) {
      const { password: _, ...userWithoutPassword } = cachedUser
      return userWithoutPassword
    }

    await ensureDataFiles()
    const users = await readJsonFile(USERS_FILE, 'users')
    const user = users.find(user => user.id === id)

    if (!user) {
      return null
    }

    // Cache this user for future lookups
    dbCache.set(`user_${user.id}`, user, USERS_FILE)

    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}

// New: Efficient partial user updates
export async function updateUserPartial(userId, updates) {
  await ensureDataFiles()

  try {
    const users = await readJsonFile(USERS_FILE, 'users')
    const userIndex = users.findIndex(user => user.id === userId)

    if (userIndex === -1) {
      throw new Error('Utilisateur non trouvé')
    }

    // Apply partial updates
    const updatedUser = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    users[userIndex] = updatedUser
    await writeJsonFile(USERS_FILE, users, 'users')

    // Update individual user cache
    dbCache.set(`user_${userId}`, updatedUser, USERS_FILE)

    const { password: _, ...userWithoutPassword } = updatedUser
    return userWithoutPassword
  } catch (error) {
    throw error
  }
}

// New: Batch user settings updates
export async function updateUserSettings(userId, settings) {
  return updateUserPartial(userId, {
    settings: {
      ...(await getUserById(userId))?.settings,
      ...settings
    }
  })
}

// New: Change user password with optimized hashing
export async function changeUserPassword(userId, currentPassword, newPassword) {
  await ensureDataFiles()

  try {
    const users = await readJsonFile(USERS_FILE, 'users')
    const user = users.find(user => user.id === userId)

    if (!user) {
      throw new Error('Utilisateur non trouvé')
    }

    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidCurrentPassword) {
      throw new Error('Mot de passe actuel incorrect')
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    return await updateUserPartial(userId, {
      password: hashedNewPassword,
      passwordChangedAt: new Date().toISOString()
    })
  } catch (error) {
    throw error
  }
}

// Optimized favorites management with user-specific caching
export async function getUserFavorites(userId) {
  if (!userId) return []

  try {
    // Check user-specific favorites cache
    const cacheKey = `favorites_${userId}`
    const cached = await dbCache.get(cacheKey, FAVORITES_FILE)
    if (cached !== null) {
      return cached
    }

    await ensureDataFiles()
    const favorites = await readJsonFile(FAVORITES_FILE, 'favorites')
    const userFavorites = favorites[userId] || []

    // Cache user-specific favorites
    dbCache.set(cacheKey, userFavorites, FAVORITES_FILE)

    return userFavorites
  } catch (error) {
    console.error('Error getting user favorites:', error)
    return []
  }
}

export async function addUserFavorite(userId, crypto) {
  await ensureDataFiles()

  try {
    const favorites = await readJsonFile(FAVORITES_FILE, 'favorites')

    if (!favorites[userId]) {
      favorites[userId] = []
    }

    // Check if already exists (case-insensitive)
    const normalizedSymbol = crypto.symbol.toLowerCase()
    const exists = favorites[userId].find(fav =>
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

    favorites[userId].push(newFavorite)
    await writeJsonFile(FAVORITES_FILE, favorites, 'favorites')

    // Invalidate user favorites cache
    dbCache.invalidate(`favorites_${userId}`)

    return newFavorite
  } catch (error) {
    throw error
  }
}

export async function removeUserFavorite(userId, symbol) {
  await ensureDataFiles()

  try {
    const favorites = await readJsonFile(FAVORITES_FILE, 'favorites')

    if (!favorites[userId]) {
      return false
    }

    const normalizedSymbol = symbol.toLowerCase()
    const index = favorites[userId].findIndex(fav =>
      fav.symbol.toLowerCase() === normalizedSymbol
    )

    if (index === -1) {
      return false
    }

    const removed = favorites[userId].splice(index, 1)[0]
    await writeJsonFile(FAVORITES_FILE, favorites, 'favorites')

    // Invalidate user favorites cache
    dbCache.invalidate(`favorites_${userId}`)

    return removed
  } catch (error) {
    console.error('Error removing favorite:', error)
    return false
  }
}

// New: Batch favorites operations
export async function updateUserFavorites(userId, operations) {
  await ensureDataFiles()

  try {
    const favorites = await readJsonFile(FAVORITES_FILE, 'favorites')

    if (!favorites[userId]) {
      favorites[userId] = []
    }

    let changes = 0

    for (const op of operations) {
      if (op.action === 'add') {
        const normalizedSymbol = op.crypto.symbol.toLowerCase()
        const exists = favorites[userId].find(fav =>
          fav.symbol.toLowerCase() === normalizedSymbol
        )

        if (!exists) {
          favorites[userId].push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            symbol: normalizedSymbol,
            name: op.crypto.name,
            addedAt: new Date().toISOString()
          })
          changes++
        }
      } else if (op.action === 'remove') {
        const normalizedSymbol = op.symbol.toLowerCase()
        const index = favorites[userId].findIndex(fav =>
          fav.symbol.toLowerCase() === normalizedSymbol
        )

        if (index !== -1) {
          favorites[userId].splice(index, 1)
          changes++
        }
      }
    }

    if (changes > 0) {
      await writeJsonFile(FAVORITES_FILE, favorites, 'favorites')
      dbCache.invalidate(`favorites_${userId}`)
    }

    return { success: true, changes }
  } catch (error) {
    throw error
  }
}

// Performance monitoring and cache management
export function getDatabaseStats() {
  return {
    cache: dbCache.getStats(),
    locks: fileLock.locks.size
  }
}

export function clearCache() {
  dbCache.clear()
}

export function warmupCache(userIds = []) {
  // Pre-load frequently accessed data
  userIds.forEach(async (userId) => {
    try {
      await getUserById(userId)
      await getUserFavorites(userId)
    } catch (error) {
      console.error('Cache warmup error for user:', userId, error)
    }
  })
}