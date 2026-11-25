import type { Metadata } from 'next';
import { ArrowUpRight, CalendarClock, Landmark, ShieldCheck } from 'lucide-react';
import { Badge, ButtonLink, ProgressBar } from '@aerospace/design-system';
import { demoSnapshot, formatMoney, getDemoAssetById } from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Offerings' };

export default function OfferingsPage() {
  const offerings = demoSnapshot.assets.filter((asset) => asset.offering);

  return (
    <PortalFrame
      title="Offerings"
      subtitle="Reference offering terms, commitment progress and publication state."
      actions={
        <ButtonLink href="http://localhost:3000/marketplace" variant="secondary" size="sm">
          Public market <ArrowUpRight size={12} />
        </ButtonLink>
      }
    >
      <div className="p-page">
        <div className="p-banner">
          <Landmark size={16} />
          <div>
            <strong>Offerings are reference terms only.</strong>
            <p>
              No subscription is accepted, no escrow is funded and no offering document exists.
              Commitment figures are synthetic display values.
            </p>
          </div>
        </div>

        <div className="p-stack">
          {offerings.map((asset) => {
            const offering = asset.offering!;
            const pct = (offering.committed.amount / offering.targetRaise.amount) * 100;
            return (
              <section className="p-card" key={asset.id}>
                <div className="p-card__head">
                  <div>
                    <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Badge tone={offering.status === 'closing_soon' ? 'amber' : 'blue'} dot>
                        {offering.status.replace('_', ' ')}
                      </Badge>
                      <Badge tone="silver">{asset.vertical}</Badge>
                      <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 7 }}>
                        {offering.id}
                      </span>
                    </div>
                    <h3 style={{ marginTop: 9, fontSize: 18 }}>{asset.name}</h3>
                    <p>{offering.eligibility}</p>
                  </div>
                  <ButtonLink href={`http://localhost:3000/assets/${asset.slug}`} variant="secondary" size="sm">
                    Preview <ArrowUpRight size={11} />
                  </ButtonLink>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1, background: 'var(--ar-line)', border: '1px solid var(--ar-line)' }}>
                  {[
                    ['Target raise', formatMoney(offering.targetRaise)],
                    ['Committed (demo)', formatMoney(offering.committed)],
                    ['Minimum ticket', formatMoney(offering.minTicket)],
                    ['Investors', `${offering.investorCount}`],
                    ['Distribution', offering.distributionFrequency],
                  ].map(([label, value]) => (
                    <div key={label} style={{ padding: 13, background: '#08111f' }}>
                      <span style={{ color: 'var(--ar-faint)', fontSize: 6.5, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                        {label}
                      </span>
                      <strong style={{ display: 'block', marginTop: 5, color: 'var(--ar-silver)', fontSize: 9.5, fontWeight: 500 }}>
                        {value}
                      </strong>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginTop: 18, alignItems: 'center' }}>
                  <ProgressBar value={pct} label="Illustrative commitment progress" />
                  <div style={{ display: 'flex', gap: 14, color: 'var(--ar-faint)', fontSize: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <CalendarClock size={11} /> Opens {offering.opensAt}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <CalendarClock size={11} /> Closes {offering.closesAt}
                    </span>
                  </div>
                </div>

                <div className="p-callout" style={{ marginTop: 16 }}>
                  <ShieldCheck size={13} />
                  <span>{offering.escrowNote} Demo only: no value enters escrow.</span>
                </div>
              </section>
            );
          })}
        </div>

        <div className="p-callout">
          <ShieldCheck size={13} />
          <span>
            A production issuer must not publish an offering until evidence, legal documents,
            compliance approval and technical review are complete. {getDemoAssetById('ast_eng_001')?.registryId} is
            synthetic.
          </span>
        </div>
      </div>
    </PortalFrame>
  );
}
