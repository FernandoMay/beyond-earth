'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PortalShell, type PortalNavItem } from '@aerospace/design-system';

const NAV: Omit<PortalNavItem, 'active'>[] = [
  { label: 'Overview', href: '/', icon: 'dashboard' },
  { label: 'Leases', href: '/leases', icon: 'offerings', badge: '2' },
  { label: 'Maintenance', href: '/maintenance', icon: 'operations' },
  { label: 'Insurance', href: '/insurance', icon: 'documents' },
  { label: 'Oracle feeds', href: '/oracles', icon: 'valuations' },
  { label: 'Task queue', href: '/tasks', icon: 'reports' },
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
      portal="Operations"
      title={title}
      subtitle={subtitle}
      environment="DEMO · TESTNET DESIGN"
      nav={nav}
      actions={actions}
    >
      {children}
    </PortalShell>
  );
}
