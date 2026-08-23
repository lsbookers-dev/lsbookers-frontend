// agenda/types.ts — Types partagés pour AgendaCalendar et ses sous-composants

export type CalEvent = {
  id: number
  title: string
  start: string
  end?: string | null
  allDay: boolean
  lieu?: string | null
  category?: string | null
  status: string
}

export type AvailDay = {
  date: string
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'BOOKED' | 'TENTATIVE'
  note?: string | null
}

export type BookingItem = {
  id: number
  startDate: string
  fee?: number | null
  status: string
  paymentStatus?: string | null
  message?: string | null
  conversationId?: number | null
  cancellationRequestedBy?: number | null
  requester?: { id: number; avatar?: string | null; user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null } | null } | null
  target?:    { id: number; avatar?: string | null; user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null } | null } | null
}

export type EventSummary = {
  id: number
  title: string
  start: string
  end?: string | null
  lieu?: string | null
  category?: string | null
  status: string
  isPrivate: boolean
  budget?: number | null
}

export type StaffItem = {
  id: number
  role: string
  fee?: number | null
  status: string
  notes?: string | null
  profile?: { id: number; avatar?: string | null; user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null; role?: string | null } | null } | null
}

export type ExpenseItem = {
  id: number
  label: string
  amount?: number | null
  category?: string | null
  paid: boolean
}

export type PurchaseItem = {
  id: number
  item: string
  quantity?: number | null
  price?: number | null
  done: boolean
}

export type BookingItem2 = {
  id: number
  startDate: string
  fee?: number | null
  status: string
  message?: string | null
  target?: { id: number; avatar?: string | null; user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null; role?: string | null } | null } | null
}

export type DocumentItem = {
  id: number
  name: string
  url: string
  fileType: string
  createdAt: string
}

export type LinkedBooking = {
  id: number
  startDate: string
  fee?: number | null
  paymentStatus?: string | null
  status: string
  requester?: { id: number; avatar?: string | null; user?: { pseudo?: string | null; firstName?: string | null; lastName?: string | null } | null } | null
}

export type EventDetail = {
  id: number
  title: string
  description?: string | null
  notes?: string | null
  start: string
  end?: string | null
  allDay: boolean
  lieu?: string | null
  category?: string | null
  isPrivate: boolean
  budget?: number | null
  maxCapacity?: number | null
  status: string
  staff: StaffItem[]
  expenses: ExpenseItem[]
  purchases: PurchaseItem[]
  documents: DocumentItem[]
  bookingRequests: BookingItem2[]
}

export type EventOffer = {
  id: number
  title: string
  description: string
  type: string
  specialty?: string | null
  date: string
  location: string
  country: string
  fee?: number | null
}

export type EventOfferForm = {
  title: string
  description: string
  type: 'ARTIST' | 'PROVIDER' | 'ALL'
  specialty: string
  date: string
  time: string
  endDate: string
  endTime: string
  location: string
  country: string
  fee: string
}

export type EventMode = 'list' | 'create' | 'detail'
