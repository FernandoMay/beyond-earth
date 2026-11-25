import type { Metadata } from 'next';
import { ArrowUpRight, Filter, ShieldCheck } from 'lucide-react';
import { Badge, ButtonLink, ProgressBar } from '@aerospace/design-system';
import { demoSnapshot, formatMoney, formatPercent } from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Opportunities' };

export default function OpportunitiesPage() {
  const assets = demoSnapshot.assets.filter(
    (asset) => asset.offering && asset.offering.status !== 'draft',
  );

  return (
    <PortalFrame
      title="Opportunities"
      subtitle="Structures currently surfaced to an eligible demo investor."
      actions={
        <ButtonLink href="http://localhost:3000/marketplace" variant="secondary" size="sm">
          Public marketplace <ArrowUpRight size={12} />
        </ButtonLink>
      }
    >
      <div className="p-page">
        <div className="p-banner">
          <ShieldCheck size={16} />
          <div>
            <strong>Eligibility is checked before an offering is shown.</strong>
            <p>
              This demo profile is a synthetic tier-2 investor. Real availability depends on
              jurisdiction, offering documents and issuer approval.
            </p>
          </div>
          <ButtonLink href="/onboarding" size="sm" variant="secondary">
            Eligibility
          </ButtonLink>
        </div>

        <div className="p-toolbar">
          <div className="p-search">
            <Filter size={13} />
            <input
              placeholder="Filter by vertical, operator or registry ID"
              aria-label="Filter opportunities"
            />
          </div>
          <Badge tone="amber">{assets.length} open or closing structures</Badge>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {assets.map((asset) => {
            const offering = asset.offering!;
            const pct = (offering.committed.amount / offering.targetRaise.amount) * 100;
            return (
              <article
                key={asset.id}
                className="p-card"
                style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 28 }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Badge tone="amber" dot>
                      Illustrative
                    </Badge>
                    <Badge tone="silver">{asset.vertical}</Badge>
                    <Badge tone={offering.status === 'closing_soon' ? 'amber' : 'blue'} dot>
                      {offering.status.replace('_', ' ')}
                    </Badge>
                    <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 7.5 }}>
                      {asset.registryId}
                    </span>
                  </div>
                  <h3
                    style={{
                      marginTop: 12,
                      color: 'var(--ar-ink)',
                      fontFamily: 'var(--ar-font-display)',
                      fontSize: 20,
                      fontWeight: 430,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {asset.name}
                  </h3>
                  <p
                    style={{
                      marginTop: 7,
                      color: 'var(--ar-muted)',
                      fontSize: 10,
                      lineHeight: 1.65,
                      maxWidth: 620,
                    }}
                  >
                    {asset.summary}
                  </p>
                  <dl
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 1,
                      marginTop: 18,
                      background: 'var(--ar-line)',
                      border: '1px solid var(--ar-line)',
                    }}
                  >
                    {[
                      ['Reference value', formatMoney(asset.valuation.value, true)],
                      [
                        'Target distribution',
                        asset.financials.targetDistribution
                          ? `${formatPercent(asset.financials.targetDistribution.min)}–${formatPercent(asset.financials.targetDistribution.max)}`
                          : '—',
                      ],
                      ['Minimum ticket', formatMoney(offering.minTicket)],
                      ['Evidence', `${asset.evidenceCompleteness}%`],
                    ].map(([label, value]) => (
                      <div key={label} style={{ padding: 10, background: '#08111f' }}>
                        <dt
                          style={{
                            color: 'var(--ar-faint)',
                            fontSize: 6.5,
                            letterSpacing: '0.07em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {label}
                        </dt>
                        <dd style={{ marginTop: 4, color: 'var(--ar-silver)', fontSize: 9 }}>
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div style={{ display: 'grid', alignContent: 'start', gap: 12 }}>
                  <div>
                    <span style={{ color: 'var(--ar-faint)', fontSize: 7.5 }}>
                      Demo commitments
                    </span>
                    <strong
                      style={{
                        display: 'block',
                        marginTop: 3,
                        color: 'var(--ar-ink)',
                        fontFamily: 'var(--ar-font-display)',
                        fontSize: 24,
                        fontWeight: 420,
                        letterSpacing: '-0.035em',
                      }}
                    >
                      {formatMoney(offering.committed, true)}
                    </strong>
                    <span style={{ color: 'var(--ar-muted)', fontSize: 8 }}>
                      of {formatMoney(offering.targetRaise, true)} target
                    </span>
                  </div>
                  <ProgressBar value={pct} label={`${offering.investorCount} demo investors`} />
                  <ButtonLink
                    href={`http://localhost:3000/assets/${asset.slug}`}
                    variant="secondary"
                    size="sm"
                  >
                    Review structure <ArrowUpRight size={12} />
                  </ButtonLink>
                  <p style={{ color: 'var(--ar-faint)', fontSize: 7.5, lineHeight: 1.6 }}>
                    {offering.eligibility}. No subscription is accepted in demo mode.
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </PortalFrame>
  );
}
