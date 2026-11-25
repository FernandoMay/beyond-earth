import type { Metadata } from 'next';
import { ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react';
import {
  AssetCard,
  ButtonLink,
  PublicPage,
  SectionHeading,
  Badge,
} from '@aerospace/design-system';
import { VERTICALS, demoSnapshot, type Vertical } from '@aerospace/shared-types';

export const metadata: Metadata = {
  title: 'Marketplace',
};

type SearchParams = Promise<{ vertical?: string; q?: string; status?: string }>;

export default async function MarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const vertical = VERTICALS.some((item) => item.id === params.vertical)
    ? (params.vertical as Vertical)
    : undefined;
  const q = params.q?.trim().toLowerCase();

  const assets = demoSnapshot.assets.filter((asset) => {
    if (vertical && asset.vertical !== vertical) return false;
    if (
      q &&
      ![asset.name, asset.summary, asset.registryId, asset.operator, asset.tokenSymbol]
        .join(' ')
        .toLowerCase()
        .includes(q)
    ) {
      return false;
    }
    return true;
  });

  return (
    <PublicPage>
      <section className="w-page-hero">
        <div className="ar-container">
          <div className="w-page-hero__grid">
            <div>
              <div className="ar-eyebrow">
                <span className="ar-eyebrow__line" />
                AEROSPACE RWA MARKETPLACE
              </div>
              <h1>
                Verified structures.
                <br />
                <span className="w-silver">Eligible participation.</span>
              </h1>
              <p>
                Discover demonstration aerospace assets across aviation, space, manufacturing and
                drone infrastructure. Each record links to its evidence, legal structure and
                offering terms.
              </p>
            </div>
            <div className="w-page-hero__aside">
              <div>
                <span className="ar-mono">REGISTRY</span>
                <strong>{demoSnapshot.assets.length.toString().padStart(2, '0')}</strong>
                <small>illustrative assets</small>
              </div>
              <div>
                <span className="ar-mono">VERTICALS</span>
                <strong>05</strong>
                <small>asset classes</small>
              </div>
              <div>
                <span className="ar-mono">OPEN STRUCTURES</span>
                <strong>
                  {demoSnapshot.assets.filter((asset) => asset.offering?.status === 'open' || asset.offering?.status === 'closing_soon').length
                    .toString()
                    .padStart(2, '0')}
                </strong>
                <small>demo offerings</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-market">
        <div className="ar-container">
          <div className="w-market__bar">
            <form className="w-market__filters" action="/marketplace" method="get">
              <div className="w-market__search">
                <Search size={14} />
                <input
                  name="q"
                  defaultValue={params.q ?? ''}
                  placeholder="Search assets, registry IDs, operators"
                  aria-label="Search assets"
                />
              </div>
              {vertical && <input type="hidden" name="vertical" value={vertical} />}
              <button type="submit" className="ar-button ar-button--secondary ar-button--sm">
                Search
              </button>
            </form>
            <div className="w-market__view">
              <SlidersHorizontal size={13} />
              <span>{assets.length} structures</span>
            </div>
          </div>

          <div className="w-market__chips">
            <a href="/marketplace" className={`ar-pill ${!vertical ? 'is-active' : ''}`}>
              All assets
            </a>
            {VERTICALS.filter((item) => item.id !== 'marketplace').map((item) => (
              <a
                key={item.id}
                href={`/marketplace?vertical=${item.id}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                className={`ar-pill ${vertical === item.id ? 'is-active' : ''}`}
              >
                {item.short}
              </a>
            ))}
            <span className="w-market__filter-note">
              <Badge tone="amber" dot>
                Illustrative data
              </Badge>
            </span>
          </div>

          {assets.length > 0 ? (
            <div className="w-market__grid">
              {assets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} priority={asset.id === 'ast_eng_001'} />
              ))}
            </div>
          ) : (
            <div className="w-market__empty">
              <h2>No structures match this filter.</h2>
              <p>Try another vertical or clear the search query.</p>
              <ButtonLink href="/marketplace" variant="secondary">
                Reset filters
              </ButtonLink>
            </div>
          )}

          <div className="w-market__legend">
            <div>
              <span className="ar-mono">HOW TO READ THIS MARKET</span>
              <p>
                Cards show reference values and target distributions in illustrative terms. They are
                not offers, projections or commitments. A structure marked &quot;evidence review&quot;
                cannot be tokenized or subscribed.
              </p>
            </div>
            <div>
              <a href="/compliance" className="ar-text-link">
                Eligibility framework <ArrowUpRight size={11} />
              </a>
              <a href="/protocol#asset-models" className="ar-text-link">
                Asset models <ArrowUpRight size={11} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="w-market__secondary">
        <div className="ar-container">
          <SectionHeading
            eyebrow="SECONDARY MARKET"
            title={
              <>
                Transferability is
                <br />
                <span className="w-silver">a permission, not an assumption.</span>
              </>
            }
            description="The marketplace contract holds seller tokens in escrow before a listing goes live. A purchase settles payment and token transfer atomically. Cancellation returns the exact token quantity to the seller."
            action={
              <ButtonLink href="/protocol#marketplace" variant="secondary">
                Marketplace contract <ArrowUpRight size={14} />
              </ButtonLink>
            }
          />
          <div className="w-market__secondary-grid">
            {[
              ['01', 'Eligible seller', 'Seller authorises the listing and transfers units into escrow.'],
              ['02', 'Restricted listing', 'Compliance and jurisdiction rules remain active during the sale.'],
              ['03', 'Atomic settlement', 'Payment and token release occur in the same contract invocation.'],
              ['04', 'Cancellation path', 'Expired or cancelled listings return the held units to the seller.'],
            ].map(([index, title, text]) => (
              <div key={index}>
                <span className="ar-mono">{index}</span>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
