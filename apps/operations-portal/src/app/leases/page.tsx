import type { Metadata } from 'next';
import { Badge, DataTable, ProgressBar, type Column } from '@aerospace/design-system';
import {
  demoSnapshot,
  formatMoney,
  getDemoAssetById,
  type LeaseRecord,
} from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Leases' };

export default function LeasesPage() {
  const columns: Column<LeaseRecord>[] = [
    {
      key: 'asset',
      header: 'Asset / lessee',
      render: (row) => (
        <div>
          <strong style={{ color: 'var(--ar-ink)', fontSize: 9.5 }}>
            {getDemoAssetById(row.assetId)?.shortName ?? row.assetId}
          </strong>
          <small style={{ display: 'block', color: 'var(--ar-faint)', fontSize: 7.5 }}>
            {row.lessee} · {row.id}
          </small>
        </div>
      ),
    },
    {
      key: 'rent',
      header: 'Monthly rent',
      align: 'right',
      render: (row) => formatMoney(row.monthlyRent),
    },
    {
      key: 'progress',
      header: 'Payments',
      render: (row) => (
        <div style={{ minWidth: 100 }}>
          <ProgressBar value={(row.paymentsMade / row.totalPayments) * 100} />
          <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 6.5 }}>
            {row.paymentsMade} / {row.totalPayments}
          </span>
        </div>
      ),
    },
    {
      key: 'next',
      header: 'Next payment',
      align: 'right',
      render: (row) => <span className="ar-mono">{row.nextPaymentDate}</span>,
    },
    {
      key: 'maturity',
      header: 'Maturity',
      align: 'right',
      render: (row) => <span className="ar-mono">{row.maturityDate}</span>,
    },
    {
      key: 'reserve',
      header: 'Reserve',
      align: 'right',
      render: (row) => `${row.reserveMonths} mo`,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (row) => (
        <Badge
          tone={row.status === 'performing' ? 'green' : row.status === 'delinquent' ? 'red' : 'amber'}
          dot
        >
          {row.status.replace('_', ' ')}
        </Badge>
      ),
    },
  ];

  return (
    <PortalFrame
      title="Lease register"
      subtitle="Synthetic lease schedules used to model rent reconciliation and distribution funding."
    >
      <div className="p-page">
        <div className="p-banner">
          <Badge tone="amber" dot>Illustrative</Badge>
          <div>
            <strong>Lease records are fabricated.</strong>
            <p>
              Monthly rent and payment progress are design values. In production, receipts would be
              reconciled against bank and servicer reports before distribution epochs are funded.
            </p>
          </div>
        </div>

        <div className="o-gauge">
          <div>
            <span>Total monthly rent</span>
            <strong>
              {formatMoney({
                amount: demoSnapshot.leases.reduce((sum, lease) => sum + lease.monthlyRent.amount, 0),
                currency: 'USD',
              })}
            </strong>
            <small>Synthetic schedule</small>
          </div>
          <div>
            <span>Performing</span>
            <strong>{demoSnapshot.leases.filter((lease) => lease.status === 'performing').length}</strong>
            <small>of {demoSnapshot.leases.length} leases</small>
          </div>
          <div>
            <span>Reserve coverage</span>
            <strong>
              {Math.round(
                demoSnapshot.leases.reduce((sum, lease) => sum + lease.reserveMonths, 0) /
                  demoSnapshot.leases.length,
              )}{' '}
              mo
            </strong>
            <small>Average design reserve</small>
          </div>
        </div>

        <section className="p-card p-card--flush">
          <DataTable
            columns={columns}
            rows={demoSnapshot.leases}
            getKey={(row) => row.id}
            caption="Illustrative lease records"
          />
        </section>

        <div className="p-callout">
          <Badge tone="amber">Demo</Badge>
          <span>
            A delinquent lease would pause or reduce distributions and trigger an operations task.
            No such real event exists in this repository.
          </span>
        </div>
      </div>
    </PortalFrame>
  );
}
