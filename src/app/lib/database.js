// Optimized database layer - Simple JSON-based authentication for maximum performance
// Reverted from complex PostgreSQL system to fast JSON file-based system

import {
  createUser as createUserSimple,
  authenticateUser as authenticateUserSimple,
  getUserById as getUserByIdSimple,
  updateUser as updateUserSimple,
  getUserFavorites as getUserFavoritesSimple,
  addUserFavorite as addUserFavoriteSimple,
  removeUserFavorite as removeUserFavoriteSimple,
  getDatabaseInfo as getDatabaseInfoSimple,
  getDatabaseType as getDatabaseTypeSimple,
  clearDatabaseCache
} from './database-simple.js'

// Simple, fast database system - no complex fallbacks needed
console.log('📁 Using optimized JSON-based authentication system for maximum performance')

// Direct API exports to simple JSON system - no fallbacks, maximum performance
export async function createUser(email, password, username) {
  return await createUserSimple(email, password, username)
}

export async function authenticateUser(email, password) {
  return await authenticateUserSimple(email, password)
}

export async function getUserById(id) {
  return await getUserByIdSimple(id)
}

export async function updateUser(userId, updates) {
  return await updateUserSimple(userId, updates)
}

export async function getUserFavorites(userId) {
  return await getUserFavoritesSimple(userId)
}

export async function addUserFavorite(userId, crypto) {
  return await addUserFavoriteSimple(userId, crypto)
}

export async function removeUserFavorite(userId, symbol) {
  return await removeUserFavoriteSimple(userId, symbol)
}

// Utility exports for database management
export function getDatabaseInfo() {
  return getDatabaseInfoSimple()
}

export function getDatabaseType() {
  return getDatabaseTypeSimple()
}

export function clearCache() {
  return clearDatabaseCache()
}

// No complex initialization needed - simple system initializes on first use
export async function initializeDatabase() {
  console.log('✅ Simple JSON database ready - no initialization required')
  return 'SimpleJSON'
}