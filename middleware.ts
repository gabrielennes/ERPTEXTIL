import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isValidSession(sessionCookie: string | undefined): boolean {
  if (!sessionCookie) {
    return false
  }

  try {
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie, 'base64').toString()
    )
    
    // Validar estrutura básica da sessão
    return !!(sessionData?.email && sessionData?.role)
  } catch (error) {
    return false
  }
}

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const { pathname } = request.nextUrl

  // Permitir acesso à página de login sem autenticação
  if (pathname === '/login') {
    // Se já está logado, redirecionar para o dashboard
    if (isValidSession(session)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Proteger todas as outras rotas
  if (!isValidSession(session)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}









