'use client';

import { useState } from 'react';
import { useFreighterWallet } from '@aerospace/wallet';
import { BASE_FEE, Contract, TransactionBuilder, rpc, nativeToScVal } from '@stellar/stellar-sdk';

const CONTRACT = 'CDYMYLHDKA7MDDOTA4N27FLF6W4O4WVFHPBGFSY4Y7QXPB5Q36CWOHFY';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const PASSPHRASE = 'Test SDF Network ; September 2015';

export default function WithdrawalsPage() {
  const wallet = useFreighterWallet('TESTNET');
  const [amount, setAmount] = useState('100');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function invoke(method: string, args: unknown[]) {
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
      const contract = new Contract(CONTRACT);
      const scArgs = args.map((a) => {
        if (typeof a === 'string' && a.startsWith('G')) {
          return nativeToScVal(a, { type: 'address' });
        }
        return nativeToScVal(a);
      });
      const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: PASSPHRASE })
        .addOperation(contract.call(method, ...scArgs))
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
      setError(err instanceof Error ? err.message : 'Unable to invoke.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
      <h1>Withdrawals Contract</h1>
      <p style={{ color: '#cbd5e1', marginTop: '1rem' }}>
        Interact with the withdrawals contract on Stellar Testnet.
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

      <div
        style={{
          marginTop: '2rem',
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)',
            color: '#e6edf7',
          }}
        />
        <button
          type="button"
          onClick={() => void invoke('depositar', [wallet.state.address!, Number(amount)])}
          disabled={loading}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: '#6366f1',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Depositar
        </button>
        <button
          type="button"
          onClick={() => void invoke('retirar', [wallet.state.address!])}
          disabled={loading}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: '#ec4899',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Retirar
        </button>
      </div>

      {error && <p style={{ color: 'crimson', marginTop: '1rem' }}>{error}</p>}
      {result && (
        <p style={{ marginTop: '1rem' }}>
          Tx: <a href={`https://stellar.expert/explorer/testnet/tx/${result}`}>{result}</a>
        </p>
      )}
    </main>
  );
}
