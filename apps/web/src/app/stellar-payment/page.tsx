'use client';

import { useState } from 'react';

const ASSET_REGISTRY_CONTRACT_ID = 'CDMDH2NKJJMWNNFE7J3RFHW4JT4MWED7YE5JNHLP5RKXEUCOSF6EL3CB';

interface PaymentResult {
  hash: string;
  ledger?: number;
  source: string;
  destination: string;
  amount: string;
  memo: string;
  explorerUrl: string;
}

interface ContractReadResult {
  contractId: string;
  method: string;
  result: unknown;
}

interface ContractInvokeResult {
  contractId: string;
  method: string;
  hash: string;
  result: unknown;
  explorerUrl: string;
}

export default function StellarPaymentPage() {
  const [destination, setDestination] = useState(
    process.env.NEXT_PUBLIC_STELLAR_PAYMENT_DESTINATION ?? '',
  );
  const [amount, setAmount] = useState('1');
  const [memo, setMemo] = useState('SHIP-S97KF8');
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [contractResult, setContractResult] = useState<ContractReadResult | null>(null);
  const [contractError, setContractError] = useState<string | null>(null);
  const [contractLoading, setContractLoading] = useState(false);

  const [invokeResult, setInvokeResult] = useState<ContractInvokeResult | null>(null);
  const [invokeError, setInvokeError] = useState<string | null>(null);
  const [invokeLoading, setInvokeLoading] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

  async function sendPayment() {
    setPaymentLoading(true);
    setPaymentError(null);
    setPaymentResult(null);
    try {
      const response = await fetch(`${baseUrl}/v1/stellar/testnet-payment`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ destination, amount, memo }),
      });
      const body = (await response.json()) as PaymentResult & { error?: string };
      if (!response.ok) throw new Error(body.error ?? `Request failed with ${response.status}`);
      setPaymentResult(body);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Unable to send payment.');
    } finally {
      setPaymentLoading(false);
    }
  }

  async function readContract() {
    setContractLoading(true);
    setContractError(null);
    setContractResult(null);
    try {
      const response = await fetch(
        `${baseUrl}/v1/stellar/soroban/${ASSET_REGISTRY_CONTRACT_ID}/asset_count`,
      );
      const body = (await response.json()) as ContractReadResult & { error?: string };
      if (!response.ok) throw new Error(body.error ?? `Request failed with ${response.status}`);
      setContractResult(body);
    } catch (err) {
      setContractError(err instanceof Error ? err.message : 'Unable to read contract.');
    } finally {
      setContractLoading(false);
    }
  }

  async function authorizeIssuer() {
    setInvokeLoading(true);
    setInvokeError(null);
    setInvokeResult(null);
    try {
      const response = await fetch(`${baseUrl}/v1/stellar/soroban/invoke`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contractId: ASSET_REGISTRY_CONTRACT_ID,
          method: 'authorize_issuer',
          args: ['GBXM3X7CKJNCIOXQAJ5Y6MN3EWVEOPEIEI6AWOUNZWL5BHLDL625N6US', destination || 'GAXVYEE6OLC4NFB3HGJ6X464XUEOZK2IT3C6CHB3MI5NJQ2V3RIL7G6U'],
        }),
      });
      const body = (await response.json()) as ContractInvokeResult & { error?: string };
      if (!response.ok) throw new Error(body.error ?? `Request failed with ${response.status}`);
      setInvokeResult(body);
    } catch (err) {
      setInvokeError(err instanceof Error ? err.message : 'Unable to invoke contract.');
    } finally {
      setInvokeLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 840, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1>Stellar Testnet Integration</h1>
      <p>Send a native XLM payment and interact with a deployed Soroban asset registry on Stellar Testnet.</p>

      <section style={{ marginTop: '2rem' }}>
        <h2>Testnet payment</h2>
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
        <button type="button" onClick={() => void sendPayment()} disabled={paymentLoading || !destination} style={{ marginTop: '1.5rem' }}>
          {paymentLoading ? 'Sending…' : 'Send testnet payment'}
        </button>
        {paymentError ? <p style={{ color: 'crimson', marginTop: '1rem' }}>{paymentError}</p> : null}
        {paymentResult ? (
          <div style={{ marginTop: '1rem' }}>
            <p>Transaction hash: {paymentResult.hash}</p>
            <p><a href={paymentResult.explorerUrl}>View on stellar.expert</a></p>
          </div>
        ) : null}
      </section>

      <section style={{ marginTop: '2.5rem' }}>
        <h2>Soroban asset registry</h2>
        <p>Contract: {ASSET_REGISTRY_CONTRACT_ID}</p>
        <button type="button" onClick={() => void readContract()} disabled={contractLoading} style={{ marginTop: '1rem' }}>
          {contractLoading ? 'Reading…' : 'Read asset count'}
        </button>
        <button type="button" onClick={() => void authorizeIssuer()} disabled={invokeLoading} style={{ marginTop: '1rem', marginLeft: '1rem' }}>
          {invokeLoading ? 'Invoking…' : 'Authorize demo issuer'}
        </button>
        {contractError ? <p style={{ color: 'crimson', marginTop: '1rem' }}>{contractError}</p> : null}
        {contractResult ? <p style={{ marginTop: '1rem' }}>Asset count: {String(contractResult.result)}</p> : null}
        {invokeError ? <p style={{ color: 'crimson', marginTop: '1rem' }}>{invokeError}</p> : null}
        {invokeResult ? (
          <div style={{ marginTop: '1rem' }}>
            <p>Invocation hash: {invokeResult.hash}</p>
            <p><a href={invokeResult.explorerUrl}>View on stellar.expert</a></p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
