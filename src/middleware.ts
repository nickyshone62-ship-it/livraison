import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TOKEN_COOKIE_NAME } from '@/lib/auth';

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  // Legacy route redirect
  if (pathname.startsWith('/livreur')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace('/livreur', '/driver');
    return NextResponse.redirect(url);
  }

  const isClientRoute = pathname.startsWith('/client');
  const isDriverRoute = pathname.startsWith('/driver');
  const isAdminRoute = pathname.startsWith('/admin');

  if (isClientRoute || isDriverRoute || isAdminRoute) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/connexion';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const session = decodeJwtPayload(token);
    if (!session || !session.userId) {
      const url = request.nextUrl.clone();
      url.pathname = '/connexion';
      return NextResponse.redirect(url);
    }

    const role = (session.role || 'client').toLowerCase();

    // ADMIN PRIVILEGE: Admin has full access to /admin, /client, AND /driver
    if (role === 'admin') {
      return NextResponse.next();
    }

    // CLIENT RESTRICTIONS: Client can ONLY access /client
    if (role === 'client') {
      if (isAdminRoute || isDriverRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/client';
        return NextResponse.redirect(url);
      }
    }

    // DRIVER RESTRICTIONS: Driver can ONLY access /driver
    if (role === 'driver') {
      if (isAdminRoute || isClientRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/driver';
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/client/:path*', '/driver/:path*', '/livreur/:path*', '/admin/:path*'],
};
