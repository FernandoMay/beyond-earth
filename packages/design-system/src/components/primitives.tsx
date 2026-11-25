import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'silver';
  dot?: boolean;
}) {
  return (
    <span className={`ar-badge ar-badge--${tone}`}>
      {dot && <span className="ar-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Pill({
  children,
  active = false,
  href,
}: {
  children: ReactNode;
  active?: boolean;
  href?: string;
}) {
  const className = `ar-pill ${active ? 'is-active' : ''}`;
  return href ? (
    <a className={className} href={href}>
      {children}
    </a>
  ) : (
    <span className={className}>{children}</span>
  );
}

export function DemoBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`ar-demo-banner ${compact ? 'ar-demo-banner--compact' : ''}`} role="note">
      <span className="ar-demo-banner__signal" aria-hidden="true" />
      <span>
        <strong>DEMO ENVIRONMENT</strong>
        <span className="ar-demo-banner__sep">/</span>
        Illustrative aerospace assets
        <span className="ar-demo-banner__sep">/</span>
        Stellar Testnet
      </span>
      <span className="ar-demo-banner__right">No funds · No signed transactions</span>
    </div>
  );
}

export function DemoStrip({ children }: { children?: ReactNode }) {
  return (
    <div className="ar-demo-strip">
      <span className="ar-demo-strip__dot" aria-hidden="true" />
      <span>DEMO DATA</span>
      <span className="ar-demo-strip__line" aria-hidden="true" />
      {children ?? <span>Illustrative structure · no value is transferred</span>}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  action?: ReactNode;
}) {
  return (
    <div className={`ar-section-heading ar-section-heading--${align}`}>
      <div>
        <div className="ar-eyebrow">
          <span className="ar-eyebrow__line" />
          {eyebrow}
        </div>
        <h2 className="ar-section-heading__title">{title}</h2>
        {description && <p className="ar-section-heading__description">{description}</p>}
      </div>
      {action && <div className="ar-section-heading__action">{action}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  detail,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="ar-stat">
      <span className="ar-stat__label">{label}</span>
      <span className={`ar-stat__value ${mono ? 'ar-mono' : ''}`}>{value}</span>
      {detail && <span className="ar-stat__detail">{detail}</span>}
    </div>
  );
}

export function ProgressBar({
  value,
  label,
  tone = 'blue',
}: {
  value: number;
  label?: string;
  tone?: 'blue' | 'green' | 'amber';
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="ar-progress">
      {label && (
        <div className="ar-progress__meta">
          <span>{label}</span>
          <span className="ar-mono">{clamped.toFixed(0)}%</span>
        </div>
      )}
      <div
        className={`ar-progress__track ar-progress__track--${tone}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <span style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export function StatusDot({ status }: { status: 'live' | 'pending' | 'warning' | 'offline' }) {
  return <span className={`ar-status-dot ar-status-dot--${status}`} aria-label={status} />;
}
