import { google } from 'googleapis'

export function getCalendar() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
  return google.calendar({ version: 'v3', auth })
}

export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary'

export const WORKING_HOURS: Record<number, { start: string; end: string } | null> = {
  0: null,
  1: { start: '9:00', end: '18:30' },
  2: null,
  3: { start: '9:00', end: '18:30' },
  4: { start: '9:00', end: '18:30' },
  5: { start: '9:00', end: '18:30' },
  6: { start: '11:00', end: '16:00' },
}

export function generateTimeSlots(dayOfWeek: number): string[] {
  const hours = WORKING_HOURS[dayOfWeek]
  if (!hours) return []
  const slots: string[] = []
  const [sh, sm] = hours.start.split(':').map(Number)
  const [eh, em] = hours.end.split(':').map(Number)
  let cur = sh * 60 + sm
  const end = eh * 60 + em
  while (cur <= end) {
    slots.push(`${Math.floor(cur / 60)}:${String(cur % 60).padStart(2, '0')}`)
    cur += 30
  }
  return slots
}

export const SERVICES = [
  { name: 'Класическо подстригване', price: '15€', duration: 30 },
  { name: 'Buzz cut', price: '15€', duration: 30 },
  { name: 'Брада', price: '10€', duration: 30 },
  { name: 'Подстригване + брада', price: '20€', duration: 60 },
  { name: 'Вежди', price: '2.50€', duration: 30 },
  { name: 'VIP комбо подстригване + брада + кална маска + масаж', price: '25€', duration: 60 },
  { name: 'Грижа за кожата', price: '5€', duration: 30 },
]
