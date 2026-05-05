import { type BookingStatus } from "./generated/prisma/enums";
import { type SearchBar_FormOutput } from "@/lib/zod_schemas/search-bar";

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


export const BOOKING_STATUS_BADGE_COLORS: Record<BookingStatus, { text: string; variant: string }> = {
  PENDING_TO_PAY: { text: "Đang chờ", variant: "bg-yellow-100 text-yellow-800" },
  PAID: { text: "Đã thanh toán", variant: "bg-green-100 text-green-800" },
  CHECKED_IN: { text: "Đã nhận phòng", variant: "bg-sky-100 text-sky-800" },
  CHECKED_OUT: { text: "Đã trả phòng", variant: "bg-sky-100 text-sky-800" },
  CANCELLED: { text: "Đã huỷ", variant: "bg-red-100 text-red-800" },
};


// TODO: handle date mismatch between server and client.
export const DEFAULT_SEARCH_BAR_VALUES: SearchBar_FormOutput = {
  location: {
    id: "",
    type: "none"
  },
  inOutDates: {
    from: new Date(),
    to: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  guestsAndRooms: {
    numAdults: 2,
    numChildren: 0,
    numRooms: 1
  }
};