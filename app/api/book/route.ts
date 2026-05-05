import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, service, date, time, duration } = await request.json()
    if (!name || !email || !phone || !service || !date || !time) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { google } = await import('googleapis')
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').split('\\n').join('\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    })
    const calendar = google.calendar({ version: 'v3', auth })

    const h = time.split(':')[0].padStart(2, '0')
    const m = time.split(':')[1] || '00'
    const durationMin = duration || 30
    
    // Calculate end time
    const totalMinutes = parseInt(h) * 60 + parseInt(m) + durationMin
    const endH = Math.floor(totalMinutes / 60).toString().padStart(2, '0')
    const endM = (totalMinutes % 60).toString().padStart(2, '0')

    await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: {
        summary: `✂️ ${service} — ${name}`,
        description: `Клиент: ${name}\nИмейл: ${email}\nТелефон: ${phone}`,
        start: { dateTime: `${date}T${h}:${m}:00+03:00` },
end: { dateTime: `${date}T${endH}:${endM}:00+03:00` },
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Booking error:', err)
    return NextResponse.json({ error: 'Failed to book' }, { status: 500 })
  }
}