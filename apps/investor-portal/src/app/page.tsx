'use client';

import { useEffect, useState } from 'react';
import { PortalFrame } from '@/components/portal-frame';
import { createBrowserApi } from '@aerospace/api-client';

export default function InvestorOverview() {
  const [investor, setInvestor] = useState<{ name?: string; wallet?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const api = createBrowserApi();
        const data = await api.getInvestor();
        if (!active) return;
        setInvestor(data as { name?: string; wallet?: string });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load investor.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <PortalFrame title="Investor Overview" subtitle="Live data from configured API.">
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!loading && !error && investor && (
        <div>
          <p><strong>Name:</strong> {investor.name ?? '—'}</p>
          <p><strong>Wallet:</strong> {investor.wallet ?? '—'}</p>
          <p style={{ marginTop: '1rem', color: '#94a3b8' }}>
            Connect a wallet and authenticate to view positions and distributions.
          </p>
        </div>
      )}
      {!loading && !error && !investor && <p>No investor record found.</p>}
    </PortalFrame>
  );
}
