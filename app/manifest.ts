import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The AI Investment Challenge',
    short_name: 'AI Investment Challenge',
    description:
      'A replayable executive AI strategy simulation for learning through decisions, consequences, reflection, and replay.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f8fa',
    theme_color: '#0d1117',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
