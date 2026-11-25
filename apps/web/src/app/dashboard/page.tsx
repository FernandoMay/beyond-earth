'use client';

import { useEffect, useState } from 'react';
import { useFreighterWallet } from '@aerospace/wallet';

const ASSET_REGISTRY = 'CDMDH2NKJJMWNNFE7J3RFHW4JT4MWED7YE5JNHLP5RKXEUCOSF6EL3CB';

export default function DashboardPage() {
  const wallet = useFreighterWallet('TESTNET');
  const [token, setToken] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [assetCount, setAssetCount] = useState<number | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

  useEffect(() => {
    if (wallet.state.status !== 'connected' || !wallet.state.address) return;
    let active = true;
    async function authenticate() {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const challengeRes = await fetch(`${baseUrl}/v1/auth/challenge`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ wallet: wallet.state.address }),
        });
        const challenge = await challengeRes.json();
        if (!challengeRes.ok) throw new Error(challenge.error ?? 'Challenge failed');
        const signature = await wallet.signMessage(challenge.message);
        const verifyRes = await fetch(`${baseUrl}/v1/auth/verify`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            wallet: wallet.state.address,
            message: challenge.message,
            signature,
          }),
        });
        const verified = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(verified.error ?? 'Verification failed');
        if (!active) return;
        setToken(verified.token);
        // fetch session
        const meRes = await fetch(`${baseUrl}/v1/auth/me`, {
          headers: { authorization: `Bearer ${verified.token}` },
        });
        const me = await meRes.json();
        if (meRes.ok && active) setRoles(me.roles ?? []);
      } catch (err) {
        if (active) setAuthError(err instanceof Error ? err.message : 'Auth failed');
      } finally {
        if (active) setAuthLoading(false);
      }
    }
    void authenticate();
    return () => {
      active = false;
    };
  }, [wallet.state.address, wallet.state.status, baseUrl, wallet]);

  useEffect(() => {
    if (wallet.state.status !== 'connected' || !wallet.state.address) return;
    let active = true;
    async function load() {
      try {
        const accRes = await fetch(`${baseUrl}/v1/stellar/accounts/${wallet.state.address}`);
        const countRes = await fetch(`${baseUrl}/v1/stellar/soroban/${ASSET_REGISTRY}/asset_count`);
        const accBody = await accRes.json();
        const countBody = await countRes.json();
        if (!active) return;
        const native = (accBody.balances ?? []).find((b: { asset: string }) => b.asset === 'XLM');
        setBalance(native ? native.balance : '0');
        setAssetCount(typeof countBody.result === 'number' ? countBody.result : null);
      } catch {
        // ignore
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [wallet.state.address, wallet.state.status, baseUrl]);

  if (wallet.state.status !== 'connected') {
    return (
      <main
        style={{ maxWidth: 720, margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}
      >
        <h1>Dashboard</h1>
        <p style={{ marginTop: '1rem', color: '#cbd5e1' }}>
          Connect your Freighter wallet on Stellar Testnet.
        </p>
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
          {wallet.state.status === 'connecting' ? 'Connecting…' : 'Connect Wallet'}
        </button>
        {wallet.state.error && (
          <p style={{ color: 'crimson', marginTop: '1rem' }}>{wallet.state.error}</p>
        )}
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1>Dashboard</h1>
      <p style={{ color: '#cbd5e1', marginTop: '0.5rem' }}>Connected: {wallet.state.address}</p>
      {authLoading && <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Authenticating…</p>}
      {authError && <p style={{ color: 'crimson', marginTop: '0.5rem' }}>{authError}</p>}
      {token && (
        <p style={{ color: '#22d3ee', marginTop: '0.5rem' }}>
          Session active · roles: {roles.join(', ') || 'investor'}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginTop: '2rem',
        }}
      >
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8' }}>
            XLM Balance
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{balance ?? '…'}</div>
        </div>
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8' }}>
            Registered Assets
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{assetCount ?? '…'}</div>
        </div>
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ fontSize: 12, textTransform: 'uppercase', color: '#94a3b8' }}>Network</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>Testnet</div>
        </div>
      </div>

      <div style={{ marginTop: '2.5rem', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <a
          href="/stellar-payment"
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            background: 'linear-gradient(135deg,#6366f1,#ec4899)',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Testnet Console
        </a>
        <button
          type="button"
          onClick={() => wallet.disconnect()}
          style={{
            padding: '12px 20px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(255,255,255,0.06)',
            color: '#e6edf7',
            cursor: 'pointer',
          }}
        >
          Disconnect
        </button>
      </div>
    </main>
  );
}
