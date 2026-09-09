import type { Metadata } from 'next'
import ConsentBanner from '../components/ConsentBanner'
import './globals.css'

export const metadata: Metadata = {
  title: '21 Cutz — Резервации',
  description: 'Запазете час при нашите професионални бръснари',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <head>
        {/* Consent Mode v2: default denied until the visitor accepts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
if(/(?:^|; )cc21cutz=granted/.test(document.cookie)){gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'});}`,
          }}
        />
        {/* Google Analytics (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-DB1T3RFXKX" />
        <script
          dangerouslySetInnerHTML={{
            __html: `gtag('js',new Date());gtag('config','G-DB1T3RFXKX');`,
          }}
        />
        {/* End Google Analytics */}
      </head>
      <body>
        {children}
        <ConsentBanner />
      </body>
    </html>
  )
}
