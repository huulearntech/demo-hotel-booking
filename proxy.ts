import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PATHS } from './lib/constants';
import { UserRole } from './lib/generated/prisma/enums';

const pathsRequiringRole: Record<string, (UserRole | "UNAUTH")[]> = {
  // unauthenticated routes
  [PATHS.signIn]: ['UNAUTH'],
  [PATHS.signUp]: ['UNAUTH'],
  [PATHS.forgotPassword]: ['UNAUTH'],
  [PATHS.signUpHotel]: ['UNAUTH'],

  // user and part of hotel owner 
  [PATHS.home]: ['USER', 'UNAUTH'],
  [PATHS.account]: ['USER', 'HOTEL_OWNER', 'ADMIN'],
  [PATHS.accountHistory]: ['USER'],
  [PATHS.accountRecentlyViewed]: ['USER'],
  [PATHS.favorites]: ['USER'],
  [PATHS.bookings]: ['USER', 'UNAUTH'],
  [PATHS.hotels]: ['USER', 'UNAUTH'],
  [PATHS.search]: ['USER', 'UNAUTH'],
  [PATHS.searchMap]: ['USER', 'UNAUTH'],
  [PATHS.unauthorized]: ['USER', 'UNAUTH', 'HOTEL_OWNER', 'ADMIN'],
  [PATHS.notFound]: ['USER', 'UNAUTH', 'HOTEL_OWNER', 'ADMIN'],

  // Hotel dashboard sub-routes
  [PATHS.hotelDashboard]: ['HOTEL_OWNER'],
  [PATHS.hotelRooms]: ['HOTEL_OWNER'],
  [PATHS.hotelStatistics]: ['HOTEL_OWNER'],
  [PATHS.hotelBookings]: ['HOTEL_OWNER'],
  [PATHS.hotelReviews]: ['HOTEL_OWNER'],
  
  // Admin
  [PATHS.adminDashboard]: ['ADMIN'],
};

export const proxy = auth(async function handleProxy(request) {
  const { pathname, origin } = request.nextUrl;
  const isAuthenticated = Boolean(request.auth);
  const userRole = request.auth?.user.role ?? "UNAUTH";

  const isSignInOrSignUp = [PATHS.signIn, PATHS.signUp].some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  // Find a matching path rule early so we can allow routes that explicitly permit "UNAUTH"
  const matched = Object.entries(pathsRequiringRole).find(([pathKey]) => {
    return pathname === pathKey || pathname.startsWith(pathKey + '/');
  });

  if (!isAuthenticated && !isSignInOrSignUp) {
    const allowedRoles = matched ? matched[1] : undefined;
    // If the route explicitly allows UNAUTH, don't force sign-in
    if (!(allowedRoles && allowedRoles.includes("UNAUTH"))) {
      const signInUrl = new URL(PATHS.signIn, origin);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  if (isAuthenticated && isSignInOrSignUp) {
    return NextResponse.redirect(new URL(PATHS.home, origin));
  }

  if (matched) {
    const [, allowedRoles] = matched;

    if (!allowedRoles.includes(userRole)) {

      // If not authenticated, redirect to sign-in with callback
      if (!isAuthenticated) {
        const signInUrl = new URL(PATHS.signIn, origin);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
      }

      // Redirect authenticated users to a safe default based on their role to avoid redirect loops.
      const defaultRedirectByRole: Record<UserRole | "UNAUTH", string> = {
        USER: PATHS.home,
        HOTEL_OWNER: PATHS.hotelDashboard,
        ADMIN: PATHS.adminDashboard,
        UNAUTH: PATHS.signIn,
      };

      const targetPath = defaultRedirectByRole[userRole];
      const targetUrl = new URL(targetPath, origin);

      // If the target is the same as current path (to be safe), allow the request to continue.
      if (pathname === targetUrl.pathname || pathname.startsWith(targetUrl.pathname + '/')) {
        return NextResponse.next();
      }

      return NextResponse.redirect(targetUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/',
    '/sign-in/:path*',
    '/sign-up/:path*',
    '/favorites/:path*',
    '/account/:path*',
    '/account/history/:path*',
    '/account/recently-viewed/:path*',
    '/dashboard-admin/:path*',
    '/bookings/:path*',
    '/hotels/:path*',
    '/search/:path*',
    '/search/map/:path*',
    '/forgot-password/:path*',
    '/dashboard/:path*',
    '/dashboard/rooms/:path*',
    '/dashboard/analytics/:path*',
    '/dashboard/bookings/:path*',
    '/dashboard/reviews/:path*',
    '/sign-up-hotel/:path*',
  ],
};