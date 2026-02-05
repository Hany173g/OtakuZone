import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ 
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  preload: true,
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#9b59b6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e293b' },
  ],
}

export const metadata: Metadata = {
  title: {
    default: 'OtakuZone - منتدى عشاق الأنمي والمانجا',
    template: '%s | OtakuZone',
  },
  description: 'أكبر مجتمع عربي لعشاق الأنمي والمانجا. انضم إلينا للنقاش والتقييمات والترشيحات والأخبار.',
  keywords: ['أنمي', 'مانجا', 'مانهوا', 'منتدى', 'مجتمع', 'anime', 'manga', 'otaku', 'OtakuZone'],
  authors: [{ name: 'OtakuZone' }],
  creator: 'OtakuZone',
  publisher: 'OtakuZone',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: '/',
    siteName: 'OtakuZone',
    title: 'OtakuZone - منتدى عشاق الأنمي والمانجا',
    description: 'أكبر مجتمع عربي لعشاق الأنمي والمانجا',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'OtakuZone - منتدى عشاق الأنمي',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OtakuZone - منتدى عشاق الأنمي والمانجا',
    description: 'أكبر مجتمع عربي لعشاق الأنمي والمانجا',
    images: ['/og-image.jpg'],
    creator: '@otakuzone',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png', sizes: '32x32' },
      { url: '/logo.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${inter.className} antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100`}>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 pb-12 md:pb-16">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  )
}

