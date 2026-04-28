import { NextRequest, NextResponse } from 'next/server'
import { getCalendar, CALENDAR_ID } from '@/lib/calendar'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ takenSlots: [] })

  try {
    const calendar = getCalendar()
    const res = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date(`${date}T00:00:00`).toISOString(),
      timeMax: new Date(`${date}T23:59:59`).toISOString(),
      singleEvents: true,
    })

    const takenSlots = (res.data.items || [])
      .filter(e => e.start?.dateTime)
      .map(e => {
        const d = new Date(e.start!.dateTime!)
        return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
      })

    return NextResponse.json({ takenSlots })
  } catch (err) {
    console.error('Availability error:', err)
    return NextResponse.json({ takenSlots: [] })
  }
}
