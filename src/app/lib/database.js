// Production database layer - PostgreSQL with Prisma ORM for scalability and performance
// Migrated from JSON files to PostgreSQL for production-ready data persistence

import {
  createUser as createUserPrisma,
  authenticateUser as authenticateUserPrisma,
  getUserById as getUserByIdPrisma,
  updateUser as updateUserPrisma,
  getUserFavorites as getUserFavoritesPrisma,
  addUserFavorite as addUserFavoritePrisma,
  removeUserFavorite as removeUserFavoritePrisma,
  getDatabaseInfo as getDatabaseInfoPrisma,
  getDatabaseType as getDatabaseTypePrisma,
  initializeDatabase as initializeDatabasePrisma,
  clearCache as clearCachePrisma,
  changeUserPassword as changeUserPasswordPrisma,
  updateUserFavorites as updateUserFavoritesPrisma,
  performHealthCheck,
  closeDatabase
} from './database-prisma.js'

// Production-ready PostgreSQL system with Prisma ORM
console.log('🗄️ Using PostgreSQL with Prisma ORM for production-ready data persistence')

// Direct API exports to Prisma PostgreSQL system
export async function createUser(email, password, username) {
  return await createUserPrisma(email, password, username)
}

export async function authenticateUser(email, password) {
  return await authenticateUserPrisma(email, password)
}

export async function getUserById(id) {
  return await getUserByIdPrisma(id)
}

export async function updateUser(userId, updates) {
  return await updateUserPrisma(userId, updates)
}

export async function getUserFavorites(userId) {
  return await getUserFavoritesPrisma(userId)
}

export async function addUserFavorite(userId, crypto) {
  return await addUserFavoritePrisma(userId, crypto)
}

export async function removeUserFavorite(userId, symbol) {
  return await removeUserFavoritePrisma(userId, symbol)
}

// Enhanced functionality with Prisma
export async function changeUserPassword(userId, currentPassword, newPassword) {
  return await changeUserPasswordPrisma(userId, currentPassword, newPassword)
}

export async function updateUserFavorites(userId, operations) {
  return await updateUserFavoritesPrisma(userId, operations)
}

// Utility exports for database management
export async function getDatabaseInfo() {
  return await getDatabaseInfoPrisma()
}

export function getDatabaseType() {
  return getDatabaseTypePrisma()
}

export function clearCache() {
  return clearCachePrisma()
}

export async function initializeDatabase() {
  return await initializeDatabasePrisma()
}

// Health monitoring
export async function getHealthCheck() {
  return await performHealthCheck()
}

// Graceful shutdown
export async function closeDatabaseConnection() {
  return await closeDatabase()
}