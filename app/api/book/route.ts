import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, service, date, time, duration, price } = await request.json()
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

    const totalMinutes = parseInt(h) * 60 + parseInt(m) + durationMin
    const endH = Math.floor(totalMinutes / 60).toString().padStart(2, '0')
    const endM = (totalMinutes % 60).toString().padStart(2, '0')

    console.log('Time received:', time)
    console.log('Start dateTime:', `${date}T${h}:${m}:00+03:00`)
    console.log('End dateTime:', `${date}T${endH}:${endM}:00+03:00`)

    await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: {
        summary: `✂️ ${service} — ${name}`,
        description: `Клиент: ${name}\nИмейл: ${email}\nТелефон: ${phone}`,
        start: { dateTime: `${date}T${h}:${m}:00+03:00` },
        end: { dateTime: `${date}T${endH}:${endM}:00+03:00` },
      },
    })

    // Send confirmation email via Resend
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'booking@21cutz.com',
          to: email,
          subject: '✂️ Резервацията ви е потвърдена — 21 Cutz',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f0f; color: #e5e5e5; border-radius: 10px; overflow: hidden;">
              <div style="background: #0f0f0f; padding: 32px 32px 0; text-align: center; border-bottom: 1px solid #2a2a2a;">
                <div style="font-size: 28px; font-weight: 900; color: #c9a84c; letter-spacing: -0.02em;">✂ 21 Cutz</div>
                <div style="font-size: 11px; color: #666; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px; padding-bottom: 24px;">Премиум бръснарски салон</div>
              </div>
              <div style="padding: 32px;">
                <div style="font-size: 20px; font-weight: 700; color: #c9a84c; margin-bottom: 8px;">Резервацията е потвърдена!</div>
                <p style="color: #999; font-size: 14px; margin: 0 0 24px;">Здравейте, ${name}! Вашият час е успешно запазен.</p>
                <div style="background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; padding: 6px 0;">Услуга</td>
                      <td style="color: #e5e5e5; font-size: 14px; text-align: right; padding: 6px 0;">${service}</td>
                    </tr>
                    <tr>
                      <td style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; padding: 6px 0;">Дата</td>
                      <td style="color: #e5e5e5; font-size: 14px; text-align: right; padding: 6px 0;">${date}</td>
                    </tr>
                    <tr>
                      <td style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; padding: 6px 0;">Час</td>
                      <td style="color: #e5e5e5; font-size: 14px; text-align: right; padding: 6px 0;">${time} ч.</td>
                    </tr>
                    <tr>
                      <td style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; padding: 6px 0;">Бръснар</td>
                      <td style="color: #e5e5e5; font-size: 14px; text-align: right; padding: 6px 0;">Еди</td>
                    </tr>
                    <tr style="border-top: 1px solid #2a2a2a;">
                      <td style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; padding: 12px 0 6px;">Цена</td>
                      <td style="color: #c9a84c; font-size: 18px; font-weight: 700; text-align: right; padding: 12px 0 6px;">${price || ''}</td>
                    </tr>
                  </table>
                </div>
                <p style="color: #666; font-size: 13px; text-align: center; margin: 0;">При въпроси или промени се свържете с нас.</p>
              </div>
              <div style="padding: 16px 32px; text-align: center; border-top: 1px solid #2a2a2a;">
                <div style="font-size: 12px; color: #444;">21 Cutz — Премиум бръснарски салон</div>
              </div>
            </div>
          `,
        }),
      })
      const resendData = await resendRes.json()
      console.log('Resend response:', resendData)
    } catch (emailErr) {
      // Имейлът не е задължителен — резервацията е вече създадена
      console.error('Email error:', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Booking error:', err)
    return NextResponse.json({ error: 'Failed to book' }, { status: 500 })
  }
}
