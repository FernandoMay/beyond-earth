import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  CircleAlert,
  FileWarning,
  Gauge,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Badge, ButtonLink, ProgressBar } from '@aerospace/design-system';
import { demoSnapshot, formatMoney } from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Administration overview' };

export default function AdminDashboard() {
  const metrics = demoSnapshot.metrics;
  const pending = demoSnapshot.compliance.filter((item) => item.status === 'pending');

  return (
    <PortalFrame
      title="Administration overview"
      subtitle="Registry state, compliance queue and deployment posture for the reference network."
      actions={
        <ButtonLink href="/compliance" size="sm">
          Open queue <ArrowUpRight size={12} />
        </ButtonLink>
      }
    >
      <div className="p-page">
        <div className="p-banner">
          <ShieldCheck size={16} />
          <div>
            <strong>Demo administration surface.</strong>
            <p>
              Approvals, freezes and deployment actions are simulated. No privileged contract call
              can be made from this build and no API key is configured.
            </p>
          </div>
          <Badge tone="amber">Read-only demo</Badge>
        </div>

        <div className="ar-kpis">
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Assets in registry <Gauge size={13} />
            </span>
            <span className="ar-kpi__value">{metrics.assetsInRegistry}</span>
            <span className="ar-kpi__detail">Synthetic records</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Pending reviews <FileWarning size={13} />
            </span>
            <span className="ar-kpi__value">{metrics.pendingReviews}</span>
            <span className="ar-kpi__detail is-warning">Requires compliance officer</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Eligible investors <Users size={13} />
            </span>
            <span className="ar-kpi__value">{metrics.eligibleInvestors}</span>
            <span className="ar-kpi__detail">Demo verification states</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Scheduled distributions <Activity size={13} />
            </span>
            <span className="ar-kpi__value">
              {formatMoney(metrics.distributionsScheduled, true)}
            </span>
            <span className="ar-kpi__detail">Synthetic amounts</span>
          </div>
        </div>

        <div className="p-split">
          <section className="p-card p-card--flush">
            <div className="p-card__head" style={{ padding: '18px 20px 0' }}>
              <div>
                <h3>Compliance review queue</h3>
                <p>Investor, issuer and asset cases awaiting a decision.</p>
              </div>
              <Link href="/compliance" className="ar-text-link">
                Full queue <ArrowUpRight size={11} />
              </Link>
            </div>
            <div style={{ padding: '0 20px 16px', display: 'grid', gap: 10 }}>
              {pending.map((item) => (
                <div className="a-case" key={item.id}>
                  <div className="a-case__top">
                    <div>
                      <h3>{item.subject}</h3>
                      <p>
                        {item.id} · {item.type.toUpperCase()} · {item.jurisdiction}
                      </p>
                    </div>
                    <Badge
                      tone={
                        item.risk === 'high' ? 'red' : item.risk === 'medium' ? 'amber' : 'green'
                      }
                      dot
                    >
                      {item.risk} risk
                    </Badge>
                  </div>
                  <div className="a-case__checks">
                    {item.checks.map((check) => (
                      <div key={check.label}>
                        <span>{check.label}</span>
                        <strong>
                          <CircleAlert size={10} />
                          {check.state}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <div className="a-case__actions">
                    <Badge tone="amber">Synthetic case</Badge>
                    <span className="a-case__note">
                      Submitted {item.submittedAt} · expires {item.expiresAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="p-stack">
            <section className="p-card">
              <div className="p-card__head">
                <div>
                  <h3>Registry health</h3>
                  <p>Reference implementation state</p>
                </div>
                <Badge tone="amber">Not deployed</Badge>
              </div>
              <div style={{ display: 'grid', gap: 16 }}>
                <ProgressBar value={100} label="Evidence-linked records" tone="green" />
                <ProgressBar value={60} label="Verified structures" tone="amber" />
                <ProgressBar value={0} label="Mainnet contracts" tone="blue" />
                <ProgressBar value={72} label="Operational controls tested" tone="blue" />
              </div>
            </section>

            <section className="p-card">
              <div className="p-card__head">
                <div>
                  <h3>Open operational alerts</h3>
                  <p>For review by operations</p>
                </div>
              </div>
              {[
                [
                  'Valuation freshness',
                  'Two reference valuations exceed the design freshness threshold.',
                ],
                ['Evidence renewal', 'Insurance digest review due in 14 days (synthetic).'],
                ['Distributions', 'One epoch is awaiting reconciliation before claims open.'],
              ].map(([title, detail]) => (
                <div className="a-alert-item" key={title}>
                  <span className="a-alert-item__icon">
                    <FileWarning size={13} />
                  </span>
                  <div>
                    <strong>{title}</strong>
                    <p>{detail}</p>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>

        <section className="p-card">
          <div className="p-card__head">
            <div>
              <h3>Protocol module status</h3>
              <p>Implementation state, not deployment or audit.</p>
            </div>
            <Badge tone="silver">{demoSnapshot.protocol.length} modules</Badge>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {demoSnapshot.protocol.map((module) => (
              <div
                key={module.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '10px 12px',
                  background: 'rgba(9, 18, 32, 0.5)',
                  border: '1px solid var(--ar-line)',
                  borderRadius: 4,
                }}
              >
                <span style={{ color: 'var(--ar-muted-strong)', fontSize: 9 }}>{module.name}</span>
                <Badge tone={module.status === 'tested' ? 'green' : 'amber'}>{module.status}</Badge>
              </div>
            ))}
          </div>
        </section>

        <div className="p-callout">
          <ShieldCheck size={13} />
          <span>
            <strong>No real authority.</strong> This demo does not include authentication, role
            assignment or key custody. A production admin surface requires SSO, hardware-backed
            approvals, separation of duties and immutable audit records.
          </span>
        </div>
      </div>
    </PortalFrame>
  );
}
