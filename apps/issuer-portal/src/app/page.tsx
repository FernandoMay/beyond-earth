'use client';

import { useFreighterWallet } from '@aerospace/wallet';

import { useEffect, useState } from 'react';
import { PortalFrame } from '@/components/portal-frame';
import { createBrowserApi } from '@aerospace/api-client';

export default function IssuerOverview() {
  const [assets, setAssets] = useState<{ id: string; name: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wallet = useFreighterWallet('TESTNET');
  const [session, setSession] = useState<string | null>(null);

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


  useEffect(() => {
    if (wallet.state.status !== 'connected' || !wallet.state.address) return;
    let active = true;
    async function auth() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
        const ch = await fetch(`${baseUrl}/v1/auth/challenge`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ wallet: wallet.state.address }) }).then((r) => r.json());
        const sig = await wallet.signMessage(ch.message);
        const v = await fetch(`${baseUrl}/v1/auth/verify`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ wallet: wallet.state.address, message: ch.message, signature: sig }) }).then((r) => r.json());
        if (active && v.token) setSession(v.token);
      } catch { /* ignore */ }
    }
    void auth();
    return () => { active = false; };
  }, [wallet.state.address, wallet.state.status, wallet]);

  return (
    <PortalFrame title="Issuer Overview" subtitle="Live assets from configured API.">
      {loading && <p>Loading…</p>}
      {session && <p style={{ color: '#22d3ee', marginTop: '0.5rem' }}>Session active</p>}
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
