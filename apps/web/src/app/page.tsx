'use client';

import { useFreighterWallet } from '@aerospace/wallet';
import { BASE_FEE, Contract, rpc, TransactionBuilder, scValToNative } from '@stellar/stellar-sdk';

import { useEffect, useState } from 'react';

const CONTRACTS: { name: string; id: string }[] = [
  { name: 'Asset Registry', id: 'CDMDH2NKJJMWNNFE7J3RFHW4JT4MWED7YE5JNHLP5RKXEUCOSF6EL3CB' },
  { name: 'Compliance', id: 'CD3MMDAOEJL76VEFFPRFDFNMKRUAR3PC76QG4K6IETSQCY6G4XGD4AZG' },
  { name: 'RWA Token', id: 'CBW5SJJEKKN4DKXFX5PJYCBT2LONT3CBY4DQVDRWZCKHQAS652DCM2PN' },
  { name: 'Investment', id: 'CBPU4IY4KID54S33ABE3MXJ3C5VYMMMJTLCWRE4HMWE3WJWB5QMCQ6FX' },
  { name: 'Escrow', id: 'CDHVQQMLFMTXEGQ65UA2ERFPKZ67SJJJVWBT7DL36FJB4R3G2MI6SU4F' },
  { name: 'Revenue Distribution', id: 'CBHV3L57P6MFTP4GWU5E3L6IJB4AN47XN3EYTCTURUBXQ64MJEMLCUZW' },
  { name: 'Leasing', id: 'CCDHLTJSDZXKGPWI5O2BCAMABFCAWALNE2SKBLVXJX3MBL4DS3VHMFD4' },
  { name: 'Marketplace', id: 'CDXD6G4MYLCYELYROM5ZPYTHCFPJHCOFO7WHCGSFDFK6OWYVC5NHOAOZ' },
  { name: 'Governance', id: 'CDNXLH3Q6CT6MZSKFL5VNGWYIP52FL6LA6AFXBDYTIYREZHW6CVZ7GTF' },
  { name: 'Access Control', id: 'CBSYSUEMAUKZDY5IRZVEJ3J6JG2TKSVLQQISH6ELUXKKPS2PDBOHUHGW' },
];

const ASSET_REGISTRY = 'CDMDH2NKJJMWNNFE7J3RFHW4JT4MWED7YE5JNHLP5RKXEUCOSF6EL3CB';

