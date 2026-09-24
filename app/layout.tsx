import type { Metadata, Viewport } from 'next'
import ConsentBanner from '../components/ConsentBanner'
import './globals.css'

export const metadata: Metadata = {
  title: '21 Cutz — Резервации',
  description: 'Запазете час при нашите професионални бръснари',
}

export const viewport: Viewport = {
  themeColor: '#faf8f2',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <head>
        {/* Consent Mode v2: default denied until the visitor accepts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted',wait_for_update:500});
gtag('set','ads_data_redaction',true);
gtag('set','url_passthrough',true);
if(/(?:^|; )cc21cutz=granted/.test(document.cookie)){gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted',functionality_storage:'granted',personalization_storage:'granted'});}`,
          }}
        />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-T74TXMB4');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-T74TXMB4"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {children}
        <ConsentBanner />
      </body>
    </html>
  )
}
