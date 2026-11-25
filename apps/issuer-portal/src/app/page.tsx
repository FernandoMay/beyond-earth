'use client';

import { useEffect, useState } from 'react';
import { PortalFrame } from '@/components/portal-frame';
import { createBrowserApi } from '@aerospace/api-client';

export default function IssuerOverview() {
  const [assets, setAssets] = useState<{ id: string; name: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const api = createBrowserApi();
        const result = await api.listAssets({ limit: 100 });
        if (!active) return;
        setAssets(result.items.map((a) => ({ id: a.id, name: a.name, status: a.status })));
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

  return (
    <PortalFrame title="Issuer Overview" subtitle="Live assets from configured API.">
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!loading && !error && assets.length === 0 && <p>No assets found.</p>}
      {!loading && !error && assets.length > 0 && (
        <ul>
          {assets.map((a) => (
            <li key={a.id}>
              {a.name} — {a.status}
            </li>
          ))}
        </ul>
      )}
    </PortalFrame>
  );
}
