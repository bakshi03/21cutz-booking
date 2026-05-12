import { NextRequest, NextResponse } from 'next/server'
import { generateTimeSlots } from '@/lib/config'

export const dynamic = 'force-dynamic'

function toSofiaTime(dateTimeStr: string): string {
  const d = new Date(dateTimeStr)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Sofia',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(d)
  const hour = parts.find(p => p.type === 'hour')?.value || '0'
  const minute = parts.find(p => p.type === 'minute')?.value || '00'
  return `${parseInt(hour)}:${minute.padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month') // e.g. "2026-05"
  if (!month) return NextResponse.json({ blockedDates: [] })

  try {
    const { google } = await import('googleapis')
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').split('\\n').join('\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    })
    const calendar = google.calendar({ version: 'v3', auth })

    const [year, mon] = month.split('-').map(Number)
    const firstDay = new Date(year, mon - 1, 1)
    const lastDay = new Date(year, mon, 0)

    const timeMin = new Date(`${month}-01T00:00:00+03:00`).toISOString()
    const timeMax = new Date(`${year}-${String(mon).padStart(2,'0')}-${lastDay.getDate()}T23:59:59+03:00`).toISOString()

    const res = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
    })

    const items = res.data.items || []

    // Group events by date
    const eventsByDate: Record<string, typeof items> = {}

    for (const event of items) {
      let dateKey = ''
      if (event.start?.date) {
        // All-day event
        dateKey = event.start.date
      } else if (event.start?.dateTime) {
        // Get Sofia date
        const d = new Date(event.start.dateTime)
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Sofia',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(d)
        dateKey = parts
      }
      if (dateKey) {
        if (!eventsByDate[dateKey]) eventsByDate[dateKey] = []
        eventsByDate[dateKey].push(event)
      }
    }

    const blockedDates: string[] = []

    // Check each date
    for (const [dateKey, events] of Object.entries(eventsByDate)) {
      const d = new Date(dateKey + 'T12:00:00')
      const dow = d.getDay()
      const allSlots = generateTimeSlots(dow)
      if (allSlots.length === 0) continue // Already closed day

      // Check for all-day block
      const hasAllDay = events.some(e => e.start?.date && !e.start?.dateTime)
      if (hasAllDay) {
        blockedDates.push(dateKey)
        continue
      }

      // Check if all slots are taken
      const takenSlots = events
        .filter(e => e.start?.dateTime)
        .map(e => toSofiaTime(e.start!.dateTime!))

      const allTaken = allSlots.every(slot => takenSlots.includes(slot))
      if (allTaken) blockedDates.push(dateKey)
    }

    return NextResponse.json({ blockedDates })
  } catch (err) {
    console.error('Busy days error:', err)
    return NextResponse.json({ blockedDates: [] })
  }
}