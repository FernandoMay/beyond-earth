import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';
import '@aerospace/design-system/styles.css';
import '@aerospace/design-system/portal.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Investor Workspace — Aerospace RWA',
    template: '%s — Aerospace RWA Investor',
  },
  description:
    'Demonstration investor workspace for Aerospace RWA. Illustrative data, no funds and no signed transactions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
