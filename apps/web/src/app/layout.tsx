import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/manrope';
import '@fontsource-variable/jetbrains-mono';
import '@aerospace/design-system/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Aerospace RWA — The Aerospace Asset Financial Network',
    template: '%s · Aerospace RWA',
  },
  description:
    'Reference infrastructure for evidence-linked aerospace assets, regulated tokenization, investment and settlement on Stellar + Soroban.',
  applicationName: 'Aerospace RWA',
  keywords: [
    'aerospace',
    'real world assets',
    'RWA',
    'Stellar',
    'Soroban',
    'aviation finance',
    'tokenization',
  ],
  robots: { index: false, follow: false },
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Aerospace RWA — The Aerospace Asset Financial Network',
    description:
      'Financing the infrastructure beyond Earth. A reference implementation on Stellar Testnet.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#05080f',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
