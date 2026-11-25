import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  CircleAlert,
  Gauge,
  Radar,
  Wrench,
} from 'lucide-react';
import { Badge, ButtonLink, ProgressBar } from '@aerospace/design-system';
import { demoSnapshot, formatMoney, getDemoAssetById } from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Operations overview' };

export default function OperationsDashboard() {
  const dueTasks = demoSnapshot.tasks.filter((task) => task.status !== 'done');
  const performingLeases = demoSnapshot.leases.filter((lease) => lease.status === 'performing');
  const staleOracles = demoSnapshot.oracles.filter((oracle) => !oracle.signed);

  return (
    <PortalFrame
      title="Operations overview"
      subtitle="Lease performance, maintenance, insurance and oracle freshness across the demo fleet."
      actions={
        <ButtonLink href="/tasks" size="sm">
          Task queue <ArrowUpRight size={12} />
        </ButtonLink>
      }
    >
      <div className="p-page">
        <section className="o-hero">
          <div>
            <span
              className="ar-mono"
              style={{ color: 'var(--ar-cyan)', fontSize: 7.5, letterSpacing: '0.1em' }}
            >
              OPERATIONS · SYNTHETIC FLEET
            </span>
            <h2>Operational truth is evidence, not a dashboard assumption.</h2>
            <p>
              Lease payments, maintenance intervals, insurance expiry and valuation freshness feed
              the asset lifecycle. A missed payment or expired policy must become a visible,
              auditable event before distributions are affected.
            </p>
            <div className="p-actions" style={{ marginTop: 16 }}>
              <ButtonLink href="/leases" size="sm">
                Lease register
              </ButtonLink>
              <ButtonLink href="/oracles" variant="secondary" size="sm">
                Oracle feeds
              </ButtonLink>
            </div>
          </div>
          <div className="o-hero__side">
            {[
              ['Leases tracked', `${demoSnapshot.leases.length}`],
              ['Performing', `${performingLeases.length}`],
              [
                'Maintenance due',
                `${demoSnapshot.maintenance.filter((item) => item.status !== 'current').length}`,
              ],
              [
                'Policies expiring',
                `${demoSnapshot.insurance.filter((item) => item.status !== 'active').length}`,
              ],
              ['Stale feeds', `${staleOracles.length}`],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </section>

        <div className="ar-kpis">
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Monthly rent <CalendarClock size={13} />
            </span>
            <span className="ar-kpi__value">
              {formatMoney(
                {
                  amount: demoSnapshot.leases.reduce(
                    (sum, lease) => sum + lease.monthlyRent.amount,
                    0,
                  ),
                  currency: 'USD',
                },
                true,
              )}
            </span>
            <span className="ar-kpi__detail">Synthetic lease schedule</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Open tasks <Wrench size={13} />
            </span>
            <span className="ar-kpi__value">{dueTasks.length}</span>
            <span className="ar-kpi__detail is-warning">
              {dueTasks.filter((task) => task.priority === 'high').length} high priority
            </span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Oracle coverage <Radar size={13} />
            </span>
            <span className="ar-kpi__value">
              {demoSnapshot.oracles.filter((oracle) => oracle.signed).length}/
              {demoSnapshot.oracles.length}
            </span>
            <span className="ar-kpi__detail is-warning">Signed feeds only</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Insurance coverage <Gauge size={13} />
            </span>
            <span className="ar-kpi__value">
              {formatMoney(
                {
                  amount: demoSnapshot.insurance.reduce(
                    (sum, policy) => sum + policy.coverage.amount,
                    0,
                  ),
                  currency: 'USD',
                },
                true,
              )}
            </span>
            <span className="ar-kpi__detail">Illustrative policies</span>
          </div>
        </div>

        <div className="p-split">
          <section className="p-card">
            <div className="p-card__head">
              <div>
                <h3>Lease performance</h3>
                <p>Payment status and next due dates.</p>
              </div>
              <Link href="/leases" className="ar-text-link">
                All leases <ArrowUpRight size={11} />
              </Link>
            </div>
            <div style={{ display: 'grid', gap: 0 }}>
              {demoSnapshot.leases.map((lease) => (
                <div className="o-timeline__item" key={lease.id}>
                  <span className="o-timeline__date">{lease.nextPaymentDate}</span>
                  <div>
                    <strong>{getDemoAssetById(lease.assetId)?.shortName ?? lease.assetId}</strong>
                    <p>
                      {lease.lessee} · {formatMoney(lease.monthlyRent)}/month · {lease.paymentsMade}
                      /{lease.totalPayments} paid
                    </p>
                  </div>
                  <Badge
                    tone={
                      lease.status === 'performing'
                        ? 'green'
                        : lease.status === 'delinquent'
                          ? 'red'
                          : 'amber'
                    }
                    dot
                  >
                    {lease.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          <div className="p-stack">
            <section className="p-card">
              <div className="p-card__head">
                <div>
                  <h3>Maintenance due</h3>
                  <p>Next interval by component</p>
                </div>
              </div>
              {demoSnapshot.maintenance.slice(0, 4).map((item) => (
                <div className="o-alert" key={item.id}>
                  <span
                    className="o-alert__icon"
                    style={{
                      color: 'var(--ar-cyan)',
                      background: 'rgba(95,213,255,0.06)',
                      borderColor: 'rgba(95,213,255,0.16)',
                    }}
                  >
                    <Wrench size={13} />
                  </span>
                  <div>
                    <strong>{item.task}</strong>
                    <p>
                      {item.component} · due {item.nextDue} · {item.provider}
                    </p>
                  </div>
                  <Badge
                    tone={
                      item.status === 'overdue'
                        ? 'red'
                        : item.status === 'due_soon'
                          ? 'amber'
                          : 'green'
                    }
                  >
                    {item.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </section>

            <section className="p-card">
              <div className="p-card__head">
                <div>
                  <h3>Operational alerts</h3>
                  <p>Requires human review</p>
                </div>
                <CircleAlert size={15} style={{ color: 'var(--ar-amber)' }} />
              </div>
              {[
                [
                  'Unsigned oracle feed',
                  'A valuation snapshot has no verified signature. Do not use for settlement.',
                ],
                [
                  'Policy renewal',
                  'One synthetic insurance policy expires inside the renewal window.',
                ],
                ['Distribution dependency', 'An epoch is blocked until receipts are reconciled.'],
              ].map(([title, detail]) => (
                <div className="o-alert" key={title}>
                  <span className="o-alert__icon">
                    <CircleAlert size={13} />
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
              <h3>Asset lifecycle status</h3>
              <p>Evidence and readiness by structure</p>
            </div>
            <Activity size={15} style={{ color: 'var(--ar-cyan)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {demoSnapshot.assets.slice(0, 3).map((asset) => (
              <div key={asset.id}>
                <span style={{ color: 'var(--ar-silver)', fontSize: 9.5 }}>{asset.shortName}</span>
                <div style={{ marginTop: 9 }}>
                  <ProgressBar
                    value={asset.evidenceCompleteness}
                    label={asset.registryId}
                    tone={asset.evidenceCompleteness >= 90 ? 'green' : 'amber'}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="p-callout">
          <CircleAlert size={13} />
          <span>
            <strong>Synthetic operations.</strong> No real lease, aircraft, engine, satellite or
            drone is tracked. Payments, maintenance events and policies are fabricated for interface
            testing.
          </span>
        </div>
      </div>
    </PortalFrame>
  );
}
