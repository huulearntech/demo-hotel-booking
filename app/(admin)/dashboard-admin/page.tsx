'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table'


import type { BookingStatus } from '@/lib/generated/prisma/enums'

type Booking = {
  id: string
  guestName: string
  hotelName: string
  amount: number
  currency: string
  status: BookingStatus
  dateFrom: string
  dateTo: string
  createdAt: string
  timeline: { time: string; event: string }[]
}

type Hotel = {
  id: string
  name: string
  city: string
  approved: boolean
  banned: boolean
  ownerEmail: string
}

type User = {
  id: string
  name: string
  email: string
  role: 'guest' | 'host' | 'admin'
  banned: boolean
}

const nowISO = () => new Date().toISOString()

const sampleBookings: Booking[] = [
  {
    id: 'BKG-1001',
    guestName: 'Alice Johnson',
    hotelName: 'Seaside Resort',
    amount: 320,
    currency: 'USD',
    status: 'PAID',
    dateFrom: '2026-05-01',
    dateTo: '2026-05-05',
    createdAt: nowISO(),
    timeline: [
      { time: '2026-04-10 09:12', event: 'Booked' },
      { time: '2026-04-12 14:30', event: 'Payment captured' },
      { time: '2026-04-20 08:00', event: 'Confirmed by hotel' },
    ],
  },
  {
    id: 'BKG-1002',
    guestName: 'Bob Smith',
    hotelName: 'Mountain Stay',
    amount: 150,
    currency: 'USD',
    status: 'PENDING_TO_PAY',
    dateFrom: '2026-06-10',
    dateTo: '2026-06-12',
    createdAt: nowISO(),
    timeline: [{ time: '2026-04-15 11:00', event: 'Requested' }],
  },
  {
    id: 'BKG-1003',
    guestName: 'Carol Lee',
    hotelName: 'City Center Inn',
    amount: 210,
    currency: 'USD',
    status: 'CANCELLED',
    dateFrom: '2026-04-01',
    dateTo: '2026-04-03',
    createdAt: nowISO(),
    timeline: [
      { time: '2026-03-01 10:10', event: 'Booked' },
      { time: '2026-03-20 16:00', event: 'Cancelled by guest' },
    ],
  },
]

const sampleHotels: Hotel[] = [
  { id: 'HTL-2001', name: 'Seaside Resort', city: 'Miami', approved: true, banned: false, ownerEmail: 'owner1@example.com' },
  { id: 'HTL-2002', name: 'Mountain Stay', city: 'Aspen', approved: false, banned: false, ownerEmail: 'owner2@example.com' },
  { id: 'HTL-2003', name: 'City Center Inn', city: 'New York', approved: true, banned: true, ownerEmail: 'owner3@example.com' },
]

const sampleUsers: User[] = [
  { id: 'USR-3001', name: 'Alice Johnson', email: 'alice@example.com', role: 'guest', banned: false },
  { id: 'USR-3002', name: 'Eve Host', email: 'eve@example.com', role: 'host', banned: false },
  { id: 'USR-3003', name: 'Bad Actor', email: 'bad@example.com', role: 'guest', banned: true },
]

function KPI({ title, value, delta }: { title: string; value: string | number; delta?: string }) {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-0">
        <div className="text-sm text-gray-500">{title}</div>
      </CardHeader>
      <CardContent className="flex items-baseline gap-2">
        <div className="text-2xl font-semibold">{value}</div>
        {delta && <div className="text-sm text-green-600">{delta}</div>}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: BookingStatus }) {
const map: Record<BookingStatus, { text: string; variant: string }> = {
  PENDING_TO_PAY: { text: "Đang chờ", variant: "bg-yellow-100 text-yellow-800" },
  PAID: { text: "Đã thanh toán", variant: "bg-green-100 text-green-800" },
  CHECKED_IN: { text: "Đã nhận phòng", variant: "bg-sky-100 text-sky-800" },
  CHECKED_OUT: { text: "Đã trả phòng", variant: "bg-sky-100 text-sky-800" },
  CANCELLED: { text: "Đã huỷ", variant: "bg-red-100 text-red-800" },
};
  return <span className={`px-2 py-1 rounded text-xs ${map[status]}`}>{status.replace('_', ' ')}</span>
}

