import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TOKEN_COOKIE_NAME = 'ouaga_livraison_token';

export function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  // Protected route paths requiring authentication
  const isProtectedRoute =
    pathname.startsWith('/client') ||
    pathname.startsWith('/livreur') ||
    pathname.startsWith('/admin');

  if (isProtectedRoute && !token) {
    // Redirect unauthenticated users directly to root mandatory signup/login wall
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/client/:path*', '/livreur/:path*', '/admin/:path*'],
};
