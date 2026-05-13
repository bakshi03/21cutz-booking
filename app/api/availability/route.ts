import { NextRequest, NextResponse } from 'next/server'

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

// Генерира всички 30-мин слотове които едно събитие покрива
// Пример: 13:30–14:30 → ["13:30", "14:00"]
function getSlotsForEvent(startStr: string, endStr: string): string[] {
  const slots: string[] = []
  const start = new Date(startStr)
  const end = new Date(endStr)
  const current = new Date(start)

  while (current < end) {
    slots.push(toSofiaTime(current.toISOString()))
    current.setMinutes(current.getMinutes() + 30)
  }

  return slots
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date')
  console.log('Availability called for date:', date)
  if (!date) return NextResponse.json({ takenSlots: [], fullyBlocked: false })

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

    const timeMin = new Date(`${date}T00:00:00+03:00`).toISOString()
    const timeMax = new Date(`${date}T23:59:59+03:00`).toISOString()
    console.log('Fetching events between:', timeMin, 'and', timeMax)
    console.log('Calendar ID:', process.env.GOOGLE_CALENDAR_ID)

    const res = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
    })

    const items = res.data.items || []
    console.log('Events found:', items.length, items.map(e => ({
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
    })))

    const fullyBlocked = items.some(e => e.start?.date && !e.start?.dateTime)
    if (fullyBlocked) {
      console.log('Day is fully blocked')
      return NextResponse.json({ takenSlots: [], fullyBlocked: true })
    }

    // За всяко събитие генерираме всички слотове които покрива
    const takenSlotsSet = new Set<string>()
    for (const event of items) {
      if (event.start?.dateTime && event.end?.dateTime) {
        const slots = getSlotsForEvent(event.start.dateTime, event.end.dateTime)
        slots.forEach(s => takenSlotsSet.add(s))
      }
    }

    const takenSlots = Array.from(takenSlotsSet)
    console.log('Date:', date, 'Taken slots (expanded):', takenSlots)

    return NextResponse.json({ takenSlots, fullyBlocked: false })
  } catch (err) {
    console.error('Availability error:', err)
    return NextResponse.json({ takenSlots: [], fullyBlocked: false })
  }
}