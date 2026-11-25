import type { Metadata } from 'next';
import { Badge, ButtonLink, DataTable, type Column } from '@aerospace/design-system';
import {
  demoSnapshot,
  formatMoney,
  getDemoAssetById,
  type Distribution,
} from '@aerospace/shared-types';
import { ClaimPanel } from '@/components/claim-panel';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Distributions' };

const tone = (status: Distribution['status']) => {
  switch (status) {
    case 'available':
      return 'green' as const;
    case 'paid':
      return 'blue' as const;
    case 'reconciling':
      return 'amber' as const;
    default:
      return 'neutral' as const;
  }
};

export default function DistributionsPage() {
  const distributions = demoSnapshot.distributions;
  const columns: Column<Distribution>[] = [
    {
      key: 'epoch',
      header: 'Epoch',
      render: (row) => (
        <div>
          <strong style={{ color: 'var(--ar-ink)' }}>{row.epoch}</strong>
          <small style={{ display: 'block', color: 'var(--ar-faint)', fontSize: 7.5 }}>
            {getDemoAssetById(row.assetId)?.shortName}
          </small>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => formatMoney(row.amount),
    },
    {
      key: 'record',
      header: 'Record date',
      align: 'right',
      render: (row) => <span className="ar-mono">{row.recordDate}</span>,
    },
    {
      key: 'pay',
      header: 'Pay date',
      align: 'right',
      render: (row) => <span className="ar-mono">{row.payDate}</span>,
    },
    {
      key: 'source',
      header: 'Reconciled source',
      render: (row) => <span style={{ color: 'var(--ar-muted)', fontSize: 9 }}>{row.source}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (row) => (
        <Badge tone={tone(row.status)} dot>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <PortalFrame
      title="Distributions"
      subtitle="Revenue epochs, record dates and claims for the demo investor."
      actions={
        <ButtonLink href="/portfolio" variant="secondary" size="sm">
          Portfolio
        </ButtonLink>
      }
    >
      <div className="p-page">
        <div className="p-banner">
          <Badge tone="amber" dot>
            Illustrative
          </Badge>
          <div>
            <strong>Revenue records are synthetic.</strong>
            <p>
              In production, an epoch is reconciled to lease or service receipts before the
              distribution contract allows claims.
            </p>
          </div>
        </div>

        <div className="p-split">
          <section className="p-card p-card--flush">
            <div className="p-card__head" style={{ padding: '18px 20px 0' }}>
              <div>
                <h3>Distribution register</h3>
                <p>One record per epoch and asset.</p>
              </div>
            </div>
            <DataTable
              columns={columns}
              rows={distributions}
              getKey={(row) => row.id}
              caption="Illustrative distribution records"
            />
          </section>

          <div className="p-stack">
            <ClaimPanel distributions={distributions} />
            <section className="p-card">
              <div className="p-card__head">
                <div>
                  <h3>Claim mechanics</h3>
                  <p>Reference contract behaviour</p>
                </div>
              </div>
              <div className="p-list">
                {[
                  [
                    'Epoch recorded',
                    'The operator records reconciled receipts and publishes an allocation root.',
                  ],
                  [
                    'Allocation proven',
                    'An investor claim is checked against the published allocation.',
                  ],
                  [
                    'Claimed once',
                    'The contract marks the epoch as claimed before value leaves the pool.',
                  ],
                  ['Reconciled', 'The indexer maps the event to the operational ledger.'],
                ].map(([title, detail]) => (
                  <div className="p-list__item" key={title}>
                    <div className="p-list__body">
                      <strong>{title}</strong>
                      <p>{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </PortalFrame>
  );
}
