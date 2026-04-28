import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, service, date, time, duration } = await request.json()
    if (!name || !email || !phone || !service || !date || !time) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { google } = await import('googleapis')
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
    const calendar = google.calendar({ version: 'v3', auth })

    const h = time.split(':')[0].padStart(2, '0')
    const m = time.split(':')[1] || '00'
    const start = new Date(`${date}T${h}:${m}:00`)
    const end = new Date(start.getTime() + (duration || 30) * 60000)

    await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
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
