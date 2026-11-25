'use client';

import { useState } from 'react';
import { Info, LockKeyhole } from 'lucide-react';
import { Badge, Button } from '@aerospace/design-system';
import type { ComplianceCase } from '@aerospace/shared-types';

export function CaseActions({ item }: { item: ComplianceCase }) {
  const [message, setMessage] = useState<string | null>(null);

  const act = (decision: string) => {
    setMessage(
      `Demo mode: "${decision}" was not submitted. No compliance record was changed, no event was emitted and no privileged API was called.`,
    );
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div className="a-case__actions">
        <Button type="button" size="sm" onClick={() => act('approve')}>
          Approve (demo)
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => act('escalate')}>
          Escalate
        </Button>
        <Button type="button" size="sm" variant="danger" onClick={() => act('reject')}>
          Reject
        </Button>
        <Badge tone="amber">
          <LockKeyhole size={10} /> No write path
        </Badge>
      </div>
      {message && (
        <div className="ar-alert ar-alert--amber" role="status">
          <Info size={13} />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
