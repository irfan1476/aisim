import './globals.css';
import type { Metadata } from 'next';

const siteUrl = 'https://aisim.teachmeai.in';
const socialImage = `${siteUrl}/aisim.teachmeai.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'The AI Investment Challenge | Executive AI Strategy Simulation',
    template: '%s | The AI Investment Challenge',
  },
  description:
    'A replayable 12-quarter executive AI strategy simulation. Choose a scenario, set a campaign budget, fund initiatives, observe consequences, and reflect on your AI transformation decisions.',
  applicationName: 'The AI Investment Challenge',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  category: 'Education',
  keywords: [
    'AI strategy simulation',
    'AI transformation simulation',
    'executive learning',
    'AI leadership',
    'AI investment strategy',
    'business simulation',
    'decision-making practice',
    'Chief AI Officer',
    'scenario-based learning',
    'strategic reflection',
  ],
  authors: [{ name: 'TeachMe AI' }],
  creator: 'TeachMe AI',
  publisher: 'TeachMe AI',
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'The AI Investment Challenge',
    title: 'Practice AI leadership before you lead for real.',
    description:
      'Choose an operating environment, set a campaign purse, test AI initiatives, inspect the consequences, and replay with a stronger strategy.',
    images: [
      {
        url: socialImage,
        width: 1408,
        height: 768,
        alt: 'The AI Investment Challenge executive decision cockpit, showing capital, people and data, risk and adoption, and scale.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The AI Investment Challenge',
    description:
      'A replayable executive simulation for practising AI investment, operating, and reflection decisions.',
    images: [socialImage],
  },
};

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'The AI Investment Challenge',
    url: siteUrl,
    description:
      'A replayable executive learning simulation for practising AI transformation strategy and investment decisions.',
    inLanguage: 'en',
    image: socialImage,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: 'The AI Investment Challenge',
    url: siteUrl,
    description:
      'An interactive, self-paced learning experience in which participants run a twelve-quarter AI transformation campaign, interpret consequences, and replay to compare strategic choices.',
    educationalLevel: 'Executive and professional learning',
    learningResourceType: 'Interactive simulation',
    inLanguage: 'en',
    isAccessibleForFree: true,
    isPartOf: {
      '@type': 'WebSite',
      name: 'The AI Investment Challenge',
      url: siteUrl,
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'The AI Investment Challenge',
    url: siteUrl,
    description:
      'A replayable 12-quarter executive AI strategy simulation where learners allocate capital, select initiatives, observe outcomes, and reflect on their decisions.',
    applicationCategory: 'EducationalApplication',
    applicationSubCategory: 'Business strategy simulation',
    operatingSystem: 'Web',
    browserRequirements: 'Requires a modern web browser with JavaScript enabled.',
    inLanguage: 'en',
    isAccessibleForFree: true,
    image: socialImage,
    featureList: [
      'Twelve-quarter strategy campaigns',
      'Standard mode and manufacturing, banking, healthcare, and education scenarios',
      'Flexible campaign budgets and reserve carry-forward',
      'Initiative, risk, capability, and capital tracking',
      'Evidence-based Board Advisor and decision coaching',
      'Scenario-native analytics, causal explanations, and replay comparison',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is The AI Investment Challenge?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The AI Investment Challenge is a browser-based executive learning simulation. Players lead a twelve-quarter AI transformation, make investment and operating decisions, observe the outcomes, and use the resulting evidence to improve a later run.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the simulation work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Players choose Standard mode or a domain scenario, set a finite campaign purse, select zero to three initiatives each quarter, decide what capital to deploy, and allocate operating investment. The simulation records effects on initiatives, risks, capabilities, scenario pressures, and available capital across the campaign.',
        },
      },
      {
        '@type': 'Question',
        name: 'What can learners practise?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Learners can practise capital pacing, portfolio focus, capability building, risk management, reserve decisions, and strategic reflection. Decision Coach previews, the Board Advisor, analytics, causal explanations, and the final report help learners inspect why outcomes occurred.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which scenarios are available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The experience includes open Standard mode and domain scenarios for manufacturing, banking, healthcare, and education. Each scenario has its own pressures, initiatives, metrics, crises, and success conditions while retaining the same core learning loop.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I replay the simulation?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Campaign history, analytics, and the final strategy report are designed to support replay. Learners can compare a different capital pace, initiative mix, or operating allocation and examine how the resulting campaign changes.',
        },
      },
    ],
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
