'use client'

import { useState, useEffect, useCallback } from 'react'
import { SERVICES, generateTimeSlots, WORKING_HOURS } from '@/lib/config'

type Step = 'service' | 'date' | 'time' | 'details' | 'success'

const MONTHS = ['Януари','Февруари','Март','Април','Май','Юни','Юли','Август','Септември','Октомври','Ноември','Декември']
const DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']

function pad(n: number) { return String(n).padStart(2,'0') }
function dateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function dow(d: Date) { return (d.getDay() + 6) % 7 }

export default function Page() {
  const [step, setStep] = useState<Step>('service')
  const [service, setService] = useState<typeof SERVICES[0] | null>(null)
  const [month, setMonth] = useState(new Date())
  const [selDate, setSelDate] = useState('')
  const [takenSlots, setTakenSlots] = useState<string[]>([])
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loadingMonth, setLoadingMonth] = useState(false)
  const [fullyBlocked, setFullyBlocked] = useState(false)
  const [selTime, setSelTime] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const today = new Date(); today.setHours(0,0,0,0)

  // Fetch busy days for current month
  const fetchBusyDays = useCallback(async (m: Date) => {
    setLoadingMonth(true)
    try {
      const monthStr = `${m.getFullYear()}-${pad(m.getMonth()+1)}`
      const r = await fetch(`/api/busy-days?month=${monthStr}`)
      const d = await r.json()
      setBlockedDates(d.blockedDates || [])
    } catch { setBlockedDates([]) }
    finally { setLoadingMonth(false) }
  }, [])

  // Fetch taken slots for selected date
  const fetchSlots = useCallback(async (date: string) => {
    setLoadingSlots(true)
    setTakenSlots([])
    setFullyBlocked(false)
    try {
      const r = await fetch(`/api/availability?date=${date}`)
      const d = await r.json()
      if (d.fullyBlocked) {
        setFullyBlocked(true)
      } else {
        setTakenSlots(d.takenSlots || [])
      }
    } catch { setTakenSlots([]) }
    finally { setLoadingSlots(false) }
  }, [])

  // Fetch busy days when month changes
  useEffect(() => { fetchBusyDays(month) }, [month, fetchBusyDays])

  // Fetch slots when date changes
  useEffect(() => { if (selDate) fetchSlots(selDate) }, [selDate, fetchSlots])

  const isAvailableDay = (d: Date) => {
    if (d < today) return false
    const googleDow = d.getDay()
    if (WORKING_HOURS[googleDow] === null) return false
    const ds = dateStr(d)
    if (blockedDates.includes(ds)) return false
    return true
  }

  const availableSlots = (() => {
    if (!selDate || !service || fullyBlocked) return []
    const d = new Date(selDate + 'T12:00:00')
    const slots = generateTimeSlots(d.getDay())
    const now = new Date()
    return slots.filter(slot => {
      const [h, m] = slot.split(':').map(Number)
      const dt = new Date(`${selDate}T${pad(h)}:${pad(m)}:00`)
      if ((dt.getTime() - now.getTime()) / 3600000 < 12) return false
      if (takenSlots.includes(slot)) return false
      if (service.duration === 60) {
        const next = `${Math.floor((h*60+m+30)/60)}:${pad((h*60+m+30)%60)}`
        if (takenSlots.includes(next) || !slots.includes(next)) return false
      }
      return true
    })
  })()

  const handleBook = async () => {
    if (!name || !email || !phone) { setError('Попълнете всички полета'); return }
    setSubmitting(true); setError('')
    try {
      const r = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, service: service?.name, date: selDate, time: selTime, duration: service?.duration }),
      })
      const d = await r.json()
      if (d.success) setStep('success')
      else setError('Грешка при запазване. Опитайте отново.')
    } catch { setError('Грешка при свързване.') }
    finally { setSubmitting(false) }
  }

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const startPad = dow(firstDay)
  const days: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))
  ]

  const s: Record<string, React.CSSProperties> = {
    wrap: { maxWidth: 440, margin: '0 auto', padding: '32px 20px 80px' },
    header: { textAlign: 'center', padding: '40px 20px 20px', borderBottom: '1px solid var(--border)' },
    logo: { fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--gold)' },
    sub: { fontSize: 13, color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginTop: 4 },
    label: { fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 12 },
    svcBtn: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '16px 18px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text)', marginBottom: 8, transition: 'all 0.15s' },
    input: { width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 14px', color: 'var(--text)', fontSize: 15, outline: 'none', marginBottom: 12 },
    btn: { width: '100%', background: 'var(--gold)', color: '#0f0f0f', border: 'none', borderRadius: 6, padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em' },
    back: { background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, marginBottom: 20 },
    calHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 },
    timeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
    summary: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: '14px 16px', marginBottom: 20, fontSize: 14, color: 'var(--muted)' },
    success: { textAlign: 'center', padding: '40px 20px', background: 'var(--bg2)', border: '1px solid var(--gold)', borderRadius: 10 },
  }

  return (
    <>
      <header style={s.header}>
        <div style={s.logo}>✂ 21 Cutz</div>
        <div style={s.sub}>Премиум бръснарски салон</div>
      </header>

      <div style={s.wrap}>

        {/* SUCCESS */}
        {step === 'success' && (
          <div style={s.success} className="fade">
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', marginBottom: 12 }}>Резервацията е потвърдена!</div>
            <div style={{ color: 'var(--muted)', lineHeight: 1.8, marginBottom: 24 }}>
              <div>{service?.name}</div>
              <div style={{ color: 'var(--gold)' }}>{selDate} в {selTime} ч.</div>
              <div>Бръснар: Еди</div>
            </div>
            <button style={s.btn} onClick={() => { setStep('service'); setService(null); setSelDate(''); setSelTime('') }}>
              Нова резервация
            </button>
          </div>
        )}

        {/* STEP 1 — SERVICE */}
        {step === 'service' && (
          <div className="fade">
            <div style={{ marginBottom: 20, marginTop: 28 }}>
              <div style={s.label}>Изберете услуга</div>
              {SERVICES.map(svc => (
                <button key={svc.name} style={s.svcBtn}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                  onClick={() => { setService(svc); setStep('date') }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 15 }}>{svc.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{svc.duration} мин.</div>
                  </div>
                  <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 17 }}>{svc.price}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — DATE */}
        {step === 'date' && (
          <div className="fade">
            <button style={s.back} onClick={() => setStep('service')}>← Назад</button>
            <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--gold)' }}>
              {service?.name} — {service?.price}
            </div>
            <div style={s.label}>
              {loadingMonth ? 'Зареждане на календара...' : 'Изберете дата'}
            </div>
            <div style={s.calHead}>
              <button style={{ ...s.back, marginBottom: 0 }} onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth()-1))}>‹</button>
              <span style={{ fontWeight: 600 }}>{MONTHS[month.getMonth()]} {month.getFullYear()}</span>
              <button style={{ ...s.back, marginBottom: 0 }} onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth()+1))}>›</button>
            </div>
            <div style={s.calGrid}>
              {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', padding: '4px 0' }}>{d}</div>)}
              {days.map((d, i) => {
                if (!d) return <div key={`e${i}`} />
                const ds = dateStr(d)
                const avail = isAvailableDay(d)
                const sel = selDate === ds
                const blocked = blockedDates.includes(ds)
                return (
                  <button key={ds} disabled={!avail}
                    onClick={() => { setSelDate(ds); setSelTime(''); setStep('time') }}
                    style={{
                      aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 4, fontSize: 13, cursor: avail ? 'pointer' : 'not-allowed',
                      background: sel ? 'var(--gold)' : 'none',
                      color: sel ? '#0f0f0f' : avail ? 'var(--text)' : 'var(--muted)',
                      border: sel ? 'none' : blocked ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent',
                      opacity: avail ? 1 : 0.3,
                      fontWeight: sel ? 700 : 400,
                    }}
                  >{d.getDate()}</button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 3 — TIME */}
        {step === 'time' && (
          <div className="fade">
            <button style={s.back} onClick={() => setStep('date')}>← Назад</button>
            <div style={{ ...s.summary }}>
              <span style={{ color: 'var(--gold)' }}>{service?.name}</span> · {selDate}
            </div>
            <div style={s.label}>{loadingSlots ? 'Зареждане...' : 'Изберете час'}</div>
            {!loadingSlots && fullyBlocked && (
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>Денят е блокиран. Изберете друга дата.</p>
            )}
            {!loadingSlots && !fullyBlocked && availableSlots.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>Няма свободни часове. Изберете друга дата.</p>
            )}
            <div style={s.timeGrid}>
              {availableSlots.map(slot => (
                <button key={slot}
                  onClick={() => { setSelTime(slot); setStep('details') }}
                  style={{
                    padding: '10px 4px', textAlign: 'center', borderRadius: 4, fontSize: 13,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: selTime === slot ? 'var(--gold)' : 'var(--bg2)',
                    color: selTime === slot ? '#0f0f0f' : 'var(--text)',
                    border: `1px solid ${selTime === slot ? 'var(--gold)' : 'var(--border)'}`,
                    fontWeight: selTime === slot ? 700 : 400,
                  }}
                >{slot}</button>
              ))}
            </div>
            {!loadingSlots && availableSlots.length > 0 && (
              <button style={{ ...s.back, marginTop: 12 }} onClick={() => setStep('date')}>← Избери друга дата</button>
            )}
          </div>
        )}

        {/* STEP 4 — DETAILS */}
        {step === 'details' && (
          <div className="fade">
            <button style={s.back} onClick={() => setStep('time')}>← Назад</button>
            <div style={s.summary}>
              <div><span style={{ color: 'var(--gold)' }}>{service?.name}</span></div>
              <div style={{ marginTop: 4 }}>{selDate} · {selTime} ч. · Бръснар: Еди</div>
            </div>
            <div style={s.label}>Вашите данни</div>
            <input style={s.input} placeholder="Пълно име" value={name} onChange={e => setName(e.target.value)} />
            <input style={s.input} placeholder="Имейл" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input style={s.input} placeholder="Телефон" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button style={{ ...s.btn, opacity: submitting ? 0.6 : 1 }} disabled={submitting} onClick={handleBook}>
              {submitting ? 'Запазване...' : 'Запази час'}
            </button>
          </div>
        )}

      </div>
    </>
  )
}