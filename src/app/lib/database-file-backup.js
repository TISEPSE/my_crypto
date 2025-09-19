import bcrypt from 'bcryptjs'

// Detect if running on Vercel
const isVercel = process.env.VERCEL === '1' ||
                 process.env.VERCEL_ENV ||
                 process.env.NODE_ENV === 'production'

// In-memory database for Vercel compatibility
class MemoryDatabase {
  constructor() {
    this.users = []
    this.favorites = {}
    this.initialized = false
    console.log('🗄️  Using in-memory database (Vercel compatible)')
  }

  async initialize() {
    if (this.initialized) return
    this.initialized = true
  }
}

let memoryDb = null
let fs = null
let path = null
let DB_PATH, USERS_FILE, FAVORITES_FILE

// Initialize appropriate database system
if (isVercel) {
  memoryDb = new MemoryDatabase()
  console.log('🗄️ Vercel detected - using in-memory database')
} else {
  // Dynamic imports for file system (only in local development)
  try {
    fs = require('fs/promises')
    path = require('path')
    DB_PATH = path.join(process.cwd(), 'data')
    USERS_FILE = path.join(DB_PATH, 'users.json')
    FAVORITES_FILE = path.join(DB_PATH, 'favorites.json')
    console.log('📁 Using file-based database (local development)')
  } catch (error) {
    console.error('Error setting up file system:', error)
    // Fallback to memory database
    memoryDb = new MemoryDatabase()
    console.log('🗄️ Fallback to in-memory database due to filesystem error')
  }
}

// Database initialization
async function ensureDataFiles() {
  if (memoryDb) {
    await memoryDb.initialize()
    return
  }

  try {
    await fs.mkdir(DB_PATH, { recursive: true })

    // Check if users file exists
    try {
      await fs.access(USERS_FILE)
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([]))
    }

    // Check if favorites file exists
    try {
      await fs.access(FAVORITES_FILE)
    } catch {
      await fs.writeFile(FAVORITES_FILE, JSON.stringify({}))
    }
  } catch (error) {
    console.error('Error ensuring data files:', error)
    // If file system fails, fallback to memory
    if (!memoryDb) {
      memoryDb = new MemoryDatabase()
      await memoryDb.initialize()
    }
  }
}

// User management
export async function createUser(email, password, username) {
  console.log('Database createUser called, using memoryDb:', !!memoryDb)
  await ensureDataFiles()

  try {
    let users
    if (memoryDb) {
      users = memoryDb.users
      console.log('Using memory database, current users count:', users.length)
    } else {
      users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'))
      console.log('Using file database, current users count:', users.length)
    }

    // Check if user already exists
    const existingUser = users.find(user => user.email === email.toLowerCase())
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate random username if not provided
    const finalUsername = username && username.trim()
      ? username.trim()
      : `user${Math.floor(Math.random() * 10000)}`

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

    users.push(newUser)

    if (memoryDb) {
      // Store in memory
      memoryDb.users = users
    } else {
      // Save to file
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
    }

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
    const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'))
    const user = users.find(user => user.email === email)

    if (!user) {
      throw new Error('Email ou mot de passe incorrect')
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw new Error('Email ou mot de passe incorrect')
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    throw error
  }
}

export async function getUserById(id) {
  await ensureDataFiles()

  try {
    const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'))
    const user = users.find(user => user.id === id)

    if (!user) {
      return null
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}

export async function updateUser(userId, updates) {
  await ensureDataFiles()

  try {
    const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'))
    const userIndex = users.findIndex(user => user.id === userId)

    if (userIndex === -1) {
      throw new Error('Utilisateur non trouvé')
    }

    // Preserve password and other critical fields
    const { password, id, createdAt, ...allowedUpdates } = updates

    // Update user data
    users[userIndex] = {
      ...users[userIndex],
      ...allowedUpdates,
      updatedAt: new Date().toISOString()
    }

    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))

    // Return updated user without password
    const { password: _, ...userWithoutPassword } = users[userIndex]
    return userWithoutPassword
  } catch (error) {
    throw error
  }
}

// Favorites management
export async function getUserFavorites(userId) {
  await ensureDataFiles()

  try {
    let favorites
    if (memoryDb) {
      favorites = memoryDb.favorites
    } else {
      favorites = JSON.parse(await fs.readFile(FAVORITES_FILE, 'utf8'))
    }
    return favorites[userId] || []
  } catch (error) {
    console.error('Error getting user favorites:', error)
    return []
  }
}

export async function addUserFavorite(userId, crypto) {
  await ensureDataFiles()

  try {
    let favorites
    if (memoryDb) {
      favorites = memoryDb.favorites
    } else {
      favorites = JSON.parse(await fs.readFile(FAVORITES_FILE, 'utf8'))
    }

    if (!favorites[userId]) {
      favorites[userId] = []
    }

    // Check if already exists (case insensitive)
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

    if (memoryDb) {
      // Store in memory
      memoryDb.favorites = favorites
    } else {
      // Save to file
      await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2))
    }

    return newFavorite
  } catch (error) {
    throw error
  }
}

export async function removeUserFavorite(userId, symbol) {
  await ensureDataFiles()

  try {
    let favorites
    if (memoryDb) {
      favorites = memoryDb.favorites
    } else {
      favorites = JSON.parse(await fs.readFile(FAVORITES_FILE, 'utf8'))
    }

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

    if (memoryDb) {
      // Store in memory
      memoryDb.favorites = favorites
    } else {
      // Save to file
      await fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2))
    }

    return removed
  } catch (error) {
    console.error('Error removing favorite:', error)
    return false
  }
}