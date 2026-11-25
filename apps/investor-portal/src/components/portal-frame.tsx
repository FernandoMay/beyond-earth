'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PortalShell, type PortalNavItem } from '@aerospace/design-system';
import { WalletButton } from '@aerospace/wallet';

const NAV: Omit<PortalNavItem, 'active'>[] = [
  { label: 'Overview', href: '/', icon: 'dashboard' },
  { label: 'Portfolio', href: '/portfolio', icon: 'portfolio' },
  { label: 'Distributions', href: '/distributions', icon: 'market', badge: '1' },
  { label: 'Opportunities', href: '/opportunities', icon: 'assets' },
  { label: 'Eligibility', href: '/onboarding', icon: 'compliance' },
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
    active: item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
  }));

  return (
    <PortalShell
      portal="Investor Workspace"
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
