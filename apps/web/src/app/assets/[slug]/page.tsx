import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  Info,
  Landmark,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import {
  AssetArtwork,
  Badge,
  ButtonLink,
  DemoStrip,
  ProgressBar,
  PublicPage,
  Timeline,
} from '@aerospace/design-system';
import {
  demoAssets,
  formatMoney,
  formatPercent,
  formatUnits,
  getDemoAsset,
  type Asset,
} from '@aerospace/shared-types';
import { SubscribePanel } from '@/components/subscribe-panel';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return demoAssets.map((asset) => ({ slug: asset.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const asset = getDemoAsset(slug);
  if (!asset) return { title: 'Asset not found' };
  return {
    title: asset.name,
    description: asset.summary,
  };
}

const statusTone = (status: Asset['status']) => {
  switch (status) {
    case 'active':
      return 'green' as const;
    case 'verified':
    case 'tokenized':
      return 'blue' as const;
    case 'evidence_review':
      return 'amber' as const;
    case 'suspended':
      return 'red' as const;
    default:
      return 'neutral' as const;
  }
};

export default async function AssetPage({ params }: { params: Params }) {
  const { slug } = await params;
  const asset = getDemoAsset(slug);
  if (!asset) notFound();

  const progress = asset.offering
    ? (asset.offering.committed.amount / asset.offering.targetRaise.amount) * 100
    : 0;
  const estimatedAnnualIncome =
    asset.financials.annualRent && asset.valuation.value.amount > 0
      ? (asset.financials.annualRent.amount / asset.valuation.value.amount) * 100
      : null;

  return (
    <PublicPage>
      <section className="w-asset-hero">
        <div className="ar-container">
          <div className="w-asset-hero__crumbs">
            <a href="/marketplace">
              <ArrowLeft size={12} /> Marketplace
            </a>
            <span>/</span>
            <span>{asset.vertical}</span>
            <span>/</span>
            <span className="ar-mono">{asset.registryId}</span>
          </div>

          <div className="w-asset-hero__top">
            <div>
              <div className="w-asset-hero__badges">
                <Badge tone={statusTone(asset.status)} dot>
                  {asset.status.replace('_', ' ')}
                </Badge>
                <Badge tone="amber">Illustrative asset</Badge>
                <Badge tone="silver">{asset.vertical}</Badge>
              </div>
              <h1>{asset.name}</h1>
              <p>{asset.summary}</p>
            </div>
            <div className="w-asset-hero__right">
              <span className="ar-mono">REFERENCE VALUE</span>
              <strong>{formatMoney(asset.valuation.value, true)}</strong>
              <small>{asset.valuation.method}</small>
              <span className="ar-mono">AS OF {asset.valuation.asOf}</span>
            </div>
          </div>

          <div className="w-asset-hero__visual">
            <AssetArtwork category={asset.category} label={asset.name} />
            <div className="w-asset-hero__visual-top">
              <span className="ar-mono">{asset.registryId} / TECHNICAL VIEW</span>
              <span className="ar-mono">DEMO · NO LEGAL RIGHTS</span>
            </div>
            <div className="w-asset-hero__visual-bottom">
              <span>{asset.operator}</span>
              <span>{asset.jurisdiction}</span>
            </div>
          </div>

          <div className="w-asset-hero__meta">
            <div>
              <span className="ar-mono">TOKEN</span>
              <strong>{asset.tokenization.tokenSymbol}</strong>
            </div>
            <div>
              <span className="ar-mono">TOTAL UNITS</span>
              <strong>{formatUnits(asset.tokenization.totalUnits)}</strong>
            </div>
            <div>
              <span className="ar-mono">UNIT PRICE</span>
              <strong>{formatMoney(asset.tokenization.unitPrice)}</strong>
            </div>
            <div>
              <span className="ar-mono">EVIDENCE</span>
              <strong>{asset.evidenceCompleteness}% complete</strong>
            </div>
            <div>
              <span className="ar-mono">LAST VERIFIED</span>
              <strong>{asset.lastVerifiedAt.slice(0, 10)}</strong>
            </div>
            <div>
              <span className="ar-mono">CONTRACT STATE</span>
              <strong>{asset.tokenization.contractState.replace('_', ' ')}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="ar-container w-asset-layout">
        <div className="w-asset-main">
          <section className="w-asset-section">
            <div className="w-asset-section__label">
              <span className="ar-mono">01 / ASSET</span>
              <h2>Structure overview</h2>
            </div>
            <div className="w-asset-overview">
              <p className="w-asset-description">{asset.description}</p>
              <ul className="w-asset-highlights">
                {asset.highlights.map((highlight) => (
                  <li key={highlight}>
                    <CheckCircle2 size={14} />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
            <dl className="w-asset-specs">
              {asset.specifications.map((spec) => (
                <div key={spec.label}>
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="w-asset-section">
            <div className="w-asset-section__label">
              <span className="ar-mono">02 / ECONOMICS</span>
              <h2>Reference economics</h2>
            </div>
            <div className="w-asset-economics">
              <div className="w-asset-econ-card">
                <span>Reference valuation</span>
                <strong>{formatMoney(asset.valuation.value, true)}</strong>
                <small>{asset.valuation.provider}</small>
              </div>
              <div className="w-asset-econ-card">
                <span>Annual reference rent</span>
                <strong>
                  {formatMoney(asset.financials.annualRent ?? { amount: 0, currency: 'USD' }, true)}
                </strong>
                <small>
                  {estimatedAnnualIncome
                    ? `${estimatedAnnualIncome.toFixed(1)}% gross reference yield`
                    : '—'}
                </small>
              </div>
              <div className="w-asset-econ-card">
                <span>Target distribution</span>
                <strong>
                  {asset.financials.targetDistribution
                    ? `${formatPercent(asset.financials.targetDistribution.min)}–${formatPercent(
                        asset.financials.targetDistribution.max,
                      )}`
                    : '—'}
                </strong>
                <small>{asset.financials.distributionFrequency ?? '—'} · illustrative</small>
              </div>
              <div className="w-asset-econ-card">
                <span>Reference LTV</span>
                <strong>{asset.financials.ltvPct ? `${asset.financials.ltvPct}%` : '—'}</strong>
                <small>{asset.financials.reserveMonths ?? 0}-month reserve</small>
              </div>
            </div>
            {asset.offering && (
              <div className="w-asset-offering">
                <div className="w-asset-offering__head">
                  <div>
                    <span className="ar-mono">REFERENCE OFFERING / {asset.offering.id}</span>
                    <h3>Illustrative subscription terms</h3>
                  </div>
                  <Badge tone={asset.offering.status === 'closing_soon' ? 'amber' : 'blue'} dot>
                    {asset.offering.status.replace('_', ' ')}
                  </Badge>
                </div>
                <dl className="w-asset-offering__grid">
                  <div>
                    <dt>Target raise</dt>
                    <dd>{formatMoney(asset.offering.targetRaise)}</dd>
                  </div>
                  <div>
                    <dt>Committed (demo)</dt>
                    <dd>{formatMoney(asset.offering.committed)}</dd>
                  </div>
                  <div>
                    <dt>Minimum ticket</dt>
                    <dd>{formatMoney(asset.offering.minTicket)}</dd>
                  </div>
                  <div>
                    <dt>Window</dt>
                    <dd className="ar-mono">
                      {asset.offering.opensAt} → {asset.offering.closesAt}
                    </dd>
                  </div>
                </dl>
                <ProgressBar value={progress} label="Illustrative commitment progress" />
                <p className="w-asset-offering__note">
                  No subscription is accepted in this demonstration. The offering panel is a
                  product-state reference, not an offer or solicitation.
                </p>
              </div>
            )}
          </section>

          <section className="w-asset-section">
            <div className="w-asset-section__label">
              <span className="ar-mono">03 / LEGAL BOUNDARY</span>
              <h2>Token rights and restrictions</h2>
            </div>
            <div className="w-asset-structure">
              <div className="w-asset-structure__card">
                <Landmark size={18} />
                <span className="ar-mono">STRUCTURE</span>
                <p>{asset.tokenization.structure}</p>
              </div>
              <div className="w-asset-structure__card">
                <Fingerprint size={18} />
                <span className="ar-mono">DEFINED RIGHTS</span>
                <ul>
                  {asset.tokenization.tokenRights.map((right) => (
                    <li key={right}>{right}</li>
                  ))}
                </ul>
              </div>
              <div className="w-asset-structure__card">
                <LockKeyhole size={18} />
                <span className="ar-mono">TRANSFER CONTROLS</span>
                <ul>
                  {asset.tokenization.transferRestrictions.map((restriction) => (
                    <li key={restriction}>{restriction}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="ar-alert ar-alert--amber">
              <Info size={14} />
              <span>
                <strong>Legal notice.</strong> The token does not automatically represent title to
                the underlying asset. Rights depend on the issuer documents, the special-purpose
                vehicle and applicable law. This reference structure is synthetic.
              </span>
            </div>
          </section>

          <section className="w-asset-section">
            <div className="w-asset-section__label">
              <span className="ar-mono">04 / EVIDENCE</span>
              <h2>Document register</h2>
            </div>
            <div className="w-asset-docs">
              {asset.documents.map((document) => (
                <article key={document.id} className="w-asset-doc">
                  <div className="w-asset-doc__icon">
                    <FileCheck2 size={18} />
                  </div>
                  <div className="w-asset-doc__body">
                    <div className="w-asset-doc__top">
                      <strong>{document.name}</strong>
                      <Badge tone={document.verified ? 'green' : 'amber'} dot>
                        {document.verified ? 'Digest matched' : 'Under review'}
                      </Badge>
                    </div>
                    <div className="w-asset-doc__meta">
                      <span>{document.kind}</span>
                      <span>{document.version}</span>
                      <span>{document.addedAt}</span>
                    </div>
                    <code>sha256:{document.digest}</code>
                  </div>
                </article>
              ))}
            </div>
            <p className="w-asset-docs__note">
              Digests correspond to synthetic evidence files in this repository. They demonstrate
              integrity linkage only; they are not production legal or technical evidence.
            </p>
          </section>

          <section className="w-asset-section">
            <div className="w-asset-section__label">
              <span className="ar-mono">05 / RISK</span>
              <h2>Risk register</h2>
            </div>
            <div className="w-asset-risks">
              {asset.risks.map((risk) => (
                <article key={risk.id} className="w-risk-card">
                  <div className="w-risk-card__top">
                    <span className="ar-mono">{risk.category}</span>
                    <Badge
                      tone={
                        risk.severity === 'high'
                          ? 'red'
                          : risk.severity === 'medium'
                            ? 'amber'
                            : 'green'
                      }
                    >
                      {risk.severity}
                    </Badge>
                  </div>
                  <h3>{risk.title}</h3>
                  <p>{risk.summary}</p>
                  <div className="w-risk-card__mitigation">
                    <ShieldCheck size={13} />
                    <span>{risk.mitigation}</span>
                  </div>
                </article>
              ))}
            </div>
            <div className="ar-alert ar-alert--red">
              <TriangleAlert size={14} />
              <span>
                Risk factors are illustrative summaries, not exhaustive. A production offering
                requires a complete risk disclosure reviewed by counsel.
              </span>
            </div>
          </section>

          <section className="w-asset-section">
            <div className="w-asset-section__label">
              <span className="ar-mono">06 / LIFECYCLE</span>
              <h2>Asset timeline</h2>
            </div>
            <Timeline milestones={asset.milestones} />
          </section>
        </div>

        <div className="w-asset-rail">
          <SubscribePanel asset={asset} />

          <div className="w-asset-facts">
            <div className="w-asset-facts__head">
              <span className="ar-mono">REGISTRY FACTS</span>
              <span className="ar-status-dot ar-status-dot--pending" />
            </div>
            <dl>
              <div>
                <dt>Registry ID</dt>
                <dd className="ar-mono">{asset.registryId}</dd>
              </div>
              <div>
                <dt>Vertical</dt>
                <dd>{asset.vertical}</dd>
              </div>
              <div>
                <dt>Jurisdiction</dt>
                <dd>{asset.jurisdiction}</dd>
              </div>
              <div>
                <dt>Owner entity</dt>
                <dd>{asset.ownerEntity}</dd>
              </div>
              <div>
                <dt>Operator</dt>
                <dd>{asset.operator}</dd>
              </div>
              <div>
                <dt>Evidence</dt>
                <dd>{asset.evidenceCompleteness}% complete</dd>
              </div>
            </dl>
            <div className="w-asset-facts__foot">
              <span>
                <ShieldCheck size={12} /> Illustrative registry record
              </span>
              <a href="/protocol#asset-models" className="ar-text-link">
                Asset model <ArrowUpRight size={10} />
              </a>
            </div>
          </div>

          <div className="w-asset-protocol">
            <span className="ar-mono">PROTOCOL READINESS</span>
            <h3>Reference contracts</h3>
            <div>
              <span>Registry</span>
              <Badge tone="green">Tested</Badge>
            </div>
            <div>
              <span>Compliance</span>
              <Badge tone="green">Tested</Badge>
            </div>
            <div>
              <span>Regulated token</span>
              <Badge tone="green">Tested</Badge>
            </div>
            <div>
              <span>Deployment</span>
              <Badge tone="amber">Not deployed</Badge>
            </div>
            <p>
              This page shows an implementation state, not a live issuance. Contract source is in
              the repository.
            </p>
            <ButtonLink href="/protocol" variant="secondary" size="sm">
              Review protocol
            </ButtonLink>
          </div>
        </div>
      </div>
      <DemoStrip>
        <span>Asset detail · illustrative data · no offer or solicitation</span>
      </DemoStrip>
    </PublicPage>
  );
}
