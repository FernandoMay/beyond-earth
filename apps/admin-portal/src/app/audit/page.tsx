import type { Metadata } from 'next';
import { Activity, BadgeCheck, FileClock } from 'lucide-react';
import { Badge, DataTable, type Column } from '@aerospace/design-system';
import { demoSnapshot, type ActivityEvent } from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Audit log' };

export default function AuditPage() {
  const columns: Column<ActivityEvent>[] = [
    {
      key: 'at',
      header: 'Timestamp',
      render: (row) => <span className="ar-mono">{row.at.replace('T', ' ').slice(0, 16)}</span>,
    },
    {
      key: 'kind',
      header: 'Event',
      render: (row) => <span className="ar-mono">{row.kind}</span>,
    },
    {
      key: 'title',
      header: 'Description',
      render: (row) => (
        <div>
          <strong style={{ color: 'var(--ar-ink)', fontSize: 9.5 }}>{row.title}</strong>
          <small style={{ display: 'block', marginTop: 2, color: 'var(--ar-faint)', fontSize: 8 }}>
            {row.detail}
          </small>
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (row) => row.actor,
    },
    {
      key: 'severity',
      header: 'Severity',
      align: 'right',
      render: (row) => (
        <Badge
          tone={
            row.severity === 'success' ? 'green' : row.severity === 'warning' ? 'amber' : 'blue'
          }
        >
          {row.severity}
        </Badge>
      ),
    },
  ];

  return (
    <PortalFrame
      title="Audit log"
      subtitle="Synthetic event history demonstrating the expected audit surface."
    >
      <div className="p-page">
        <div className="p-banner">
          <FileClock size={16} />
          <div>
            <strong>Audit records are generated demo data.</strong>
            <p>
              In production, audit records would be append-only, attributable and correlated with
              API request IDs and on-chain events.
            </p>
          </div>
        </div>

        <div className="ar-kpis">
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Events <Activity size={13} />
            </span>
            <span className="ar-kpi__value">{demoSnapshot.activity.length}</span>
            <span className="ar-kpi__detail">Synthetic entries</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Success <BadgeCheck size={13} />
            </span>
            <span className="ar-kpi__value">
              {demoSnapshot.activity.filter((item) => item.severity === 'success').length}
            </span>
            <span className="ar-kpi__detail is-positive">Normal state transitions</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">Warnings</span>
            <span className="ar-kpi__value">
              {demoSnapshot.activity.filter((item) => item.severity === 'warning').length}
            </span>
            <span className="ar-kpi__detail is-warning">Requires review</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">Retention</span>
            <span className="ar-kpi__value">—</span>
            <span className="ar-kpi__detail">Not configured in demo</span>
          </div>
        </div>

        <section className="p-card p-card--flush">
          <div className="p-card__head" style={{ padding: '18px 20px 0' }}>
            <div>
              <h3>Event register</h3>
              <p>Illustrative actors and timestamps.</p>
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={demoSnapshot.activity}
            getKey={(row) => row.id}
            caption="Synthetic audit events"
          />
        </section>

        <div className="p-callout">
          <FileClock size={13} />
          <span>
            <strong>No chain events.</strong> Nothing in this log was emitted by Soroban. The
            indexer service would populate a real register from contract events and a durable
            cursor.
          </span>
        </div>
      </div>
    </PortalFrame>
  );
}