export default function Home() {
  const [assetCount, setAssetCount] = useState<number | null>(null);
  const [admin, setAdmin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const wallet = useFreighterWallet('TESTNET');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const server = new rpc.Server('https://soroban-testnet.stellar.org');
        const source = 'GBXM3X7CKJNCIOXQAJ5Y6MN3EWVEOPEIEI6AWOUNZWL5BHLDL625N6US';
        const account = await server.getAccount(source);
        const contract = new Contract(ASSET_REGISTRY);
        const countTx = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: 'Test SDF Network ; September 2015',
        })
          .addOperation(contract.call('asset_count'))
          .setTimeout(30)
          .build();
        const adminTx = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: 'Test SDF Network ; September 2015',
        })
          .addOperation(contract.call('admin'))
          .setTimeout(30)
          .build();
        const [countSim, adminSim] = await Promise.all([
          server.simulateTransaction(countTx),
          server.simulateTransaction(adminTx),
        ]);
        if (!active) return;
        const countVal = (countSim as { result?: { retval?: unknown } }).result?.retval;
        const adminVal = (adminSim as { result?: { retval?: unknown } }).result?.retval;
        // scValToNative
        setAssetCount(countVal ? (scValToNative(countVal as never) as number) : null);
        setAdmin(adminVal ? (scValToNative(adminVal as never) as string) : null);
      } catch {
        // ignore
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
    <div className="be-landing">
      <div className="be-landing__grid" />
      <div className="be-orb be-orb--1" />
      <div className="be-orb be-orb--2" />
      <div className="be-orb be-orb--3" />

      <section className="be-hero">
        <div className="be-badge">
          <span>●</span> Stellar Testnet · Soroban · Live
        </div>
        <h1 className="be-title">Beyond Earth</h1>
        <p className="be-sub">
          Aerospace real-world assets, tokenized and settled on Stellar. Aircraft, engines,
          satellites, manufacturing and drones — connected to on-chain identity, compliance,
          investment and revenue distribution. No mocks. Live contract data below.
        </p>
        <div className="be-actions">
          {wallet.state.status !== 'connected' ? (
            <button
              type="button"
              className="be-btn be-btn--primary"
              onClick={() => void wallet.connect()}
              disabled={wallet.state.status === 'connecting'}
            >
              {wallet.state.status === 'connecting' ? 'Connecting…' : 'Connect Freighter Wallet'}
            </button>
          ) : (
            <>
              <a className="be-btn be-btn--primary" href="/dashboard">
                Enter Dashboard
              </a>
              <span className="be-btn be-btn--ghost" style={{ cursor: 'default' }}>
                {wallet.state.address?.slice(0, 6)}…{wallet.state.address?.slice(-4)}
              </span>
            </>
          )}
          <a className="be-btn be-btn--ghost" href="/stellar-payment">
            Testnet Console
          </a>
          <a className="be-btn be-btn--ghost" href="/protocol">
            Protocol
          </a>
        </div>
      </section>

      <section className="be-stats">
        <div className="be-stat">
          <div className="be-stat__label">Contracts Deployed</div>
          <div className="be-stat__value">{CONTRACTS.length}</div>
        </div>
        <div className="be-stat">
          <div className="be-stat__label">Registered Assets</div>
          <div className="be-stat__value">{loading ? '…' : (assetCount ?? '—')}</div>
        </div>
        <div className="be-stat">
          <div className="be-stat__label">Network</div>
          <div className="be-stat__value">Testnet</div>
        </div>
        <div className="be-stat">
          <div className="be-stat__label">Registry Admin</div>
          <div className="be-stat__value" style={{ fontSize: 14 }}>
            {loading ? '…' : admin ? `${admin.slice(0, 6)}…${admin.slice(-4)}` : '—'}
          </div>
        </div>
      </section>

      <section className="be-section">
        <h2 className="be-section__title">Deployed Soroban Contracts</h2>
        <p style={{ color: '#cbd5e1', maxWidth: 720 }}>
          Every contract below is live on Stellar Testnet. Click to view on stellar.expert.
        </p>
        <div
          className="be-cards"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
        >
          {CONTRACTS.map((c) => (
            <a
              key={c.id}
              className="be-contract"
              href={`https://stellar.expert/explorer/testnet/contract/${c.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <div className="be-contract__name">{c.name}</div>
              <div className="be-contract__id">{c.id}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="be-section">
        <h2 className="be-section__title">How It Works</h2>
        <div className="be-cards">
          <div className="be-card">
            <div className="be-card__title">1. Evidence & Registry</div>
            <div className="be-card__text">
              Asset identity, operator and lifecycle are anchored on-chain in the asset registry.
            </div>
          </div>
          <div className="be-card">
            <div className="be-card__title">2. Compliance & Token</div>
            <div className="be-card__text">
              Investor eligibility and regulated token transfers are enforced by Soroban contracts.
            </div>
          </div>
          <div className="be-card">
            <div className="be-card__title">3. Investment & Settlement</div>
            <div className="be-card__text">
              Offerings, escrow, revenue distribution and leasing settle in native XLM on Testnet.
            </div>
          </div>
        </div>
      </section>

      <section className="be-section" style={{ textAlign: 'center' }}>
        <h2 className="be-section__title">Live Testnet Payment</h2>
        <p style={{ color: '#cbd5e1', maxWidth: 640, margin: '0 auto 24px' }}>
          Send a real XLM payment with the challenge code in the memo, or interact with the asset
          registry contract.
        </p>
        <div className="be-actions">
          <a className="be-btn be-btn--primary" href="/stellar-payment">
            Launch Console
          </a>
          <a
            className="be-btn be-btn--ghost"
            href="https://stellar.expert/explorer/testnet/tx/c3268c18da8888344b34c33c39bfb487f7a98dc97f66d9436d85f63b3660e4"
            target="_blank"
            rel="noreferrer"
          >
            View Payment Tx
          </a>
        </div>
      </section>

      <footer className="be-footer">
        Aerospace RWA · Stellar Testnet · All assets and returns illustrative · No offer of
        securities · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
