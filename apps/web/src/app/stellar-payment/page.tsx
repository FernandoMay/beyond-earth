'use client';

import { useState } from 'react';
import { useFreighterWallet } from '@aerospace/wallet';
import {
  Asset,
  BASE_FEE,
  Contract,
  Memo,
  Operation,
  TransactionBuilder,
  rpc,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const ASSET_REGISTRY = 'CDMDH2NKJJMWNNFE7J3RFHW4JT4MWED7YE5JNHLP5RKXEUCOSF6EL3CB';

export default function StellarPaymentPage() {
  const wallet = useFreighterWallet('TESTNET');

  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('1');
  const [memo, setMemo] = useState('SHIP-S97KF8');
  const [paymentResult, setPaymentResult] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [contractResult, setContractResult] = useState<string | null>(null);
  const [contractError, setContractError] = useState<string | null>(null);
  const [contractLoading, setContractLoading] = useState(false);

  const [invokeResult, setInvokeResult] = useState<string | null>(null);
  const [invokeError, setInvokeError] = useState<string | null>(null);
  const [invokeLoading, setInvokeLoading] = useState(false);

  async function sendPayment() {
    if (!wallet.state.address) {
      await wallet.connect();
      return;
    }
    setPaymentLoading(true);
    setPaymentError(null);
    setPaymentResult(null);
    try {
      const server = new rpc.Server(RPC_URL);
      const account = await server.getAccount(wallet.state.address);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.payment({
            destination,
            asset: Asset.native(),
            amount,
          }),
        )
        .addMemo(Memo.text(memo))
        .setTimeout(60)
        .build();
      const prepared = await server.prepareTransaction(tx);
      const signedXdr = await wallet.signXdr(prepared.toXDR());
      const { TransactionBuilder: TB } = await import('@stellar/stellar-sdk');
      const signedTx = TB.fromXDR(signedXdr, NETWORK_PASSPHRASE);
      const submitted = await server.sendTransaction(signedTx);
      if (submitted.status === 'ERROR') {
        throw new Error('Transaction failed');
      }
      let result = await server.getTransaction(submitted.hash);
      const deadline = Date.now() + 30000;
      while (result.status === 'NOT_FOUND' && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1000));
        result = await server.getTransaction(submitted.hash);
      }
      if (result.status !== 'SUCCESS') throw new Error(`Status: ${result.status}`);
      setPaymentResult(submitted.hash);
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
      const server = new rpc.Server(RPC_URL);
      const source =
        wallet.state.address ?? 'GBXM3X7CKJNCIOXQAJ5Y6MN3EWVEOPEIEI6AWOUNZWL5BHLDL625N6US';
      const account = await server.getAccount(source);
      const contract = new Contract(ASSET_REGISTRY);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call('asset_count'))
        .setTimeout(30)
        .build();
      const sim = await server.simulateTransaction(tx);
      if ('error' in sim && sim.error) throw new Error(String(sim.error));
      const retval = 'result' in sim ? sim.result?.retval : undefined;
      setContractResult(retval ? String(scValToNative(retval as never)) : 'null');
    } catch (err) {
      setContractError(err instanceof Error ? err.message : 'Unable to read contract.');
    } finally {
      setContractLoading(false);
    }
  }

  async function authorizeIssuer() {
    if (!wallet.state.address) {
      await wallet.connect();
      return;
    }
    setInvokeLoading(true);
    setInvokeError(null);
    setInvokeResult(null);
    try {
      const server = new rpc.Server(RPC_URL);
      const account = await server.getAccount(wallet.state.address);
      const contract = new Contract(ASSET_REGISTRY);
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          contract.call(
            'authorize_issuer',
            ...[
              nativeToScVal(wallet.state.address, { type: 'address' }),
              nativeToScVal('GAXVYEE6OLC4NFB3HGJ6X464XUEOZK2IT3C6CHB3MI5NJQ2V3RIL7G6U', {
                type: 'address',
              }),
            ],
          ),
        )
        .setTimeout(60)
        .build();
      const prepared = await server.prepareTransaction(tx);
      const signedXdr = await wallet.signXdr(prepared.toXDR());
      const { TransactionBuilder: TB } = await import('@stellar/stellar-sdk');
      const signedTx = TB.fromXDR(signedXdr, NETWORK_PASSPHRASE);
      const submitted = await server.sendTransaction(signedTx);
      if (submitted.status === 'ERROR') throw new Error('Transaction failed');
      let result = await server.getTransaction(submitted.hash);
      const deadline = Date.now() + 30000;
      while (result.status === 'NOT_FOUND' && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 1000));
        result = await server.getTransaction(submitted.hash);
      }
      if (result.status !== 'SUCCESS') throw new Error(`Status: ${result.status}`);
      setInvokeResult(submitted.hash);
    } catch (err) {
      setInvokeError(err instanceof Error ? err.message : 'Unable to invoke contract.');
    } finally {
      setInvokeLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 840, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1>Stellar Testnet Console</h1>
      <p>Wallet-first operations. Connect Freighter to sign transactions.</p>

      {wallet.state.status !== 'connected' && (
        <button
          type="button"
          onClick={() => void wallet.connect()}
          style={{
            marginTop: '1rem',
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg,#6366f1,#ec4899)',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {wallet.state.status === 'connecting' ? 'Connecting…' : 'Connect Freighter'}
        </button>
      )}
      {wallet.state.status === 'connected' && (
        <p style={{ marginTop: '1rem', color: '#22d3ee' }}>Connected: {wallet.state.address}</p>
      )}

      <section style={{ marginTop: '2rem' }}>
        <h2>Testnet payment</h2>
        <label style={{ display: 'block', marginTop: '1rem' }}>
          Destination
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            style={{ width: '100%', marginTop: '0.5rem' }}
            placeholder="G..."
          />
        </label>
        <label style={{ display: 'block', marginTop: '1rem' }}>
          Amount (XLM)
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: '100%', marginTop: '0.5rem' }}
          />
        </label>
        <label style={{ display: 'block', marginTop: '1rem' }}>
          Memo
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            style={{ width: '100%', marginTop: '0.5rem' }}
          />
        </label>
        <button
          type="button"
          onClick={() => void sendPayment()}
          disabled={paymentLoading || !destination}
          style={{
            marginTop: '1.5rem',
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: '#6366f1',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {paymentLoading ? 'Sending…' : 'Send payment'}
        </button>
        {paymentError && <p style={{ color: 'crimson', marginTop: '1rem' }}>{paymentError}</p>}
        {paymentResult && (
          <p style={{ marginTop: '1rem' }}>
            Tx:{' '}
            <a href={`https://stellar.expert/explorer/testnet/tx/${paymentResult}`}>
              {paymentResult}
            </a>
          </p>
        )}
      </section>

      <section style={{ marginTop: '2.5rem' }}>
        <h2>Soroban asset registry</h2>
        <p>Contract: {ASSET_REGISTRY}</p>
        <div style={{ display: 'flex', gap: 12, marginTop: '1rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => void readContract()}
            disabled={contractLoading}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: '#334155',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {contractLoading ? 'Reading…' : 'Read asset count'}
          </button>
          <button
            type="button"
            onClick={() => void authorizeIssuer()}
            disabled={invokeLoading}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: 'none',
              background: '#ec4899',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {invokeLoading ? 'Invoking…' : 'Authorize issuer (admin)'}
          </button>
        </div>
        {contractError && <p style={{ color: 'crimson', marginTop: '1rem' }}>{contractError}</p>}
        {contractResult && <p style={{ marginTop: '1rem' }}>Asset count: {contractResult}</p>}
        {invokeError && <p style={{ color: 'crimson', marginTop: '1rem' }}>{invokeError}</p>}
        {invokeResult && (
          <p style={{ marginTop: '1rem' }}>
            Tx:{' '}
            <a href={`https://stellar.expert/explorer/testnet/tx/${invokeResult}`}>
              {invokeResult}
            </a>
          </p>
        )}
      </section>
    </main>
  );
}
