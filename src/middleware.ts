import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas permitidas (públicas)
  const allowedPaths = [
    '/',
    '/features',
    '/plans', 
    '/how',
    '/favicon.ico'
  ]

  // Si la ruta no está en las permitidas y no es un archivo estático, redirigir a home
  if (!allowedPaths.includes(pathname) && 
      !pathname.startsWith('/_next') && 
      !pathname.startsWith('/api') &&
      !pathname.includes('.')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}