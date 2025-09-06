import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/create',
  '/creator',
  '/game-creator',
  '/profile',
  '/settings',
  '/analytics',
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth',
  '/auth/callback',
  '/games',
  '/community',
  '/about',
  '/pricing',
]

// Define admin routes that require special permissions
const adminRoutes = [
  '/admin',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes we don't need to protect
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Update Supabase session
  const response = await updateSession(request)

  // Get the updated request with the session
  const supabase = response.locals?.supabase
  const user = response.locals?.user

  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  )

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // Handle admin routes
  if (isAdminRoute) {
    if (!user) {
      const redirectUrl = new URL('/auth?redirect=' + pathname, request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user has admin privileges (you can customize this logic)
    // For now, we'll assume any authenticated user can access admin (update as needed)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, is_verified')
        .eq('id', user.id)
        .single()

      if (!profile || (!profile.is_verified && profile.subscription_tier !== 'max')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    } catch (error) {
      console.error('Error checking admin permissions:', error)
      return NextResponse.redirect(new URL('/auth?redirect=' + pathname, request.url))
    }
  }

  // Handle protected routes
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth?redirect=' + pathname, request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Handle auth routes - redirect to dashboard if already logged in
  if (pathname.startsWith('/auth') && user && !pathname.includes('callback')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Add security headers
  const responseWithHeaders = NextResponse.next()
  
  // Security headers
  responseWithHeaders.headers.set('X-Frame-Options', 'DENY')
  responseWithHeaders.headers.set('X-Content-Type-Options', 'nosniff')
  responseWithHeaders.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  responseWithHeaders.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  // Content Security Policy (adjust as needed for your application)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https: wss: ws:",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ')

  responseWithHeaders.headers.set('Content-Security-Policy', csp)

  return response || responseWithHeaders
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}