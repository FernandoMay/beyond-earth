'use client';

import { useEffect, useState } from 'react';
import { PortalFrame } from '@/components/portal-frame';
import { createBrowserApi } from '@aerospace/api-client';

export default function OperationsOverview() {
  const [tasks, setTasks] = useState<{ id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const api = createBrowserApi();
        const result = await api.getOperationsTasks();
        if (!active) return;
        setTasks(result.map((t) => ({ id: t.id })));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load tasks.');
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
    <PortalFrame title="Operations Overview" subtitle="Live tasks from API.">
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!loading && !error && tasks.length === 0 && <p>No tasks.</p>}
      {!loading && !error && tasks.length > 0 && (
        <ul>
          {tasks.map((t) => (
            <li key={t.id}>{t.id}</li>
          ))}
        </ul>
      )}
    </PortalFrame>
  );
}
