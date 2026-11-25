import type { Metadata } from 'next';
import { CheckCircle2, CircleAlert, XCircle } from 'lucide-react';
import { Badge, ProgressBar } from '@aerospace/design-system';
import { demoSnapshot } from '@aerospace/shared-types';
import { CaseActions } from '@/components/case-actions';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Compliance queue' };

const riskTone = (risk: string) =>
  risk === 'high' ? ('red' as const) : risk === 'medium' ? ('amber' as const) : ('green' as const);

export default function CompliancePage() {
  return (
    <PortalFrame
      title="Compliance queue"
      subtitle="Synthetic eligibility and asset-review cases for interface testing."
    >
      <div className="p-page">
        <div className="p-banner">
          <CircleAlert size={16} />
          <div>
            <strong>Decisions are disabled.</strong>
            <p>
              Each case is fabricated. The action buttons test the interaction pattern only and do
              not call the API or a contract.
            </p>
          </div>
          <Badge tone="amber">{demoSnapshot.compliance.length} cases</Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <div className="p-card">
            <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 7 }}>
              QUEUE COMPOSITION
            </span>
            <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
              <ProgressBar value={43} label="Investor reviews" tone="blue" />
              <ProgressBar value={29} label="Asset reviews" tone="amber" />
              <ProgressBar value={28} label="Issuer reviews" tone="blue" />
            </div>
          </div>
          <div className="p-card">
            <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 7 }}>
              VERIFICATION STATE
            </span>
            <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>
              {[
                [
                  'Verified',
                  demoSnapshot.compliance.filter((item) => item.status === 'verified').length,
                  'green',
                ],
                [
                  'Pending',
                  demoSnapshot.compliance.filter((item) => item.status === 'pending').length,
                  'amber',
                ],
                [
                  'Rejected',
                  demoSnapshot.compliance.filter((item) => item.status === 'rejected').length,
                  'red',
                ],
              ].map(([label, count, tone]) => (
                <div
                  key={label as string}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <span style={{ color: 'var(--ar-muted)', fontSize: 9 }}>{label as string}</span>
                  <Badge tone={tone as 'green' | 'amber' | 'red'}>{String(count)}</Badge>
                </div>
              ))}
            </div>
          </div>
          <div className="p-card">
            <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 7 }}>
              OPERATING RULE
            </span>
            <p style={{ marginTop: 12, color: 'var(--ar-muted)', fontSize: 9, lineHeight: 1.65 }}>
              Eligibility must expire. A verified wallet without a current review date fails closed
              at transfer and cannot receive new units.
            </p>
            <div className="p-callout" style={{ marginTop: 12 }}>
              <CircleAlert size={12} />
              <span>No case here represents a real person or entity.</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {demoSnapshot.compliance.map((item) => (
            <section className="p-card" key={item.id}>
              <div className="p-card__head">
                <div>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Badge tone={riskTone(item.risk)} dot>
                      {item.risk} risk
                    </Badge>
                    <Badge tone="silver">{item.type}</Badge>
                    <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 7 }}>
                      {item.id}
                    </span>
                  </div>
                  <h3 style={{ marginTop: 9, fontSize: 17 }}>{item.subject}</h3>
                  <p>
                    {item.jurisdiction} · submitted {item.submittedAt} · expires {item.expiresAt}
                  </p>
                </div>
                <Badge
                  tone={
                    item.status === 'verified'
                      ? 'green'
                      : item.status === 'pending'
                        ? 'amber'
                        : 'red'
                  }
                  dot
                >
                  {item.status}
                </Badge>
              </div>
              <div className="a-case__checks">
                {item.checks.map((check) => (
                  <div key={check.label}>
                    <span>{check.label}</span>
                    <strong>
                      {check.state === 'pass' ? (
                        <CheckCircle2 size={11} style={{ color: 'var(--ar-green)' }} />
                      ) : check.state === 'pending' ? (
                        <CircleAlert size={11} style={{ color: 'var(--ar-amber)' }} />
                      ) : (
                        <XCircle size={11} style={{ color: 'var(--ar-red, #e26666)' }} />
                      )}
                      {check.state} · {check.checkedAt}
                    </strong>
                  </div>
                ))}
              </div>
              <CaseActions item={item} />
              <p className="a-case__note">
                Case data is synthetic. A production decision would require the full evidence
                package, reviewer identity and an auditable rationale.
              </p>
            </section>
          ))}
        </div>
      </div>
    </PortalFrame>
  );
}
