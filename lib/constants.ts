export const MIN_ADULTS = 1;
export const MIN_CHILDREN = 0;
export const MIN_ROOMS = 1;
export const MAX_ADULTS = 30;
export const MAX_CHILDREN = 6;
export const MAX_ROOMS = 10;

export const MAX_HOTELS_ON_MAP_VIEW = 50;

export const FILTER_MIN_PRICE = 100_000;
export const FILTER_MAX_PRICE = 20_000_000;
export const FILTER_PRICE_STEP = 100_000;

export const MAX_REVIEW_POINTS = 5;
export const MAX_LOCATION_AUTOCOMPLETE_RESULTS = 10;

export const CACHE_TAGS = {
  userInfo: "user_info",
}

export const PATHS = {
  home: '/',
  signIn: '/sign-in',
  signUp: '/sign-up',
  otp: '/sign-up/otp',
  favorites: '/favorites',
  account: '/account',
  accountHistory: '/account/history',
  accountRecentlyViewed: '/account/recently-viewed',
  bookings: '/bookings',
  hotels: '/hotels',
  search: '/search',
  searchMap: '/search/map',
  forgotPassword: '/forgot-password',

  hotelDashboard: '/dashboard',
  hotelRooms: '/dashboard/rooms',
  hotelStatistics: '/dashboard/analytics',
  hotelBookings: '/dashboard/bookings',
  hotelReviews: '/dashboard/reviews',

  signUpHotel: '/sign-up-hotel',

  adminDashboard: '/dashboard-admin',

  unauthorized: '/unauthorized',
  notFound: '/notfound'
};