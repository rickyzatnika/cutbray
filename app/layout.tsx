import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import { GridBackground } from '@/components/grid-background'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'Cutbray - Compress, Remove BG, Resize & Crop Images Online',
    template: '%s | Cutbray',
  },
  description: 'Free online image tools: compress JPG PNG WebP, remove background dengan AI, hapus background foto, resize image, crop image, buat pas foto, sticker maker. 100% private, works in browser.',
  keywords: [
    'compress image', 'kompres gambar', 'online image compressor',
    'remove bg', 'hapus background', 'remove background online', 'background removal ai',
    'resize image', 'resize gambar online', 'bulk resize image',
    'crop image', 'crop gambar', 'crop photo online',
    'pas foto online', 'pas foto background merah biru putih',
    'wa sticker maker', 'whatsapp sticker maker',
    'image tools', 'free image editor',
  ],
  generator: 'v0.app',
  openGraph: {
    title: 'Cutbray - Free Online Image Tools',
    description: 'Compress, remove background, resize & crop images online. 100% free, 100% private, works in your browser.',
    type: 'website',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className="bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased relative">
        <GridBackground />
        <Providers>
          {children}
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
