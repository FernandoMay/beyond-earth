import type { Asset } from '@aerospace/shared-types';
import { formatMoney, formatPercent, formatUnits } from '@aerospace/shared-types';
import { AssetArtwork } from './asset-artwork';
import { Badge, ProgressBar } from './primitives';

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

export function AssetCard({ asset, priority = false }: { asset: Asset; priority?: boolean }) {
  const committedPct = asset.offering
    ? (asset.offering.committed.amount / asset.offering.targetRaise.amount) * 100
    : 0;

  return (
    <article className={`ar-asset-card ${priority ? 'ar-asset-card--priority' : ''}`}>
      <a href={`/assets/${asset.slug}`} className="ar-asset-card__visual" aria-label={asset.name}>
        <AssetArtwork category={asset.category} label={asset.name} />
        <span className="ar-asset-card__registry ar-mono">{asset.registryId}</span>
        <span className="ar-asset-card__status">
          <Badge tone={statusTone(asset.status)} dot>
            {asset.status.replace('_', ' ')}
          </Badge>
        </span>
      </a>
      <div className="ar-asset-card__body">
        <div className="ar-asset-card__meta">
          <span>{asset.vertical}</span>
          <span>/</span>
          <span>{asset.jurisdiction.split('·')[0]}</span>
        </div>
        <h3>
          <a href={`/assets/${asset.slug}`}>{asset.name}</a>
        </h3>
        <p>{asset.summary}</p>
        <dl className="ar-asset-card__metrics">
          <div>
            <dt>Reference value</dt>
            <dd>{formatMoney(asset.valuation.value, true)}</dd>
          </div>
          <div>
            <dt>Target distribution</dt>
            <dd>
              {asset.financials.targetDistribution
                ? `${formatPercent(asset.financials.targetDistribution.min)}–${formatPercent(
                    asset.financials.targetDistribution.max,
                  )}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt>Unit price</dt>
            <dd>{formatMoney(asset.tokenization.unitPrice)}</dd>
          </div>
          <div>
            <dt>Registry</dt>
            <dd className="ar-mono">{formatUnits(asset.tokenization.totalUnits)} units</dd>
          </div>
        </dl>
        {asset.offering ? (
          <ProgressBar
            value={committedPct}
            label={`Committed ${formatMoney(asset.offering.committed, true)} of ${formatMoney(
              asset.offering.targetRaise,
              true,
            )}`}
          />
        ) : (
          <div className="ar-asset-card__no-offering">Not open for subscription</div>
        )}
        <div className="ar-asset-card__footer">
          <span>
            {asset.evidenceCompleteness}% evidence · {asset.documents.length} documents
          </span>
          <a href={`/assets/${asset.slug}`} className="ar-text-link">
            Review structure <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </article>
  );
}
