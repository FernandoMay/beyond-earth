'use client';

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
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [countRes, adminRes] = await Promise.all([
          fetch(`${baseUrl}/v1/stellar/soroban/${ASSET_REGISTRY}/asset_count`),
          fetch(`${baseUrl}/v1/stellar/soroban/${ASSET_REGISTRY}/admin`),
        ]);
        const countBody = await countRes.json();
        const adminBody = await adminRes.json();
        if (!active) return;
        setAssetCount(typeof countBody.result === 'number' ? countBody.result : null);
        setAdmin(typeof adminBody.result === 'string' ? adminBody.result : null);
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
  }, [baseUrl]);

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
          <a className="be-btn be-btn--primary" href="/stellar-payment">
            Open Testnet Console
          </a>
          <a className="be-btn be-btn--ghost" href="/protocol">
            Explore Protocol
          </a>
          <a className="be-btn be-btn--ghost" href="/marketplace">
            Marketplace
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
        Aerospace RWA · Stellar Testnet · All assets and returns illustrative · No offer of securities · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
