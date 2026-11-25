'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { AssetCard, PublicPage, SectionHeading, Badge, ButtonLink } from '@aerospace/design-system';
import { VERTICALS, type Asset, type Vertical } from '@aerospace/shared-types';
import { createBrowserApi } from '@aerospace/api-client';

export default function MarketplacePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vertical, setVertical] = useState<Vertical | undefined>();
  const [q, setQ] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const api = createBrowserApi();
        const result = await api.listAssets({ limit: 100 });
        if (!active) return;
        setAssets(result.items);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load assets.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return assets.filter((asset) => {
      if (vertical && asset.vertical !== vertical) return false;
      if (
        text &&
        ![asset.name, asset.summary, asset.registryId, asset.operator, asset.tokenSymbol]
          .join(' ')
          .toLowerCase()
          .includes(text)
      ) {
        return false;
      }
      return true;
    });
  }, [assets, vertical, q]);

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
                Discover aerospace assets across aviation, space, manufacturing and drone
                infrastructure. Data is loaded from the configured API; empty states mean no records
                are available.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-section">
        <div className="ar-container">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <input
              placeholder="Search assets, registry IDs, operators"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{
                flex: 1,
                minWidth: 240,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)',
                color: '#e6edf7',
              }}
            />
            <select
              value={vertical ?? ''}
              onChange={(e) => setVertical((e.target.value as Vertical) || undefined)}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)',
                color: '#e6edf7',
              }}
            >
              <option value="">All verticals</option>
              {VERTICALS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {loading && <p style={{ color: '#cbd5e1' }}>Loading assets…</p>}
          {error && <p style={{ color: 'crimson' }}>{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p style={{ color: '#cbd5e1' }}>No assets available.</p>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 18,
            }}
          >
            {filtered.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
