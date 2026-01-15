import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/register', '/about', '/contact'];
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // Public shop routes - accessible without authentication
  const publicShopRoutes = ['/shop'];
  const isPublicShopRoute = publicShopRoutes.some((route) => pathname.startsWith(route));

  // API routes that don't require authentication
  const publicApiRoutes = ['/api/auth', '/api/products', '/api/shop'];
  const isPublicApiRoute = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  );
  
  // Always allow NextAuth API routes to prevent CLIENT_FETCH_ERROR
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Get token first before any checks that might use it
  let token = null;
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
  } catch (error) {
    console.error('Middleware - Error getting token:', error);
    // Continue without token, will redirect to login if needed
  }

  console.log(`Middleware - Path: ${pathname}`);
  console.log(`Middleware - Token exists: ${!!token}`);
  if (token) {
    console.log(`Middleware - User Role: ${token.role}`);
  }

  // Allow public routes, public shop routes, and public API routes
  if (isPublicRoute || isPublicShopRoute || isPublicApiRoute) {
    // Special handling for root path - redirect authenticated users to their dashboard
    if (pathname === '/' && token) {
      const userRole = (token.role as string) || '';
      console.log(`Middleware - Root path redirect for role: ${userRole}`);
      const roleLower = userRole?.toLowerCase();

      if (roleLower === 'admin') {
        console.log('Middleware - Redirecting admin to /admin/dashboard');
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else if (roleLower === 'staff') {
        console.log('Middleware - Redirecting staff to /staff/dashboard');
        return NextResponse.redirect(new URL('/staff/dashboard', request.url));
      } else {
        console.log('Middleware - Redirecting customer to /customer/dashboard');
        return NextResponse.redirect(new URL('/customer/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = (token.role as string) || '';

  // Live session routes - accessible by all authenticated users (Admin, Staff, Customer)
  if (pathname.startsWith('/live-session')) {
    // All authenticated users can access live sessions
    // Additional authorization is handled within the session API
    return NextResponse.next();
  }

  // Role-based route protection
  // Check for Admin role (case-insensitive for robustness)
  if (pathname.startsWith('/admin')) {
    const roleLower = userRole?.toLowerCase();
    if (roleLower !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  if (pathname.startsWith('/staff') && userRole?.toLowerCase() !== 'staff' && userRole?.toLowerCase() !== 'admin') {
    // If user is customer trying to access staff routes, redirect to customer dashboard
    if (userRole?.toLowerCase() === 'customer') {
      return NextResponse.redirect(new URL('/customer/dashboard', request.url));
    }
    // If user is admin, allow access to staff routes for admin purposes
    if (userRole?.toLowerCase() !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  if (pathname.startsWith('/customer')) {
    const roleLower = userRole?.toLowerCase();

    if (roleLower !== 'customer' && roleLower !== 'admin') {
      // If user is staff trying to access customer routes, redirect to staff dashboard
      if (roleLower === 'staff') {
        console.log(`Middleware - Redirecting staff from ${pathname} to /staff/dashboard`);
        return NextResponse.redirect(new URL('/staff/dashboard', request.url));
      }
      // Unauthorized access
      console.log(`Middleware - Unauthorized access to ${pathname} by role: ${userRole}`);
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    console.log(`Middleware - Allowing ${roleLower} access to ${pathname}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static file extensions and API auth routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|gif|svg|webp|ico|pdf|txt|html|mp4|mov|webm|js|css|json)).*)',
  ],
};
