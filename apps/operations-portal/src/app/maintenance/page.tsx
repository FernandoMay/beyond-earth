import type { Metadata } from 'next';
import { Badge, DataTable, type Column } from '@aerospace/design-system';
import { demoSnapshot, getDemoAssetById, type MaintenanceRecord } from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Maintenance' };

export default function MaintenancePage() {
  const columns: Column<MaintenanceRecord>[] = [
    {
      key: 'asset',
      header: 'Asset',
      render: (row) => (
        <div>
          <strong style={{ color: 'var(--ar-ink)', fontSize: 9.5 }}>
            {getDemoAssetById(row.assetId)?.shortName ?? row.assetId}
          </strong>
          <small style={{ display: 'block', color: 'var(--ar-faint)', fontSize: 7.5 }}>
            {row.id}
          </small>
        </div>
      ),
    },
    { key: 'component', header: 'Component', render: (row) => row.component },
    { key: 'task', header: 'Task', render: (row) => row.task },
    {
      key: 'interval',
      header: 'Interval',
      render: (row) => <span className="ar-mono">{row.interval}</span>,
    },
    {
      key: 'last',
      header: 'Last completed',
      align: 'right',
      render: (row) => <span className="ar-mono">{row.lastCompleted}</span>,
    },
    {
      key: 'next',
      header: 'Next due',
      align: 'right',
      render: (row) => <span className="ar-mono">{row.nextDue}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (row) => (
        <Badge
          tone={row.status === 'overdue' ? 'red' : row.status === 'due_soon' ? 'amber' : 'green'}
          dot
        >
          {row.status.replace('_', ' ')}
        </Badge>
      ),
    },
  ];

  return (
    <PortalFrame
      title="Maintenance"
      subtitle="Synthetic maintenance intervals and inspection state."
    >
      <div className="p-page">
        <div className="p-banner">
          <Badge tone="amber" dot>
            Illustrative
          </Badge>
          <div>
            <strong>Maintenance records are synthetic.</strong>
            <p>
              They do not represent airworthiness, shop visits or regulatory compliance. A real
              deployment would integrate with approved maintenance providers and document systems.
            </p>
          </div>
        </div>

        <div className="o-gauge">
          <div>
            <span>Current</span>
            <strong>
              {demoSnapshot.maintenance.filter((item) => item.status === 'current').length}
            </strong>
            <small>Within interval</small>
          </div>
          <div>
            <span>Due soon</span>
            <strong>
              {demoSnapshot.maintenance.filter((item) => item.status === 'due_soon').length}
            </strong>
            <small>Review required</small>
          </div>
          <div>
            <span>Overdue</span>
            <strong>
              {demoSnapshot.maintenance.filter((item) => item.status === 'overdue').length}
            </strong>
            <small>Would block operations</small>
          </div>
        </div>

        <section className="p-card p-card--flush">
          <DataTable
            columns={columns}
            rows={demoSnapshot.maintenance}
            getKey={(row) => row.id}
            caption="Illustrative maintenance records"
          />
        </section>

        <div className="p-callout">
          <Badge tone="amber">Demo</Badge>
          <span>
            Maintenance evidence should be versioned and hash-linked in the asset registry. This
            demo shows the operational shape only.
          </span>
        </div>
      </div>
    </PortalFrame>
  );
}
