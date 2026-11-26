'use client';

import { useState } from 'react';
import { useFreighterWallet } from '@aerospace/wallet';
import { BASE_FEE, Contract, TransactionBuilder, rpc, nativeToScVal } from '@stellar/stellar-sdk';

const VAULT_CONTRACT = 'CCWRWZ5ZM42CHX3HOOWB7QAOL7EZ4EJJDNUA6NWL5S6IB7R7YVFAFUIX';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const PASSPHRASE = 'Test SDF Network ; September 2015';

export default function VaultPage() {
  const wallet = useFreighterWallet('TESTNET');
  const [code, setCode] = useState('Ship It');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    if (!wallet.state.address) {
      await wallet.connect();
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const server = new rpc.Server(RPC_URL);
      const account = await server.getAccount(wallet.state.address);
      const contract = new Contract(VAULT_CONTRACT);
      const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: PASSPHRASE })
        .addOperation(
          contract.call(
            'reclamar',
            nativeToScVal(wallet.state.address, { type: 'address' }),
            nativeToScVal(code, { type: 'string' }),
          ),
        )
        .setTimeout(60)
        .build();
      const prepared = await server.prepareTransaction(tx);
      const signedXdr = await wallet.signXdr(prepared.toXDR());
      const { TransactionBuilder: TB } = await import('@stellar/stellar-sdk');
      const signedTx = TB.fromXDR(signedXdr, PASSPHRASE);
      const submitted = await server.sendTransaction(signedTx);
      if (submitted.status === 'ERROR') throw new Error('Transaction failed');
      let r = await server.getTransaction(submitted.hash);
      const dl = Date.now() + 30000;
      while (r.status === 'NOT_FOUND' && Date.now() < dl) {
        await new Promise((x) => setTimeout(x, 1000));
        r = await server.getTransaction(submitted.hash);
      }
      if (r.status !== 'SUCCESS') throw new Error(`Status: ${r.status}`);
      setResult(submitted.hash);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to claim.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
      <h1>Bóveda Ship It</h1>
      <p style={{ color: '#cbd5e1', marginTop: '1rem' }}>
        5555 XLM bloqueados en un contrato Soroban. Conecta tu wallet de Testnet, ingresa el código
        y reclama los fondos.
      </p>

      {wallet.state.status !== 'connected' ? (
        <button
          type="button"
          onClick={() => void wallet.connect()}
          style={{
            marginTop: '2rem',
            padding: '12px 24px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg,#6366f1,#ec4899)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {wallet.state.status === 'connecting' ? 'Connecting…' : 'Connect Freighter Wallet'}
        </button>
      ) : (
        <p style={{ marginTop: '1.5rem', color: '#22d3ee' }}>Connected: {wallet.state.address}</p>
      )}

      <div style={{ marginTop: '2rem' }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)',
            color: '#e6edf7',
            width: '60%',
          }}
        />
        <button
          type="button"
          onClick={() => void claim()}
          disabled={loading || !code}
          style={{
            marginLeft: 12,
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: '#ec4899',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Claiming…' : 'Reclamar XLM'}
        </button>
      </div>

      {error && <p style={{ color: 'crimson', marginTop: '1rem' }}>{error}</p>}
      {result && (
        <p style={{ marginTop: '1rem' }}>
          Tx: <a href={`https://stellar.expert/explorer/testnet/tx/${result}`}>{result}</a>
        </p>
      )}

      <p style={{ marginTop: '2rem', color: '#64748b', fontSize: 13 }}>
        Contract: {VAULT_CONTRACT} ·{' '}
        <a
          href={`https://stellar.expert/explorer/testnet/contract/${VAULT_CONTRACT}`}
          target="_blank"
          rel="noreferrer"
        >
          View on stellar.expert
        </a>
      </p>
    </main>
  );
}
