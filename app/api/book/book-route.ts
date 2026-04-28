import { NextRequest, NextResponse } from 'next/server'
import { getCalendar, CALENDAR_ID } from '@/lib/calendar'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, service, date, time, duration } = await request.json()

    if (!name || !email || !phone || !service || !date || !time) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const calendar = getCalendar()
    const timePadded = time.includes(':') && time.split(':')[0].length === 1 ? `0${time}` : time
    const start = new Date(`${date}T${timePadded}:00`)
    const end = new Date(start.getTime() + (duration || 30) * 60000)

    await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: `✂️ ${service} — ${name}`,
        description: `Клиент: ${name}\nИмейл: ${email}\nТелефон: ${phone}`,
        start: { dateTime: start.toISOString(), timeZone: 'Europe/Sofia' },
        end: { dateTime: end.toISOString(), timeZone: 'Europe/Sofia' },
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Booking error:', err)
    return NextResponse.json({ error: 'Failed to book' }, { status: 500 })
  }
}
