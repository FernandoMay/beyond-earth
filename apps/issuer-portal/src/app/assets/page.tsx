import type { Metadata } from 'next';
import { ArrowUpRight, FileText, Search } from 'lucide-react';
import { Badge, ButtonLink, ProgressBar } from '@aerospace/design-system';
import { demoSnapshot, formatMoney } from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Asset pipeline' };

const tone = (status: string) => {
  if (status === 'active' || status === 'verified') return 'green' as const;
  if (status === 'evidence_review') return 'amber' as const;
  if (status === 'suspended') return 'red' as const;
  return 'blue' as const;
};

export default function IssuerAssetsPage() {
  const assets = demoSnapshot.assets;

  return (
    <PortalFrame
      title="Asset pipeline"
      subtitle="Every structure in the demo registry, with its evidence and offering state."
      actions={
        <ButtonLink href="/assets/new" size="sm">
          New structure <ArrowUpRight size={12} />
        </ButtonLink>
      }
    >
      <div className="p-page">
        <div className="p-banner">
          <FileText size={16} />
          <div>
            <strong>Evidence is the gate.</strong>
            <p>
              An asset cannot move to verified or tokenized state without a complete evidence
              package. Missing documents keep the structure in review.
            </p>
          </div>
        </div>

        <div className="p-toolbar">
          <div className="p-search">
            <Search size={13} />
            <input
              placeholder="Search structures, registry IDs or tokens"
              aria-label="Search pipeline"
            />
          </div>
          <Badge tone="silver">{assets.length} registry records</Badge>
          <Badge tone="amber">
            {assets.filter((asset) => asset.status === 'evidence_review').length} in review
          </Badge>
        </div>

        <div className="s-asset-list">
          {assets.map((asset) => (
            <article className="s-asset" key={asset.id}>
              <div>
                <div className="s-asset__top">
                  <Badge tone={tone(asset.status)} dot>
                    {asset.status.replace('_', ' ')}
                  </Badge>
                  <Badge tone="silver">{asset.vertical}</Badge>
                  <Badge tone="amber">Illustrative</Badge>
                  <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 7 }}>
                    {asset.registryId}
                  </span>
                </div>
                <h3>{asset.name}</h3>
                <p>{asset.summary}</p>
                <div className="s-asset__meta">
                  <span>{asset.category.replace('-', ' ')}</span>
                  <span>{asset.operator}</span>
                  <span>{asset.jurisdiction}</span>
                  <span>{asset.tokenization.tokenSymbol}</span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 14,
                    marginTop: 15,
                  }}
                >
                  <ProgressBar
                    value={asset.evidenceCompleteness}
                    label="Evidence"
                    tone={asset.evidenceCompleteness >= 90 ? 'green' : 'amber'}
                  />
                  <ProgressBar
                    value={
                      asset.offering
                        ? (asset.offering.committed.amount / asset.offering.targetRaise.amount) *
                          100
                        : 0
                    }
                    label="Offering commitments"
                    tone="blue"
                  />
                </div>
              </div>
              <div className="s-asset__side">
                <div>
                  <span>Reference value</span>
                  <b>{formatMoney(asset.valuation.value, true)}</b>
                </div>
                <div>
                  <span>Evidence files</span>
                  <b>{asset.documents.length}</b>
                </div>
                <div>
                  <span>Offering</span>
                  <b>{asset.offering?.status ?? 'not opened'}</b>
                </div>
                <div>
                  <span>Contract</span>
                  <b>{asset.tokenization.contractState}</b>
                </div>
                <ButtonLink
                  href={`http://localhost:3000/assets/${asset.slug}`}
                  variant="secondary"
                  size="sm"
                >
                  Review record <ArrowUpRight size={11} />
                </ButtonLink>
              </div>
            </article>
          ))}
        </div>

        <div className="p-callout">
          <FileText size={13} />
          <span>
            Registry records and documents are synthetic. The digest values link to demo files in
            the repository and are not legal, technical or airworthiness evidence.
          </span>
        </div>
      </div>
    </PortalFrame>
  );
}
