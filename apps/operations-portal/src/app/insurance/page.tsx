import type { Metadata } from 'next';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge, ProgressBar } from '@aerospace/design-system';
import { demoSnapshot, formatMoney, getDemoAssetById } from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Insurance' };

export default function InsurancePage() {
  return (
    <PortalFrame
      title="Insurance"
      subtitle="Illustrative coverage, deductibles and renewal windows."
    >
      <div className="p-page">
        <div className="p-banner">
          <ShieldCheck size={16} />
          <div>
            <strong>Policies are fabricated.</strong>
            <p>
              Coverage, deductibles and expiry dates are synthetic. They do not evidence any real
              insurance contract or aerospace risk transfer.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {demoSnapshot.insurance.map((policy) => (
            <section className="p-card" key={policy.id}>
              <div className="p-card__head">
                <div>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Badge
                      tone={
                        policy.status === 'active'
                          ? 'green'
                          : policy.status === 'expiring'
                            ? 'amber'
                            : 'red'
                      }
                      dot
                    >
                      {policy.status}
                    </Badge>
                    <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 7 }}>
                      {policy.id}
                    </span>
                  </div>
                  <h3 style={{ marginTop: 9 }}>{getDemoAssetById(policy.assetId)?.shortName}</h3>
                  <p>{policy.insurer}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--ar-faint)', fontSize: 7 }}>COVERAGE</span>
                  <strong
                    style={{
                      display: 'block',
                      color: 'var(--ar-ink)',
                      fontFamily: 'var(--ar-font-display)',
                      fontSize: 22,
                      fontWeight: 420,
                      letterSpacing: '-0.035em',
                    }}
                  >
                    {formatMoney(policy.coverage, true)}
                  </strong>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 1,
                  background: 'var(--ar-line)',
                  border: '1px solid var(--ar-line)',
                }}
              >
                {[
                  ['Deductible', formatMoney(policy.deductible)],
                  ['Expires', policy.expiresAt],
                  ['Renewal window', policy.status === 'expiring' ? 'Action required' : 'Monitor'],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: 12, background: '#08111f' }}>
                    <span
                      style={{
                        color: 'var(--ar-faint)',
                        fontSize: 6.5,
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {label}
                    </span>
                    <strong
                      style={{
                        display: 'block',
                        marginTop: 5,
                        color: 'var(--ar-silver)',
                        fontSize: 9,
                        fontWeight: 500,
                      }}
                    >
                      {value}
                    </strong>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <ProgressBar
                  value={policy.status === 'expiring' ? 88 : 42}
                  label="Policy period elapsed"
                  tone={policy.status === 'expiring' ? 'amber' : 'blue'}
                />
              </div>
            </section>
          ))}
        </div>

        <div className="p-callout">
          <AlertTriangle size={13} />
          <span>
            An expiring or expired policy should become an operational event and may block
            distributions depending on the structure. No such control is active in this demo.
          </span>
        </div>
      </div>
    </PortalFrame>
  );
}
