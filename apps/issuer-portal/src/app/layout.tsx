import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';
import '@aerospace/design-system/styles.css';
import '@aerospace/design-system/portal.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Issuer Workspace — Aerospace RWA',
    template: '%s — Aerospace RWA Issuer',
  },
  description:
    'Demonstration issuer workspace for Aerospace RWA. Illustrative structures, no real asset and no deployment.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
