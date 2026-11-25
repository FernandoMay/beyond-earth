import type { Metadata } from 'next';
import { Radar, ShieldAlert } from 'lucide-react';
import { Badge } from '@aerospace/design-system';
import { demoSnapshot, getDemoAssetById } from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Oracle feeds' };

export default function OraclesPage() {
  return (
    <PortalFrame
      title="Oracle feeds"
      subtitle="Synthetic valuation and operating metrics with freshness and signature state."
    >
      <div className="p-page">
        <div className="p-banner">
          <Radar size={16} />
          <div>
            <strong>No external oracle is connected.</strong>
            <p>
              These snapshots are seeded records. In production, oracle adapters would verify
              signatures, freshness and provider authorisation before values reach a contract.
            </p>
          </div>
          <Badge tone="amber">
            {demoSnapshot.oracles.filter((item) => !item.signed).length} unsigned
          </Badge>
        </div>

        <div className="o-feed">
          <div
            className="o-feed__row"
            style={{ background: 'transparent', borderColor: 'transparent', paddingBottom: 0 }}
          >
            <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 6.5 }}>
              ASSET / METRIC
            </span>
            <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 6.5 }}>
              PROVIDER
            </span>
            <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 6.5 }}>
              OBSERVED
            </span>
            <span
              className="ar-mono"
              style={{ color: 'var(--ar-faint)', fontSize: 6.5, textAlign: 'right' }}
            >
              STATUS
            </span>
          </div>
          {demoSnapshot.oracles.map((oracle) => (
            <div className="o-feed__row" key={oracle.id}>
              <div>
                <strong>{getDemoAssetById(oracle.assetId)?.shortName ?? oracle.assetId}</strong>
                <span style={{ display: 'block', marginTop: 2 }}>
                  {oracle.metric} · {oracle.value}
                </span>
              </div>
              <span>{oracle.provider}</span>
              <span className="ar-mono" style={{ fontSize: 7.5 }}>
                {oracle.observedAt.replace('T', ' ').slice(0, 16)}
              </span>
              <div style={{ textAlign: 'right' }}>
                <Badge tone={oracle.signed ? 'green' : 'red'} dot>
                  {oracle.signed ? 'signed' : 'unsigned'}
                </Badge>
                <span
                  style={{
                    display: 'block',
                    marginTop: 3,
                    color: 'var(--ar-faint)',
                    fontSize: 6.5,
                  }}
                >
                  stale after {oracle.staleAfterHours}h
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <section className="p-card">
            <div className="p-card__head">
              <div>
                <h3>Freshness policy</h3>
                <p>Design rule</p>
              </div>
              <Badge tone="blue">Reference</Badge>
            </div>
            <p style={{ color: 'var(--ar-muted)', fontSize: 9.5, lineHeight: 1.7 }}>
              A valuation older than its freshness window must not be used for a new subscription,
              collateral decision or distribution calculation. The protocol should fail closed
              rather than consume a stale signed value.
            </p>
          </section>
          <section className="p-card">
            <div className="p-card__head">
              <div>
                <h3>Signature policy</h3>
                <p>Design rule</p>
              </div>
              <ShieldAlert size={15} style={{ color: 'var(--ar-amber)' }} />
            </div>
            <p style={{ color: 'var(--ar-muted)', fontSize: 9.5, lineHeight: 1.7 }}>
              Only authorised provider keys may update a feed. An unsigned observation is display
              metadata and never a settlement input. No provider key is configured in this demo.
            </p>
          </section>
        </div>

        <div className="p-callout">
          <ShieldAlert size={13} />
          <span>
            Oracle values are synthetic and must not be used to value any real asset or inform an
            investment decision.
          </span>
        </div>
      </div>
    </PortalFrame>
  );
}
