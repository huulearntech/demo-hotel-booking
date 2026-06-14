## What this project is

This app is designed for two main audiences:
- hotel bookers: users who search for hotels, browse room availability, place bookings, view booking history, and manage favorites
- hotel owners / managers: hotel staff who manage hotel listings, rooms, bookings, analytics, and reviews

## What the project does

For hotel bookers:
- search hotels by destination and filters
- view hotel details, room availability, facilities, and reviews
- book rooms with pricing and date selection
- manage user profile and booking history
- save favorite hotels and see recently viewed properties
- verify accounts using OTP

For hotel owners / managers:
- manage hotel dashboard and hotel information
- create and update room types and room inventory
- view bookings and booking reports
- access analytics dashboards, occupancy, revenue, and ratings data
- read guest reviews and manage hotel content

## Technology stack

- Next.js 16 App Router
- TypeScript
- TailwindCSS
- shadcn
- Prisma
- PostgreSQL
- NextAuth
- Tanstack React Query for client data fetching and caching
- mailgun email sending for OTP and notifications
- `vnpay` integration for payment handling

## Key folders

- `app/`: Next.js app routes, page layouts, searching, booking and payment pages
- `prisma/`: Prisma schema, migrations, seed scripts, SQL queries
- `lib/`: shared library code for actions, including auth, database access, payment, mail, and validation

## Run locally

Clone the repository:

```bash
git clone https://github.com/huulearntech/demo-hotel-booking.git
cd demo-hotel-booking
```

Install dependencies:

```bash
npm install
# or pnpm install
```

Create a `.env` file with your environment variables, including database connection, NextAuth settings, email credentials, and payment keys.

Run the development server:

```bash
npm run dev
# or pnpm dev
```

Open http://localhost:3000 in your browser.

## Notes

- Update `prisma/schema.prisma` and run `npx prisma migrate dev` when changing the database schema.
- App Router pages are defined in the `app/` directory, including auth, hotel management, bookings, payment return pages, and search.
- Email and payment integrations are implemented in server-side code only.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org)
