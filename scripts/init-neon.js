const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

async function initNeonDatabase() {
  console.log('🚀 Initialisation de la base de données Neon...')

  if (!process.env.DATABASE_URL) {
    console.error('❌ Variable d\'environnement DATABASE_URL manquante')
    console.log('Créez un fichier .env.local avec :')
    console.log('DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/dbname?sslmode=require"')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    // Test de connexion
    console.log('🔗 Test de connexion...')
    const client = await pool.connect()
    const result = await client.query('SELECT NOW() as current_time, version() as version')
    console.log('✅ Connexion réussie:', result.rows[0].current_time)
    client.release()

    // Création des tables
    console.log('📋 Création des tables...')

    // Table des utilisateurs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        google_id VARCHAR UNIQUE NOT NULL,
        email VARCHAR NOT NULL,
        name VARCHAR,
        image_url VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Table users créée')

    // Table des favoris crypto
    await pool.query(`
      CREATE TABLE IF NOT EXISTS crypto_favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        added_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, symbol)
      );
    `)
    console.log('✅ Table crypto_favorites créée')

    // Index pour les performances
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON crypto_favorites(user_id);
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_favorites_symbol ON crypto_favorites(symbol);
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    `)
    console.log('✅ Index créés')

    // Vérification des tables
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)

    console.log('📊 Tables créées:')
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })

    console.log('🎉 Base de données Neon initialisée avec succès!')

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Exécuter l'initialisation si le script est appelé directement
if (require.main === module) {
  initNeonDatabase()
}

module.exports = { initNeonDatabase }