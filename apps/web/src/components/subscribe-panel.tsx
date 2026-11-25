'use client';

import { useState } from 'react';
import { CheckCircle2, Info, ShieldCheck } from 'lucide-react';
import { Badge, ProgressBar } from '@aerospace/design-system';
import { createBrowserApi } from '@aerospace/api-client';
import { formatMoney, type Asset } from '@aerospace/shared-types';
import { WalletButton } from '@aerospace/wallet';

export function SubscribePanel({ asset }: { asset: Asset }) {
  const offering = asset.offering;
  const api = createBrowserApi();
  const [amount, setAmount] = useState(offering?.minTicket.amount ?? 25_000);
  const [acknowledged, setAcknowledged] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!offering) {
    return (
      <aside className="w-asset-side">
        <div className="w-asset-side__head">
          <span className="ar-mono">SUBSCRIPTION</span>
          <Badge tone="amber">Not open</Badge>
        </div>
        <p className="w-asset-side__closed">
          This structure has no open offering. It cannot be subscribed to or tokenized in its
          current state.
        </p>
        <div className="ar-alert ar-alert--amber">
          <Info size={14} />
          <span>Evidence and legal gates must be completed before an offering can open.</span>
        </div>
      </aside>
    );
  }

  const pct = (offering.committed.amount / offering.targetRaise.amount) * 100;
  const units = Math.floor(amount / asset.tokenization.unitPrice.amount);
  const isOpen = offering.status === 'open' || offering.status === 'closing_soon';

  async function submit() {
    setError(null);
    setResult(null);
    if (!acknowledged) {
      setError('Acknowledge the illustrative nature of this flow before continuing.');
      return;
    }
    if (amount < offering!.minTicket.amount) {
      setError(`Minimum ticket is ${formatMoney(offering!.minTicket)}.`);
      return;
    }
    setPending(true);
    try {
      const response = await api.subscribe({
        offeringId: offering!.id,
        wallet: 'DEMO-WALLET-01',
        amount: { amount, currency: 'USDC' },
        acknowledgement: true,
        idempotencyKey: `demo-${Date.now()}`,
      });
      setResult(
        response.mode === 'demo'
          ? response.message
          : `Subscription ${response.subscriptionId} created with status ${response.status}.`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to submit the request.');
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="w-asset-side">
      <div className="w-asset-side__head">
        <div>
          <span className="ar-mono">REFERENCE OFFERING</span>
          <strong>{offering.status.replace('_', ' ')}</strong>
        </div>
        <Badge tone={offering.status === 'closing_soon' ? 'amber' : 'blue'} dot>
          {offering.status === 'closing_soon' ? 'Closing soon' : 'Open'}
        </Badge>
      </div>

      <div className="w-asset-side__raise">
        <span>Demo commitments</span>
        <strong>{formatMoney(offering.committed, true)}</strong>
        <small>of {formatMoney(offering.targetRaise, true)} target</small>
      </div>
      <ProgressBar value={pct} label={`${offering.investorCount} demo investors`} />

      <dl className="w-asset-side__terms">
        <div>
          <dt>Unit price</dt>
          <dd>{formatMoney(asset.tokenization.unitPrice)}</dd>
        </div>
        <div>
          <dt>Minimum ticket</dt>
          <dd>{formatMoney(offering.minTicket)}</dd>
        </div>
        <div>
          <dt>Distribution</dt>
          <dd>{offering.distributionFrequency}</dd>
        </div>
        <div>
          <dt>Closes</dt>
          <dd className="ar-mono">{offering.closesAt}</dd>
        </div>
      </dl>

      <div className="w-asset-side__form">
        <label className="ar-label" htmlFor="subscription-amount">
          Illustrative subscription
          <span>USDC · no funds will move</span>
        </label>
        <div className="w-asset-side__amount">
          <input
            id="subscription-amount"
            type="number"
            min={offering.minTicket.amount}
            step={1000}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            disabled={!isOpen}
          />
          <span>USDC</span>
        </div>
        <div className="w-asset-side__units">
          <span>Units at reference price</span>
          <b className="ar-mono">{units.toLocaleString('en-US')}</b>
        </div>
        <label className="ar-checkbox">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />
          <span>
            I understand this is a demonstration. There is no offer of securities, no real asset and
            no signed transaction.
          </span>
        </label>
        <button
          type="button"
          className="ar-button ar-button--primary ar-button--md w-asset-side__submit"
          onClick={() => void submit()}
          disabled={!isOpen || pending || (api.mode === 'demo' && !acknowledged)}
        >
          {pending ? 'Checking…' : 'Check eligibility & continue'}
        </button>
        <div className="w-asset-side__wallet">
          <WalletButton />
          <span>Wallet required for a live Testnet flow</span>
        </div>
      </div>

      {result && (
        <div className="ar-alert ar-alert--amber" role="status">
          <Info size={14} />
          <span>{result}</span>
        </div>
      )}
      {error && (
        <div className="ar-alert ar-alert--red" role="alert">
          <Info size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className="w-asset-side__trust">
        <span>
          <ShieldCheck size={13} /> Escrow-gated settlement
        </span>
        <span>
          <CheckCircle2 size={13} /> Compliance enforced on transfer
        </span>
      </div>
      <p className="w-asset-side__disclaimer">
        {offering.escrowNote} Eligibility: {offering.eligibility}. This panel is a product
        demonstration, not a subscription agreement.
      </p>
    </aside>
  );
}
