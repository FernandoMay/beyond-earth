'use client';

import { useEffect, useState } from 'react';
import { PortalFrame } from '@/components/portal-frame';
import { createBrowserApi } from '@aerospace/api-client';

export default function AdminOverview() {
  const [cases, setCases] = useState<{ id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const api = createBrowserApi();
        const result = await api.getComplianceCases();
        if (!active) return;
        setCases(result.map((c) => ({ id: c.id })));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load cases.');
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
    <PortalFrame title="Admin Overview" subtitle="Live compliance cases from API.">
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!loading && !error && cases.length === 0 && <p>No compliance cases.</p>}
      {!loading && !error && cases.length > 0 && (
        <ul>
          {cases.map((c) => (
            <li key={c.id}>{c.id}</li>
          ))}
        </ul>
      )}
    </PortalFrame>
  );
}
