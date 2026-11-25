import type { Metadata } from 'next';
import { ArrowUpRight, FileCheck2, Gauge, Layers3, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Badge, ButtonLink, ProgressBar } from '@aerospace/design-system';
import { demoSnapshot, formatMoney, getDemoAssetById } from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Issuer overview' };

const stages = [
  { label: 'Draft', count: 1, note: 'evidence incomplete', pct: 20 },
  { label: 'Evidence review', count: 2, note: 'under review', pct: 45 },
  { label: 'Verified', count: 1, note: 'ready to structure', pct: 65 },
  { label: 'Tokenized', count: 1, note: 'testnet design', pct: 82 },
  { label: 'Offering', count: 1, note: 'demo open', pct: 100 },
];

export default function IssuerDashboard() {
  const assets = demoSnapshot.assets;
  const pipeline = assets.slice(0, 5);
  const avgEvidence = Math.round(
    assets.reduce((sum, asset) => sum + asset.evidenceCompleteness, 0) / assets.length,
  );

  return (
    <PortalFrame
      title="Issuer overview"
      subtitle="Structure your aerospace assets, evidence and offering readiness."
      actions={
        <ButtonLink href="/assets/new" size="sm">
          New structure <ArrowUpRight size={12} />
        </ButtonLink>
      }
    >
      <div className="p-page">
        <section className="s-hero">
          <div>
            <span
              className="ar-mono"
              style={{ color: 'var(--ar-cyan)', fontSize: 7.5, letterSpacing: '0.1em' }}
            >
              ISSUER · REFERENCE ORGANISATION
            </span>
            <h2>From technical evidence to an eligible, controlled offering.</h2>
            <p>
              This workspace models the issuer journey: register the asset, assemble evidence,
              define the legal and token boundary, prepare the offering and hand verified records to
              the marketplace. No structure can skip the evidence gate.
            </p>
            <div className="p-actions" style={{ marginTop: 16 }}>
              <ButtonLink href="/assets/new" size="sm">
                Start a draft
              </ButtonLink>
              <ButtonLink href="/evidence" variant="secondary" size="sm">
                Evidence register
              </ButtonLink>
            </div>
          </div>
          <div className="s-hero__side">
            {[
              ['Organisation', 'Demo Aerospace Holdings'],
              ['Issuer status', 'Synthetic · not approved'],
              ['Jurisdiction', 'Illustrative'],
              ['Structures', `${assets.length} records`],
              ['Evidence average', `${avgEvidence}%`],
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
              Structures <Layers3 size={13} />
            </span>
            <span className="ar-kpi__value">{assets.length}</span>
            <span className="ar-kpi__detail">Synthetic registry records</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Verified evidence <FileCheck2 size={13} />
            </span>
            <span className="ar-kpi__value">{avgEvidence}%</span>
            <span className="ar-kpi__detail is-warning">2 packages need review</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Open offerings <Gauge size={13} />
            </span>
            <span className="ar-kpi__value">
              {
                assets.filter(
                  (asset) =>
                    asset.offering?.status === 'open' || asset.offering?.status === 'closing_soon',
                ).length
              }
            </span>
            <span className="ar-kpi__detail">Demo commitments only</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Committed (demo) <ShieldCheck size={13} />
            </span>
            <span className="ar-kpi__value">
              {formatMoney(demoSnapshot.metrics.illustrativeCapitalCommitted, true)}
            </span>
            <span className="ar-kpi__detail">No funds received</span>
          </div>
        </div>

        <section className="p-card">
          <div className="p-card__head">
            <div>
              <h3>Structure pipeline</h3>
              <p>Reference state only. Counts are illustrative.</p>
            </div>
            <Badge tone="amber">Demo pipeline</Badge>
          </div>
          <div className="s-pipeline">
            {stages.map((stage) => (
              <div className="s-pipeline__stage" key={stage.label}>
                <span>{stage.label}</span>
                <strong>{stage.count.toString().padStart(2, '0')}</strong>
                <small>{stage.note}</small>
                <div className="s-pipeline__bar">
                  <i style={{ width: `${stage.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="p-split">
          <section className="p-card p-card--flush">
            <div className="p-card__head" style={{ padding: '18px 20px 0' }}>
              <div>
                <h3>Recent structures</h3>
                <p>Evidence completeness and offering state.</p>
              </div>
              <ButtonLink href="/assets" variant="ghost" size="sm">
                All assets
              </ButtonLink>
            </div>
            <div style={{ padding: '0 20px 16px' }}>
              <div className="s-asset-list">
                {pipeline.map((asset) => (
                  <div key={asset.id} className="s-asset">
                    <div>
                      <div className="s-asset__top">
                        <Badge
                          tone={
                            asset.status === 'active'
                              ? 'green'
                              : asset.status === 'evidence_review'
                                ? 'amber'
                                : 'blue'
                          }
                          dot
                        >
                          {asset.status.replace('_', ' ')}
                        </Badge>
                        <Badge tone="silver">{asset.vertical}</Badge>
                        <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 7 }}>
                          {asset.registryId}
                        </span>
                      </div>
                      <h3>{asset.shortName}</h3>
                      <p>{asset.summary}</p>
                      <div className="s-asset__meta">
                        <span>{asset.tokenSymbol}</span>
                        <span>{formatMoney(asset.valuation.value, true)}</span>
                        <span>{asset.documents.length} evidence files</span>
                      </div>
                      <ProgressBar
                        value={asset.evidenceCompleteness}
                        label="Evidence completeness"
                        tone={asset.evidenceCompleteness > 90 ? 'green' : 'amber'}
                      />
                    </div>
                    <div className="s-asset__side">
                      <div>
                        <span>Offering</span>
                        <b>{asset.offering?.status ?? 'none'}</b>
                      </div>
                      <div>
                        <span>Contract</span>
                        <b>{asset.tokenization.contractState}</b>
                      </div>
                      <div>
                        <span>Last verified</span>
                        <b>{asset.lastVerifiedAt.slice(0, 10)}</b>
                      </div>
                      <ButtonLink
                        href={`http://localhost:3000/assets/${asset.slug}`}
                        variant="secondary"
                        size="sm"
                      >
                        Public view <ArrowUpRight size={11} />
                      </ButtonLink>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="p-stack">
            <section className="p-card">
              <div className="p-card__head">
                <div>
                  <h3>Readiness gates</h3>
                  <p>What blocks publication</p>
                </div>
              </div>
              <div className="p-list">
                {[
                  [
                    'Asset evidence',
                    'Ownership, registration, inspection and insurance digests required.',
                    'pass',
                  ],
                  [
                    'Legal structure',
                    'SPV documents and rights description must be attached.',
                    'pending',
                  ],
                  [
                    'Compliance review',
                    'Offering eligibility and jurisdictions require approval.',
                    'pending',
                  ],
                  [
                    'Technical review',
                    'Contract parameters and transfer rules must match the documents.',
                    'pass',
                  ],
                ].map(([title, detail, state]) => (
                  <div className="p-list__item" key={title}>
                    <span className="p-list__icon">
                      {state === 'pass' ? <ShieldCheck size={14} /> : <TriangleAlert size={14} />}
                    </span>
                    <div className="p-list__body">
                      <strong>{title}</strong>
                      <p>{detail}</p>
                    </div>
                    <Badge tone={state === 'pass' ? 'green' : 'amber'}>{state}</Badge>
                  </div>
                ))}
              </div>
            </section>

            <section className="p-card">
              <div className="p-card__head">
                <div>
                  <h3>Policy reminder</h3>
                  <p>Issuer obligations</p>
                </div>
              </div>
              <div className="p-callout">
                <TriangleAlert size={13} />
                <span>
                  An issuer may not describe a token as ownership of an aerospace asset unless the
                  legal documents expressly grant that right and counsel has approved the
                  disclosure. This demo makes no such claim.
                </span>
              </div>
              <div style={{ marginTop: 14 }}>
                <ProgressBar value={64} label="Reference disclosure checklist" tone="blue" />
              </div>
            </section>
          </div>
        </div>

        <section className="p-card">
          <div className="p-card__head">
            <div>
              <h3>Recent issuer activity</h3>
              <p>Synthetic workflow events</p>
            </div>
          </div>
          <div className="p-activity">
            {demoSnapshot.activity.slice(0, 7).map((event) => (
              <div className="p-activity__item" key={event.id}>
                <span className={`p-activity__dot is-${event.severity}`} aria-hidden="true" />
                <div className="p-activity__body">
                  <strong>{event.title}</strong>
                  <p>{event.detail}</p>
                </div>
                <span className="p-activity__time">{event.at.slice(5, 10)}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="p-callout">
          <TriangleAlert size={13} />
          <span>
            <strong>Not a live issuer.</strong> This organisation is synthetic. No asset is held, no
            offering document exists, no token is deployed and no investor has been contacted.
            {` ${getDemoAssetById('ast_eng_001')?.shortName}`} is a reference structure used for
            interface testing.
          </span>
        </div>
      </div>
    </PortalFrame>
  );
}
