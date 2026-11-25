'use client';

import { useState } from 'react';
import { Info, LockKeyhole } from 'lucide-react';
import { Badge } from '@aerospace/design-system';
import { formatMoney, type Distribution } from '@aerospace/shared-types';

export function ClaimPanel({ distributions }: { distributions: Distribution[] }) {
  const claimable = distributions.filter((item) => item.status === 'available');
  const total = claimable.reduce((sum, item) => sum + item.amount.amount, 0);
  const [acknowledged, setAcknowledged] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section className="i-claim">
      <div className="p-card__head" style={{ marginBottom: 0 }}>
        <div>
          <span className="ar-mono" style={{ color: 'var(--ar-faint)', fontSize: 7, letterSpacing: '0.1em' }}>
            AVAILABLE TO CLAIM (DEMO)
          </span>
          <h3 style={{ marginTop: 6 }}>Distribution claim</h3>
        </div>
        <Badge tone="green" dot>
          {claimable.length} epoch
        </Badge>
      </div>
      <div className="i-claim__amount">
        <strong>{formatMoney({ amount: total, currency: 'USDC' })}</strong>
        <span style={{ color: 'var(--ar-faint)', fontSize: 8.5 }}>synthetic amount</span>
      </div>
      <p>
        A live claim would call <code>claim(epoch)</code> on the revenue-distribution contract and
        transfer USDC to the connected wallet. This demo has no token, no escrow balance and no
        wallet connection, so it cannot produce a transaction.
      </p>
      <label className="ar-checkbox">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(event) => {
            setAcknowledged(event.target.checked);
            setMessage(null);
          }}
        />
        <span>I understand that claiming is disabled and no funds will move.</span>
      </label>
      <button
        type="button"
        className="ar-button ar-button--secondary ar-button--md"
        disabled={!acknowledged}
        onClick={() =>
          setMessage(
            'Demo mode: the claim endpoint is intentionally unavailable. No wallet signature was requested and no transfer occurred.',
          )
        }
      >
        <LockKeyhole size={13} /> Attempt claim (blocked)
      </button>
      {message && (
        <div className="ar-alert ar-alert--amber" role="status">
          <Info size={13} />
          <span>{message}</span>
        </div>
      )}
    </section>
  );
}
