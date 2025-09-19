import { NextResponse } from 'next/server'
import { getDatabaseInfo, getDatabaseType } from '../../../lib/database.js'

export async function GET() {
  try {
    // Get comprehensive database information
    const databaseInfo = await getDatabaseInfo()
    const currentType = getDatabaseType()

    const response = {
      status: 'healthy',
      currentDatabase: currentType,
      info: databaseInfo,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        isVercel: Boolean(process.env.VERCEL),
        hasPostgresUrl: Boolean(process.env.DATABASE_URL),
        timestamp: new Date().toISOString()
      },
      capabilities: {
        canUsePostgres: Boolean(process.env.DATABASE_URL),
        canUseFileSystem: !process.env.VERCEL,
        fallbackAvailable: true
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Database health check failed:', error)

    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
        currentDatabase: null,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          isVercel: Boolean(process.env.VERCEL),
          hasPostgresUrl: Boolean(process.env.DATABASE_URL),
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { action } = await request.json()

    switch (action) {
      case 'migrate':
        // This would trigger a migration - implement with caution
        return NextResponse.json(
          { message: 'Migration functionality would be implemented here for admin use' },
          { status: 501 }
        )

      case 'reset':
        // Reset/reinitialize database - implement with caution
        return NextResponse.json(
          { message: 'Reset functionality would be implemented here for admin use' },
          { status: 501 }
        )

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: migrate, reset' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Database action failed:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}