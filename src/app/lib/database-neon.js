import { neon } from '@neondatabase/serverless'

// Configuration Neon PostgreSQL
const sql = neon(process.env.DATABASE_URL)

// Initialisation des tables
export async function initializeTables() {
  try {
    console.log('🔧 Initialisation des tables Neon...')

    // Table users
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        location VARCHAR(255),
        bio TEXT,
        company VARCHAR(255),
        website VARCHAR(255),
        language VARCHAR(10) DEFAULT 'fr',
        timezone VARCHAR(50) DEFAULT 'UTC',
        theme VARCHAR(20) DEFAULT 'dark',
        notifications JSONB DEFAULT '{"priceAlerts": true, "pushNotifications": false, "emailNotifications": true, "soundEnabled": true}',
        privacy JSONB DEFAULT '{"analytics": true, "dataSharing": false, "profileVisibility": "private"}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Table favorites
    await sql`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, symbol)
      )
    `

    console.log('✅ Tables Neon créées avec succès')
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur création tables:', error)
    return { success: false, error: error.message }
  }
}

// CRUD Users
export async function createUser(userData) {
  try {
    const result = await sql`
      INSERT INTO users (email, username, password, phone, location, bio, company, website, language, timezone, theme, notifications, privacy)
      VALUES (${userData.email}, ${userData.username || null}, ${userData.password},
              ${userData.phone || null}, ${userData.location || null}, ${userData.bio || null},
              ${userData.company || null}, ${userData.website || null}, ${userData.language || 'fr'},
              ${userData.timezone || 'UTC'}, ${userData.theme || 'dark'},
              ${JSON.stringify(userData.notifications || {})}, ${JSON.stringify(userData.privacy || {})})
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error('Erreur création utilisateur:', error)
    throw error
  }
}

export async function getUserByEmail(email) {
  try {
    const result = await sql`SELECT * FROM users WHERE email = ${email}`
    return result[0] || null
  } catch (error) {
    console.error('Erreur récupération utilisateur par email:', error)
    throw error
  }
}

export async function getUserById(id) {
  try {
    const result = await sql`SELECT * FROM users WHERE id = ${id}`
    return result[0] || null
  } catch (error) {
    console.error('Erreur récupération utilisateur par ID:', error)
    throw error
  }
}

export async function updateUser(id, updates) {
  try {
    // Construction dynamique de la requête UPDATE
    const keys = Object.keys(updates)
    const values = Object.values(updates)

    if (keys.length === 0) return null

    // Gestion spéciale pour JSONB
    const setClause = keys.map((key, index) => {
      if (key === 'notifications' || key === 'privacy') {
        return `${key} = $${index + 2}::jsonb`
      }
      return `${key} = $${index + 2}`
    }).join(', ')

    // Conversion des objets en JSON string pour JSONB
    const processedValues = values.map(value =>
      typeof value === 'object' ? JSON.stringify(value) : value
    )

    const query = `
      UPDATE users
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `

    const result = await sql.unsafe(query, [id, ...processedValues])
    return result[0]
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error)
    throw error
  }
}

// CRUD Favoris
export async function addFavorite(userId, symbol, name) {
  try {
    const result = await sql`
      INSERT INTO favorites (user_id, symbol, name)
      VALUES (${userId}, ${symbol}, ${name})
      ON CONFLICT (user_id, symbol) DO NOTHING
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error('Erreur ajout favori:', error)
    throw error
  }
}

export async function removeFavorite(userId, symbol) {
  try {
    await sql`DELETE FROM favorites WHERE user_id = ${userId} AND symbol = ${symbol}`
    return { success: true }
  } catch (error) {
    console.error('Erreur suppression favori:', error)
    throw error
  }
}

export async function getUserFavorites(userId) {
  try {
    const result = await sql`
      SELECT symbol, name FROM favorites
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `
    return result
  } catch (error) {
    console.error('Erreur récupération favoris:', error)
    throw error
  }
}

// Test de connexion
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as timestamp, version() as version`
    console.log('✅ Connexion Neon réussie:', {
      timestamp: result[0].timestamp,
      version: result[0].version.split(' ')[0]
    })
    return { success: true, ...result[0] }
  } catch (error) {
    console.error('❌ Erreur connexion Neon:', error)
    return { success: false, error: error.message }
  }
}