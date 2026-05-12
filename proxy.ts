import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PATHS } from './lib/constants';
import { UserRole } from './lib/generated/prisma/enums';

const pathsRequiringRole: Record<string, (UserRole | "UNAUTH")[]> = {
  // unauthenticated routes
  [PATHS.signIn]: ['UNAUTH'],
  [PATHS.signUp]: ['UNAUTH'],
  [PATHS.otp]: ['UNAUTH'],
  [PATHS.forgotPassword]: ['UNAUTH'],
  [PATHS.signUpHotel]: ['UNAUTH'],

  // user and part of hotel owner 
  [PATHS.home]: ['USER', 'UNAUTH'],
  [PATHS.account]: ['USER', 'HOTEL_OWNER', 'ADMIN'],
  [PATHS.accountHistory]: ['USER'],
  [PATHS.accountRecentlyViewed]: ['USER'],
  [PATHS.favorites]: ['USER'],
  [PATHS.bookings]: ['USER'],
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
  [PATHS.hotelRegisterInformation]: ['HOTEL_OWNER'],

  // Admin
  [PATHS.adminDashboard]: ['ADMIN'],
};


// Redirect authenticated users to a safe default based on their role to avoid redirect loops.
const defaultRedirectByRole: Record<UserRole, string> = {
  USER: PATHS.home,
  HOTEL_OWNER: PATHS.hotelDashboard,
  ADMIN: PATHS.adminDashboard,
};

// FIXME: when callback is dashboard but user is "USER",
// though it stills return the correct home page, the URL in the browser is still "/dashboard", which is confusing.
export const proxy = auth(async function handleProxy(request) {
  const { pathname, origin } = request.nextUrl;
  const userRole = request.auth?.user.role ?? "UNAUTH";
  const userStatus = request.auth?.user.status ?? null;

  // Prefer the most specific (longest) pathKey so "/account/history" wins over "/account"
  const matched = Object.entries(pathsRequiringRole)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([pathKey]) => pathname === pathKey || pathname.startsWith(pathKey + '/'));

  if (matched) {
    const [pathKey, allowedRoles] = matched;

    if (userStatus === 'PENDING') {
      const isOtpRoute = pathKey === PATHS.otp || pathname.startsWith(PATHS.otp + '/');
      if (isOtpRoute) {
        return NextResponse.next();
      }
      const otpUrl = new URL(PATHS.otp, origin);
      return NextResponse.redirect(otpUrl);
    }

    if (userRole === "HOTEL_OWNER") {
      if (userStatus === "HOTEL_OWNER_FILLING_INFORMATION" && pathKey !== PATHS.hotelRegisterInformation) {
        const hotelInfoUrl = new URL(PATHS.hotelRegisterInformation, origin);
        return NextResponse.redirect(hotelInfoUrl);
      } else if (userStatus === "ACTIVE" && pathKey === PATHS.hotelRegisterInformation) {
        const targetUrl = new URL(PATHS.hotelDashboard, origin);
        return NextResponse.redirect(targetUrl);
      }
    }


    if (!allowedRoles.includes(userRole)) {
      if (userRole === "UNAUTH") {
        const signInUrl = new URL(PATHS.signIn, origin);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
      }

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
    '/otp/:path*',
    '/hotel-register-information/:path*',
  ],
};