import type { Metadata } from 'next';
import { ArrowUpRight, Fingerprint, ShieldCheck } from 'lucide-react';
import { Badge, ButtonLink, ProgressBar } from '@aerospace/design-system';
import { demoSnapshot, formatMoney } from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Registry review' };

export default function RegistryPage() {
  return (
    <PortalFrame
      title="Registry review"
      subtitle="Evidence linkage, lifecycle state and valuation freshness across the demo registry."
    >
      <div className="p-page">
        <div className="p-banner">
          <Fingerprint size={16} />
          <div>
            <strong>Registry records are evidence-linked.</strong>
            <p>
              A record carries its category, jurisdiction, operator, lifecycle state and document
              digests. Verification is a state transition, not a label.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {demoSnapshot.assets.map((asset) => (
            <section className="p-card" key={asset.id}>
              <div className="p-card__head">
                <div>
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
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
                  <h3 style={{ marginTop: 9, fontSize: 17 }}>{asset.name}</h3>
                  <p>
                    {asset.ownerEntity} · {asset.operator}
                  </p>
                </div>
                <ButtonLink
                  href={`http://localhost:3000/assets/${asset.slug}`}
                  variant="secondary"
                  size="sm"
                >
                  Public record <ArrowUpRight size={11} />
                </ButtonLink>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 1,
                  background: 'var(--ar-line)',
                  border: '1px solid var(--ar-line)',
                }}
              >
                {[
                  ['Jurisdiction', asset.jurisdiction],
                  ['Reference value', formatMoney(asset.valuation.value, true)],
                  ['Valuation as of', asset.valuation.asOf],
                  ['Last verified', asset.lastVerifiedAt.slice(0, 10)],
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

              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}
              >
                <ProgressBar
                  value={asset.evidenceCompleteness}
                  label="Evidence completeness"
                  tone={asset.evidenceCompleteness >= 90 ? 'green' : 'amber'}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'var(--ar-faint)',
                    fontSize: 8,
                  }}
                >
                  <ShieldCheck size={12} style={{ color: 'var(--ar-cyan)' }} />
                  {asset.documents.length} document digests · {asset.risks.length} risk factors ·{' '}
                  {asset.milestones.length} milestones
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="p-callout">
          <Fingerprint size={13} />
          <span>
            These records are synthetic. Registry verification in production requires evidence
            review by authorised officers and must be attributable in an immutable audit log.
          </span>
        </div>
      </div>
    </PortalFrame>
  );
}
