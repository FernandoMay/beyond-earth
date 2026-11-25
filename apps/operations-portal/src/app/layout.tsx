import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';
import '@aerospace/design-system/styles.css';
import '@aerospace/design-system/portal.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Operations — Aerospace RWA',
    template: '%s — Aerospace RWA Operations',
  },
  description:
    'Demonstration operations workspace for Aerospace RWA. Synthetic leases, maintenance and oracle data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
