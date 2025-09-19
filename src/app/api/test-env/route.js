import { NextResponse } from 'next/server'

export async function GET() {
  const isVercel = process.env.VERCEL === '1' ||
                   process.env.VERCEL_ENV ||
                   process.env.NODE_ENV === 'production'

  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      isVercel: isVercel
    },
    message: `Running on ${isVercel ? 'Vercel (in-memory database)' : 'Local (file database)'}`
  })
}