import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)

export async function middleware(request) {
  const pathname = request.nextUrl.pathname

  // Allow public routes (login, register, API routes, static files)
  const publicRoutes = ['/', '/api/auth/login', '/api/auth/register', '/api/auth/logout']
  const isPublicRoute = publicRoutes.includes(pathname)
  const isApiRoute = pathname.startsWith('/api/')
  const isStaticFile = pathname.startsWith('/_next/') || pathname.includes('.')

  // Skip middleware for public routes, API routes, and static files
  if (isPublicRoute || isApiRoute || isStaticFile) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    console.log('No auth token found, redirecting to login')
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    // Verify the JWT token
    await jwtVerify(token, secret)
    console.log('Token verified, allowing access to:', pathname)
    return NextResponse.next()
  } catch (error) {
    console.log('Invalid token, redirecting to login:', error.message)

    // Clear the invalid cookie
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    })

    return response
  }
}

export const config = {
  // PROTECTION TOTALE de toutes les routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}