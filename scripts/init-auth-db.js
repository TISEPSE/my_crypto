require('dotenv').config({ path: '.env.local' })
const { initDatabase } = require('../src/app/lib/database.js')

async function main() {
  try {
    console.log('🚀 Initialisation de la base de données d\'authentification...')

    if (!process.env.DATABASE_URL) {
      console.error('❌ Variable d\'environnement DATABASE_URL manquante')
      console.log('Créez un fichier .env.local avec :')
      console.log('DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/dbname?sslmode=require"')
      process.exit(1)
    }

    await initDatabase()

    console.log('✅ Base de données initialisée avec succès!')
    console.log('📋 Tables créées:')
    console.log('   - users (utilisateurs avec email/password)')
    console.log('   - user_favorites (favoris crypto par utilisateur)')
    console.log('   - user_sessions (tracking des sessions)')

    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    process.exit(1)
  }
}

main()