'use client'
import { useEffect, useState } from 'react'

function setConsentCookie(value: 'granted' | 'denied') {
  document.cookie = `cc21cutz=${value}; domain=.21cutz.com; path=/; max-age=15552000; SameSite=Lax`
}

function gtag(..._args: unknown[]) {
  const w = window as unknown as { dataLayer?: unknown[] }
  w.dataLayer = w.dataLayer || []
  // GTM consent commands require the arguments object, not an array
  // eslint-disable-next-line prefer-rest-params
  w.dataLayer.push(arguments)
}

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!/(?:^|; )cc21cutz=/.test(document.cookie)) setVisible(true)
  }, [])

  if (!visible) return null

  const accept = () => {
    setConsentCookie('granted')
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
      functionality_storage: 'granted',
      personalization_storage: 'granted',
    })
    ;(window as unknown as { dataLayer?: object[] }).dataLayer?.push({ event: 'consent_granted' })
    setVisible(false)
  }

  const decline = () => {
    setConsentCookie('denied')
    gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
    })
    setVisible(false)
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 1000,
        maxWidth: 560,
        margin: '0 auto',
        padding: '18px 20px',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        boxShadow: '0 8px 30px rgba(38,33,26,0.18)',
      }}
    >
      <p style={{ margin: '0 0 14px', color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
        Използваме бисквитки за анализ на посещенията и за измерване на рекламни кампании. Ще ги
        включим само с вашето съгласие.{' '}
        <a
          href="https://21cutz.com/cookies"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--gold-deep)', textDecoration: 'underline' }}
        >
          Научете повече
        </a>
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={accept}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: '0.9rem',
            cursor: 'pointer',
            background: 'var(--gold)',
            border: '1px solid var(--gold)',
            color: 'var(--on-gold)',
          }}
        >
          Приемам
        </button>
        <button
          type="button"
          onClick={decline}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: '0.9rem',
            cursor: 'pointer',
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
          }}
        >
          Отказвам
        </button>
      </div>
    </div>
  )
}
