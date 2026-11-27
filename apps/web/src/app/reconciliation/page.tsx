'use client';

import { useEffect, useState } from 'react';

export default function ReconciliationPage() {
  const [data, setData] = useState<{
    databaseAssets: number;
    contractAssets: number;
    match: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`${baseUrl}/v1/reconciliation`);
        const body = await res.json();
        if (!active) return;
        if (!res.ok) throw new Error(body.error ?? 'Failed');
        setData(body);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [baseUrl]);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
      <h1>Reconciliation</h1>
      <p style={{ color: '#cbd5e1', marginTop: '1rem' }}>Database vs Soroban contract state.</p>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {data && (
        <div style={{ marginTop: '2rem', display: 'grid', gap: 12 }}>
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8' }}>
              Database Assets
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{data.databaseAssets}</div>
          </div>
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8' }}>
              Contract Assets
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{data.contractAssets}</div>
          </div>
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              background: data.match ? 'rgba(34,211,238,0.1)' : 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8' }}>Status</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>
              {data.match ? 'Matched' : 'Mismatch'}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
