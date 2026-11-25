'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PortalShell, type PortalNavItem } from '@aerospace/design-system';
import { WalletButton } from '@aerospace/wallet';

const NAV: Omit<PortalNavItem, 'active'>[] = [
  { label: 'Overview', href: '/', icon: 'dashboard' },
  { label: 'Asset pipeline', href: '/assets', icon: 'assets', badge: '2' },
  { label: 'New structure', href: '/assets/new', icon: 'review' },
  { label: 'Offerings', href: '/offerings', icon: 'offerings' },
  { label: 'Evidence register', href: '/evidence', icon: 'documents' },
];

export function PortalFrame({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const nav = NAV.map((item) => ({
    ...item,
    active:
      item.href === '/'
        ? pathname === '/'
        : item.href === '/assets'
          ? pathname === '/assets'
          : pathname.startsWith(item.href),
  }));

  return (
    <PortalShell
      portal="Issuer Workspace"
      title={title}
      subtitle={subtitle}
      environment="DEMO · TESTNET DESIGN"
      nav={nav}
      actions={
        <>
          {actions}
          <WalletButton />
        </>
      }
    >
      {children}
    </PortalShell>
  );
}
