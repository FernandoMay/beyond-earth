'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PortalShell, type PortalNavItem } from '@aerospace/design-system';

const NAV: Omit<PortalNavItem, 'active'>[] = [
  { label: 'Overview', href: '/', icon: 'dashboard' },
  { label: 'Compliance queue', href: '/compliance', icon: 'compliance', badge: '7' },
  { label: 'Registry review', href: '/registry', icon: 'assets' },
  { label: 'Deployments', href: '/deployments', icon: 'settings' },
  { label: 'Audit log', href: '/audit', icon: 'activity' },
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
      portal="Administration"
      title={title}
      subtitle={subtitle}
      environment="DEMO · RESTRICTED"
      nav={nav}
      actions={actions}
    >
      {children}
    </PortalShell>
  );
}
