import './globals.css';

export const metadata = {
  metadataBase: new URL('https://aisim-psi.vercel.app'),
  title: {
    default: 'The AI Investment Challenge | Practice AI Leadership',
    template: '%s | The AI Investment Challenge',
  },
  description: 'Practice AI leadership before you lead for real. Run a living 12-quarter transformation where initiatives evolve, risk mutates, and strategy emerges through play.',
  applicationName: 'The AI Investment Challenge',
  generator: 'Next.js',
  keywords: ['AI leadership', 'AI transformation', 'executive simulation', 'strategy simulation', 'decision making'],
  authors: [{ name: 'The AI Investment Challenge' }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aisim-psi.vercel.app',
    siteName: 'The AI Investment Challenge',
    title: 'Practice AI leadership before you lead for real.',
    description: 'A living 12-quarter AI transformation simulation where capabilities compound, risk mutates, and your strategic identity emerges from what you do.',
    images: [
      {
        url: '/social-preview.svg',
        width: 1200,
        height: 630,
        alt: 'The AI Investment Challenge — practice AI leadership before you lead for real.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Practice AI leadership before you lead for real.',
    description: 'Run a living 12-quarter AI transformation where strategy emerges through play.',
    images: ['/social-preview.svg'],
  },
};

export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
