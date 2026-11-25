import type { ReactNode } from 'react';
import {
  Activity,
  ArrowLeftRight,
  Boxes,
  Building2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Gauge,
  LayoutDashboard,
  Landmark,
  LineChart,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { Logo } from './logo';
import { DemoStrip } from './primitives';

const ICONS = {
  dashboard: LayoutDashboard,
  portfolio: Wallet,
  assets: Boxes,
  offerings: Landmark,
  compliance: ShieldCheck,
  investors: Users,
  issuer: Building2,
  operations: Wrench,
  valuations: LineChart,
  documents: FileCheck2,
  activity: Activity,
  settings: Settings,
  market: ArrowLeftRight,
  review: ClipboardCheck,
  reports: FileText,
  risk: Gauge,
};

export type PortalNavItem = {
  label: string;
  href: string;
  icon: keyof typeof ICONS;
  badge?: string;
  active?: boolean;
};

export interface PortalShellProps {
  portal: string;
  title: string;
  subtitle?: string;
  environment?: string;
  nav: PortalNavItem[];
  actions?: ReactNode;
  children: ReactNode;
}

export function PortalShell({
  portal,
  title,
  subtitle,
  environment = 'DEMO ENVIRONMENT',
  nav,
  actions,
  children,
}: PortalShellProps) {
  return (
    <div className="ar-portal">
      <aside className="ar-sidebar">
        <div className="ar-sidebar__brand">
          <Logo />
        </div>
        <div className="ar-sidebar__portal">
          <span className="ar-sidebar__label">WORKSPACE</span>
          <span className="ar-sidebar__title">{portal}</span>
          <span className="ar-sidebar__env">
            <i aria-hidden="true" />
            {environment}
          </span>
        </div>
        <nav className="ar-portal-nav" aria-label={`${portal} navigation`}>
          {nav.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <a
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={item.active ? 'is-active' : ''}
              >
                <Icon size={16} strokeWidth={1.6} />
                <span>{item.label}</span>
                {item.badge && <em>{item.badge}</em>}
              </a>
            );
          })}
        </nav>
        <div className="ar-sidebar__footer">
          <a href="http://localhost:3000" className="ar-sidebar__exit">
            ← Public network
          </a>
          <span className="ar-mono">STELLAR TESTNET</span>
          <span className="ar-sidebar__version">Protocol v0.1 · Reference build</span>
        </div>
      </aside>
      <div className="ar-portal__main">
        <header className="ar-portal-topbar">
          <div className="ar-portal-topbar__heading">
            <span className="ar-eyebrow">
              <span className="ar-eyebrow__line" />
              {portal.toUpperCase()}
            </span>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="ar-portal-topbar__actions">{actions}</div>
        </header>
        <DemoStrip />
        <main className="ar-portal-content">{children}</main>
        <footer className="ar-portal-footer">
          <span>Aerospace RWA · {portal}</span>
          <span className="ar-mono">ILLUSTRATIVE DATA · NO FUNDS · NO SIGNED TRANSACTIONS</span>
        </footer>
      </div>
    </div>
  );
}
