import type { SVGProps } from 'react';

export function LogoMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <circle cx="24" cy="24" r="21.25" stroke="currentColor" strokeOpacity="0.28" />
      <ellipse
        cx="24"
        cy="24"
        rx="21.25"
        ry="8.5"
        transform="rotate(-34 24 24)"
        stroke="currentColor"
        strokeOpacity="0.55"
      />
      <path d="M24 8.5 37 36h-7.1l-3.2-7H17.3l-3.2 7H7L20 8.5h4Z" fill="currentColor" />
      <path d="M20.1 23.1 24 14l3.9 9.1h-7.8Z" fill="var(--ar-bg, #05080f)" />
      <circle cx="40.5" cy="14" r="2.2" fill="var(--ar-electric, #2f7bff)" />
    </svg>
  );
}

export function Logo({
  href = '/',
  compact = false,
  className = '',
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <a href={href} className={`ar-logo ${compact ? 'ar-logo--compact' : ''} ${className}`}>
      <span className="ar-logo__mark">
        <LogoMark />
      </span>
      {!compact && (
        <span className="ar-logo__type">
          <span className="ar-logo__name">
            AEROSPACE <em>RWA</em>
          </span>
          <span className="ar-logo__sub">ASSET FINANCIAL NETWORK</span>
        </span>
      )}
    </a>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`ar-wordmark ${className}`}>
      AERO<span>SPACE</span> RWA
    </span>
  );
}
