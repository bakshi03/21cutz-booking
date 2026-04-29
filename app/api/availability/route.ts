import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ takenSlots: [] })

  try {
    const { google } = await import('googleapis')
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    })
    const calendar = google.calendar({ version: 'v3', auth })

    const res = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
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