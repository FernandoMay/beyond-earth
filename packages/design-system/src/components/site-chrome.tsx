import type { ReactNode } from 'react';
import { Logo } from './logo';
import { DemoBanner } from './primitives';

export const PORTALS = {
  investor: process.env.NEXT_PUBLIC_INVESTOR_PORTAL_URL ?? 'http://localhost:3001',
  issuer: process.env.NEXT_PUBLIC_ISSUER_PORTAL_URL ?? 'http://localhost:3002',
  admin: process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL ?? 'http://localhost:3003',
  operations: process.env.NEXT_PUBLIC_OPERATIONS_PORTAL_URL ?? 'http://localhost:3004',
};

const PUBLIC_NAV = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Protocol', href: '/protocol' },
  { label: 'Compliance', href: '/compliance' },
  { label: 'Roadmap', href: '/roadmap' },
];

export function SiteHeader() {
  return (
    <>
      <div className="ar-network-strip">
        <div className="ar-container ar-network-strip__inner">
          <span>
            <i aria-hidden="true" /> STELLAR TESTNET
          </span>
          <span className="ar-network-strip__center">
            REFERENCE IMPLEMENTATION · ILLUSTRATIVE DATA
          </span>
          <span>PROTOCOL v0.1</span>
        </div>
      </div>
      <header className="ar-site-header">
        <div className="ar-container ar-site-header__inner">
          <Logo />
          <nav className="ar-site-nav" aria-label="Primary navigation">
            {PUBLIC_NAV.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="ar-site-header__actions">
            <a className="ar-button ar-button--ghost ar-button--sm" href={PORTALS.investor}>
              Investor portal
            </a>
            <a className="ar-button ar-button--primary ar-button--sm" href="/marketplace">
              Explore network <span aria-hidden="true">↗</span>
            </a>
          </div>
          <details className="ar-mobile-menu">
            <summary aria-label="Open navigation">
              <span />
              <span />
            </summary>
            <div className="ar-mobile-menu__panel">
              {PUBLIC_NAV.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
              <a href={PORTALS.investor}>Investor portal</a>
              <a href="/marketplace">Explore network</a>
            </div>
          </details>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="ar-site-footer">
      <div className="ar-container">
        <div className="ar-site-footer__top">
          <div className="ar-site-footer__brand">
            <Logo />
            <p>
              The financial infrastructure for the aerospace economy. Reference implementation on
              Stellar Testnet.
            </p>
            <div className="ar-site-footer__status">
              <span className="ar-status-dot ar-status-dot--pending" />
              Protocol not deployed to production
            </div>
          </div>
          <div className="ar-site-footer__columns">
            <FooterColumn
              title="Network"
              links={[
                ['Marketplace', '/marketplace'],
                ['Protocol', '/protocol'],
                ['Certification', '/compliance'],
                ['Roadmap', '/roadmap'],
              ]}
            />
            <FooterColumn
              title="Portals"
              links={[
                ['Investor', PORTALS.investor],
                ['Issuer', PORTALS.issuer],
                ['Administration', PORTALS.admin],
                ['Operations', PORTALS.operations],
              ]}
            />
            <FooterColumn
              title="Resources"
              links={[
                ['Architecture', '/protocol#architecture'],
                ['Asset models', '/protocol#asset-models'],
                ['Security', '/protocol#security'],
                ['Repository docs', '/docs'],
              ]}
            />
          </div>
        </div>
        <div className="ar-site-footer__disclaimer">
          <strong>Important.</strong> Aerospace RWA is a reference implementation and demonstration.
          It is not an offer, solicitation, exchange, custody service or investment advice. Assets,
          issuers, valuations, returns and transactions shown are illustrative. A token does not
          automatically represent legal ownership of an underlying asset. Production use requires
          legal, regulatory, security and independent audit review.
        </div>
        <div className="ar-site-footer__bottom">
          <span>© 2026 Aerospace RWA contributors</span>
          <span className="ar-mono">APACHE-2.0 · STELLAR TESTNET · NO REAL VALUE</span>
          <span>Built for evidence, eligibility and settlement.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <div>
      <h4>{title}</h4>
      <ul>
        {links.map(([label, href]) => (
          <li key={href}>
            <a href={href}>{label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublicPage({
  children,
  header = true,
  footer = true,
}: {
  children: ReactNode;
  header?: boolean;
  footer?: boolean;
}) {
  return (
    <div className="ar-public">
      <DemoBanner />
      {header && <SiteHeader />}
      <main>{children}</main>
      {footer && <SiteFooter />}
    </div>
  );
}
