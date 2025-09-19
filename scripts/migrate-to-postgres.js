#!/usr/bin/env node

/**
 * Database Migration Script
 * Migrates data from file-based storage to PostgreSQL
 *
 * Usage:
 *   npm run db:migrate
 *   node scripts/migrate-to-postgres.js
 *
 * Environment variables required:
 *   DATABASE_URL - PostgreSQL connection string
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFile, access } from 'fs/promises'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Setup PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
})

async function initializeTables() {
  console.log('🔧 Initializing PostgreSQL tables...')

  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        unique_id VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        location VARCHAR(255) DEFAULT '',
        bio TEXT DEFAULT '',
        company VARCHAR(255) DEFAULT '',
        website VARCHAR(255) DEFAULT '',
        language VARCHAR(10) DEFAULT 'fr',
        timezone VARCHAR(50) DEFAULT 'UTC',
        theme VARCHAR(20) DEFAULT 'dark',
        notifications JSONB DEFAULT '{"priceAlerts": true, "pushNotifications": false, "emailNotifications": true, "soundEnabled": true}',
        privacy JSONB DEFAULT '{"analytics": true, "dataSharing": false, "profileVisibility": "private"}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create favorites table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        crypto_id VARCHAR(50) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        name VARCHAR(255) NOT NULL,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, symbol)
      )
    `)

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_unique_id ON users(unique_id);
      CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
      CREATE INDEX IF NOT EXISTS idx_favorites_symbol ON favorites(symbol);
    `)

    // Create update trigger
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `)

    await pool.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
    `)

    console.log('✅ Tables initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize tables:', error)
    throw error
  }
}

async function migrateUsers() {
  console.log('👥 Migrating users...')

  const dataPath = join(__dirname, '..', 'data')
  const usersFile = join(dataPath, 'users.json')

  let migrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: []
  }

  try {
    await access(usersFile)
    const usersData = await readFile(usersFile, 'utf8')
    const users = JSON.parse(usersData)

    migrationStats.total = users.length
    console.log(`Found ${users.length} users to migrate`)

    for (const user of users) {
      try {
        // Check if user already exists
        const existing = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          [user.email.toLowerCase()]
        )

        if (existing.rows.length > 0) {
          console.log(`⏭️  User ${user.email} already exists, skipping`)
          migrationStats.skipped++
          continue
        }

        // Parse dates
        const createdAt = user.createdAt ? new Date(user.createdAt) : new Date()
        const updatedAt = user.updatedAt ? new Date(user.updatedAt) : new Date()

        // Insert user with existing hashed password
        await pool.query(`
          INSERT INTO users (
            unique_id, email, username, password, phone, location, bio, company, website,
            language, timezone, theme, notifications, privacy, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          user.id,
          user.email.toLowerCase(),
          user.username,
          user.password, // Keep existing hashed password
          user.phone || '',
          user.location || '',
          user.bio || '',
          user.company || '',
          user.website || '',
          user.language || 'fr',
          user.timezone || 'UTC',
          user.theme || 'dark',
          JSON.stringify(user.notifications || {
            priceAlerts: true,
            pushNotifications: false,
            emailNotifications: true,
            soundEnabled: true
          }),
          JSON.stringify(user.privacy || {
            analytics: true,
            dataSharing: false,
            profileVisibility: 'private'
          }),
          createdAt,
          updatedAt
        ])

        console.log(`✅ Migrated user: ${user.email}`)
        migrationStats.migrated++

      } catch (error) {
        console.error(`❌ Failed to migrate user ${user.email}:`, error.message)
        migrationStats.errors.push(`User ${user.email}: ${error.message}`)
      }
    }

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📝 No users.json file found, skipping user migration')
    } else {
      console.error('❌ Error reading users file:', error)
      throw error
    }
  }

  return migrationStats
}

async function migrateFavorites() {
  console.log('⭐ Migrating favorites...')

  const dataPath = join(__dirname, '..', 'data')
  const favoritesFile = join(dataPath, 'favorites.json')

  let migrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: []
  }

  try {
    await access(favoritesFile)
    const favoritesData = await readFile(favoritesFile, 'utf8')
    const favorites = JSON.parse(favoritesData)

    // Count total favorites
    for (const userFavorites of Object.values(favorites)) {
      migrationStats.total += userFavorites.length
    }

    console.log(`Found ${migrationStats.total} favorites to migrate`)

    for (const [userId, userFavorites] of Object.entries(favorites)) {
      // Check if user exists
      const userExists = await pool.query(
        'SELECT id FROM users WHERE unique_id = $1',
        [userId]
      )

      if (userExists.rows.length === 0) {
        console.log(`⚠️  User ${userId} not found, skipping favorites`)
        migrationStats.skipped += userFavorites.length
        continue
      }

      for (const favorite of userFavorites) {
        try {
          // Check if favorite already exists
          const existing = await pool.query(
            'SELECT id FROM favorites WHERE user_id = $1 AND symbol = $2',
            [userId, favorite.symbol.toLowerCase()]
          )

          if (existing.rows.length > 0) {
            console.log(`⏭️  Favorite ${favorite.symbol} for user ${userId} already exists`)
            migrationStats.skipped++
            continue
          }

          const cryptoId = favorite.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          const addedAt = favorite.addedAt ? new Date(favorite.addedAt) : new Date()

          await pool.query(`
            INSERT INTO favorites (user_id, crypto_id, symbol, name, added_at)
            VALUES ($1, $2, $3, $4, $5)
          `, [
            userId,
            cryptoId,
            favorite.symbol.toLowerCase(),
            favorite.name,
            addedAt
          ])

          console.log(`✅ Migrated favorite: ${favorite.symbol} for user ${userId}`)
          migrationStats.migrated++

        } catch (error) {
          console.error(`❌ Failed to migrate favorite ${favorite.symbol}:`, error.message)
          migrationStats.errors.push(`Favorite ${favorite.symbol}: ${error.message}`)
        }
      }
    }

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📝 No favorites.json file found, skipping favorites migration')
    } else {
      console.error('❌ Error reading favorites file:', error)
      throw error
    }
  }

  return migrationStats
}

async function main() {
  console.log('🚀 Starting migration to PostgreSQL...')
  console.log('Database URL:', process.env.DATABASE_URL ? 'Present' : 'Missing')

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required')
    process.exit(1)
  }

  try {
    // Test connection
    await pool.query('SELECT NOW()')
    console.log('✅ PostgreSQL connection successful')

    // Initialize tables
    await initializeTables()

    // Migrate data
    const userStats = await migrateUsers()
    const favoriteStats = await migrateFavorites()

    // Summary
    console.log('\n📊 Migration Summary:')
    console.log('===================')
    console.log(`Users: ${userStats.migrated}/${userStats.total} migrated, ${userStats.skipped} skipped`)
    console.log(`Favorites: ${favoriteStats.migrated}/${favoriteStats.total} migrated, ${favoriteStats.skipped} skipped`)

    if (userStats.errors.length > 0 || favoriteStats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:')
      [...userStats.errors, ...favoriteStats.errors].forEach(error => {
        console.log(`   • ${error}`)
      })
    }

    console.log('\n✅ Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { main as migrate }