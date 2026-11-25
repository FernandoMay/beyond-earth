import type { Metadata } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';
import '@aerospace/design-system/styles.css';
import '@aerospace/design-system/portal.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Administration — Aerospace RWA',
    template: '%s — Aerospace RWA Admin',
  },
  description:
    'Demonstration administration workspace for Aerospace RWA. No production approvals or privileged actions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
