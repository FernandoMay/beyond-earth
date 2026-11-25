'use client';

import { useState } from 'react';

interface PaymentResult {
  hash: string;
  ledger?: number;
  source: string;
  destination: string;
  amount: string;
  memo: string;
  explorerUrl: string;
}

export default function StellarPaymentPage() {
  const [destination, setDestination] = useState(
    process.env.NEXT_PUBLIC_STELLAR_PAYMENT_DESTINATION ?? '',
  );
  const [amount, setAmount] = useState('1');
  const [memo, setMemo] = useState('SHIP-S97KF8');
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendPayment() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
      const response = await fetch(`${baseUrl}/v1/stellar/testnet-payment`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ destination, amount, memo }),
      });
      const body = (await response.json()) as PaymentResult & { error?: string; code?: string };
      if (!response.ok) {
        throw new Error(body.error ?? `Request failed with ${response.status}`);
      }
      setResult(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send payment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1>Stellar Testnet Payment</h1>
      <p>Send a native XLM payment on Stellar Testnet with the challenge code in the memo.</p>

      <label style={{ display: 'block', marginTop: '1rem' }}>
        Destination address
        <input
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          style={{ width: '100%', marginTop: '0.5rem' }}
          placeholder="G..."
        />
      </label>

      <label style={{ display: 'block', marginTop: '1rem' }}>
        Amount (XLM)
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          style={{ width: '100%', marginTop: '0.5rem' }}
        />
      </label>

      <label style={{ display: 'block', marginTop: '1rem' }}>
        Memo
        <input
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          style={{ width: '100%', marginTop: '0.5rem' }}
        />
      </label>

      <button
        type="button"
        onClick={() => void sendPayment()}
        disabled={loading || !destination}
        style={{ marginTop: '1.5rem' }}
      >
        {loading ? 'Sending…' : 'Send testnet payment'}
      </button>

      {error ? <p style={{ color: 'crimson', marginTop: '1rem' }}>{error}</p> : null}

      {result ? (
        <section style={{ marginTop: '1.5rem' }}>
          <p>Transaction hash: {result.hash}</p>
          <p>Explorer: <a href={result.explorerUrl}>{result.explorerUrl}</a></p>
        </section>
      ) : null}
    </main>
  );
}