export default function Page() {
  const [bookings, setBookings] = useState<Booking[]>(sampleBookings)
  const [hotels, setHotels] = useState<Hotel[]>(sampleHotels)
  const [users, setUsers] = useState<User[]>(sampleUsers)

  // Bookings UI
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('all')
  const [bookingSearch, setBookingSearch] = useState<string>('')
  const [selectedBookings, setSelectedBookings] = useState<Record<string, boolean>>({})
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null)

  // Hotels UI
  const [hotelFilter, setHotelFilter] = useState<string>('all')

  // Users UI
  const [userQuery, setUserQuery] = useState('')

  const totals = useMemo(() => {
    const bookingsCount = bookings.length
    const revenue = bookings.reduce((s, b) => s + b.amount, 0)
    const activeCoupons = 4 // placeholder
    const pendingHotels = hotels.filter((h) => !h.approved).length
    return { bookingsCount, revenue, activeCoupons, pendingHotels }
  }, [bookings, hotels])

  useEffect(() => {
    // reset selection when bookings change
    setSelectedBookings({})
  }, [bookings])

  // Filtering bookings
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilterStatus !== 'all' && b.status !== bookingFilterStatus) return false
    if (bookingSearch && !`${b.id} ${b.guestName} ${b.hotelName}`.toLowerCase().includes(bookingSearch.toLowerCase())) return false
    return true
  })

  function toggleSelectBooking(id: string) {
    setSelectedBookings((s) => ({ ...s, [id]: !s[id] }))
  }

  function selectAllVisible() {
    const map = { ...selectedBookings }
    filteredBookings.forEach((b) => {
      map[b.id] = true
    })
    setSelectedBookings(map)
  }

  function clearSelection() {
    setSelectedBookings({})
  }

  function bulkCancel() {
    const ids = Object.keys(selectedBookings).filter((k) => selectedBookings[k])
    if (!ids.length) return
    setBookings((prev) => prev.map((b) => (ids.includes(b.id) ? { ...b, status: 'CANCELLED', timeline: [...b.timeline, { time: nowISO(), event: 'Cancelled by admin (bulk)' }] } : b)))
    clearSelection()
  }

  function updateBookingStatus(id: string, status: BookingStatus) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status, timeline: [...b.timeline, { time: nowISO(), event: `Status changed to ${status}` }] } : b)))
  }

  function openBookingDetail(b: Booking) {
    setActiveBooking(b)
  }

  function closeBookingDetail() {
    setActiveBooking(null)
  }

  // Hotels actions
  function approveHotel(id: string) {
    setHotels((prev) => prev.map((h) => (h.id === id ? { ...h, approved: true } : h)))
  }

  function rejectHotel(id: string) {
    setHotels((prev) => prev.map((h) => (h.id === id ? { ...h, approved: false } : h)))
  }

  function toggleHotelBan(id: string) {
    setHotels((prev) => prev.map((h) => (h.id === id ? { ...h, banned: !h.banned } : h)))
  }

  // Users actions
  function toggleUserBan(id: string) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, banned: !u.banned } : u)))
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of bookings, hotels and users</p>
        </div>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPI title="Bookings" value={totals.bookingsCount} delta="+12%" />
        <KPI title="Revenue" value={`$${totals.revenue.toFixed(2)}`} delta="+8%" />
        <KPI title="Active Coupons" value={totals.activeCoupons} />
        <KPI title="Pending Hotels" value={totals.pendingHotels} />
      </section>

      {/* Bookings section */}
      <section className="bg-white p-4 rounded shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent Bookings</h2>
          <div className="flex items-center gap-2">
            <input
              className="border rounded px-2 py-1 text-sm"
              placeholder="Search bookings..."
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
            />
            <Select value={bookingFilterStatus} onValueChange={(value) => setBookingFilterStatus(value)}>
              <SelectTrigger className="w-48 border rounded px-2 py-1 text-sm">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked-in</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm" onClick={selectAllVisible}>
              Select all
            </button>
            <button className="bg-gray-100 px-3 py-1 rounded text-sm" onClick={clearSelection}>
              Clear
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <button className="bg-red-600 text-white px-3 py-1 rounded text-sm" onClick={bulkCancel}>
              Bulk Cancel
            </button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
              <TableRow className="text-gray-500">
                <TableCell className="pr-4">
                <input
                  type="checkbox"
                  checked={filteredBookings.length > 0 && filteredBookings.every((b) => selectedBookings[b.id])}
                  onChange={selectAllVisible}
                />
                </TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Guest</TableCell>
                <TableCell>Hotel</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
              </TableHeader>
              <TableBody>
              {filteredBookings.map((b) => (
                <TableRow key={b.id} className="border-t">
                <TableCell className="pr-4">
                  <input type="checkbox" checked={!!selectedBookings[b.id]} onChange={() => toggleSelectBooking(b.id)} />
                </TableCell>
                <TableCell className="py-2">{b.id}</TableCell>
                <TableCell>{b.guestName}</TableCell>
                <TableCell>{b.hotelName}</TableCell>
                <TableCell>{b.dateFrom} → {b.dateTo}</TableCell>
                <TableCell>{b.currency} {b.amount}</TableCell>
                <TableCell><StatusBadge status={b.status} /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                  <button className="text-sm text-blue-600" onClick={() => openBookingDetail(b)}>View</button>
                  <div>
                    <Select value={b.status} onValueChange={(value) => updateBookingStatus(b.id, value as BookingStatus)}>
                    <SelectTrigger className="w-36 border rounded px-2 py-1 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">pending</SelectItem>
                      <SelectItem value="confirmed">confirmed</SelectItem>
                      <SelectItem value="checked_in">checked_in</SelectItem>
                      <SelectItem value="completed">completed</SelectItem>
                      <SelectItem value="cancelled">cancelled</SelectItem>
                      <SelectItem value="refunded">refunded</SelectItem>
                    </SelectContent>
                    </Select>
                  </div>
                  </div>
                </TableCell>
                </TableRow>
              ))}

              {filteredBookings.length === 0 && (
                <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-gray-500">
                  No bookings match the filters.
                </TableCell>
                </TableRow>
              )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Booking detail modal */}
      {activeBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white w-full max-w-3xl rounded shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Booking {activeBooking.id}</h3>
                <div className="text-sm text-gray-500">{activeBooking.guestName} — {activeBooking.hotelName}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-gray-100 rounded" onClick={() => { updateBookingStatus(activeBooking.id, 'PAID'); setActiveBooking({ ...activeBooking, status: 'PAID' }) }}>Mark Completed</button>
                <button className="text-gray-500" onClick={closeBookingDetail}>Close</button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Details</h4>
                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                  <li><strong>Guest:</strong> {activeBooking.guestName}</li>
                  <li><strong>Hotel:</strong> {activeBooking.hotelName}</li>
                  <li><strong>Dates:</strong> {activeBooking.dateFrom} → {activeBooking.dateTo}</li>
                  <li><strong>Amount:</strong> {activeBooking.currency} {activeBooking.amount}</li>
                  <li><strong>Status:</strong> <StatusBadge status={activeBooking.status} /></li>
                  <li><strong>Created:</strong> {new Date(activeBooking.createdAt).toLocaleString()}</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">Timeline</h4>
                <ol className="mt-2 space-y-2 text-sm">
                  {activeBooking.timeline.map((t, i) => (
                    <li key={i} className="flex items-start">
                      <div className="w-28 text-xs text-gray-500">{t.time}</div>
                      <div className="flex-1">{t.event}</div>
                    </li>
                  ))}
                </ol>

                <div className="mt-4">
                  <label className="text-sm block">Change status</label>
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      value={activeBooking.status}
                      onChange={(e) => {
                        const s = e.target.value as BookingStatus
                        updateBookingStatus(activeBooking.id, s)
                        setActiveBooking({ ...activeBooking, status: s, timeline: [...activeBooking.timeline, { time: nowISO(), event: `Status changed to ${s}` }] })
                      }}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="checked_in">checked_in</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                      <option value="refunded">refunded</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hotels list */}
      <section className="bg-white p-4 rounded shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Hotels</h2>
          <div className="flex items-center gap-2">
            <Select value={hotelFilter} onValueChange={(value) => setHotelFilter(value)}>
              <SelectTrigger className="w-48 border rounded px-2 py-1 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-gray-500">
                  <TableCell>Name</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotels
                  .filter((h) => {
                    if (hotelFilter === 'all') return true
                    if (hotelFilter === 'approved') return h.approved && !h.banned
                    if (hotelFilter === 'pending') return !h.approved
                    if (hotelFilter === 'banned') return h.banned
                    return true
                  })
                  .map((h) => (
                    <TableRow key={h.id} className="border-t">
                      <TableCell className="py-2">{h.name}</TableCell>
                      <TableCell>{h.city}</TableCell>
                      <TableCell>{h.ownerEmail}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {h.banned ? (
                            <span className="text-red-600 text-sm">Banned</span>
                          ) : h.approved ? (
                            <span className="text-green-600 text-sm">Approved</span>
                          ) : (
                            <span className="text-yellow-600 text-sm">Pending</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!h.approved && (
                            <button
                              className="px-2 py-1 bg-green-600 text-white rounded text-sm"
                              onClick={() => approveHotel(h.id)}
                            >
                              Approve
                            </button>
                          )}
                          <button
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                            onClick={() => rejectHotel(h.id)}
                          >
                            Reject
                          </button>
                          <button
                            className={`px-2 py-1 rounded text-sm ${h.banned ? 'bg-gray-100' : 'bg-orange-500 text-white'}`}
                            onClick={() => toggleHotelBan(h.id)}
                          >
                            {h.banned ? 'Unban' : 'Ban'}
                          </button>
                          <Link href={`/app/admin/hotels/${h.id}/edit`} className="px-2 py-1 text-sm text-blue-600">
                            Edit
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                {hotels.filter((h) => {
                  if (hotelFilter === 'all') return true
                  if (hotelFilter === 'approved') return h.approved && !h.banned
                  if (hotelFilter === 'pending') return !h.approved
                  if (hotelFilter === 'banned') return h.banned
                  return true
                }).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 text-center text-gray-500">
                      No hotels found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* Users list */}
      <section className="bg-white p-4 rounded shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Users</h2>
          <div className="flex items-center gap-2">
            <input className="border rounded px-2 py-1 text-sm" placeholder="Search users..." value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
          </div>
        </div>

        <div className="mt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
              <TableRow className="text-gray-500">
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
              </TableHeader>
              <TableBody>
              {users
                .filter((u) => {
                if (!userQuery) return true
                return `${u.name} ${u.email}`.toLowerCase().includes(userQuery.toLowerCase())
                })
                .map((u) => (
                <TableRow key={u.id} className="border-t">
                  <TableCell className="py-2">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>
                  {u.banned ? <span className="text-red-600">Banned</span> : <span className="text-green-600">Active</span>}
                  </TableCell>
                  <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                    className={`px-2 py-1 rounded text-sm ${u.banned ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                    onClick={() => toggleUserBan(u.id)}
                    >
                    {u.banned ? 'Unban' : 'Ban'}
                    </button>
                    <Link href={`/app/admin/users/${u.id}`} className="text-blue-600 text-sm">View</Link>
                  </div>
                  </TableCell>
                </TableRow>
                ))}

              {users.filter((u) => {
                if (!userQuery) return true
                return `${u.name} ${u.email}`.toLowerCase().includes(userQuery.toLowerCase())
              }).length === 0 && (
                <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-gray-500">
                  No users found.
                </TableCell>
                </TableRow>
              )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  )
}