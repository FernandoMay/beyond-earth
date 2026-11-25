import type { Metadata } from 'next';
import {
  ArrowUpRight,
  Boxes,
  Code2,
  Database,
  Fingerprint,
  GitBranch,
  Globe2,
  Layers3,
  LockKeyhole,
  Network,
  ServerCog,
  ShieldCheck,
  Terminal,
  Wallet,
} from 'lucide-react';
import {
  Badge,
  ButtonLink,
  PublicPage,
  SectionHeading,
  StatusDot,
} from '@aerospace/design-system';
import { demoProtocolModules, demoSnapshot } from '@aerospace/shared-types';

export const metadata: Metadata = {
  title: 'Protocol',
  description:
    'Architecture, Soroban contracts, asset models, standards and security boundary for Aerospace RWA.',
};

const assetModels = [
  {
    asset: 'Engine / aircraft lease',
    represents: 'Economic participation in lease receivables held by a bankruptcy-remote SPV',
    doesNot: 'Title to the engine or aircraft',
    controls: 'Eligible investors · jurisdiction · lock-up · compliance allowlist',
  },
  {
    asset: 'Service contract',
    represents: 'Defined rights to net service receipts, subject to service credits',
    doesNot: 'Satellite, orbital slot, spectrum or operator control',
    controls: 'Institutional eligibility · counterparty consent · transfer limits',
  },
  {
    asset: 'Equipment / tooling',
    represents: 'Participation in an equipment SPV and production-contract cash flows',
    doesNot: 'Direct equipment title or operational control',
    controls: 'Eligible investors · offering-specific restrictions',
  },
  {
    asset: 'Inventory',
    represents: 'Rights over verified units or production proceeds',
    doesNot: 'Automatic possession or title to each unit',
    controls: 'Verification · custody evidence · jurisdiction',
  },
  {
    asset: 'Drone fleet',
    represents: 'Economic participation in an operating vehicle',
    doesNot: 'Ownership of each drone, route authority or operator control',
    controls: 'Regulatory review · customer concentration · compliance',
  },
];

export default function ProtocolPage() {
  return (
    <PublicPage>
      <section className="w-page-hero">
        <div className="ar-container">
          <div className="w-page-hero__grid">
            <div>
              <div className="ar-eyebrow">
                <span className="ar-eyebrow__line" />
                AEROSPACE RWA PROTOCOL
              </div>
              <h1>
                Enforcement at the
                <br />
                <span className="w-silver">Protocol boundary.</span>
              </h1>
              <p>
                Nine Soroban modules establish asset identity, investor eligibility, controlled
                tokenization, conditional settlement, revenue claims and governance. Applications
                consume the protocol; they do not replace it.
              </p>
            </div>
            <div className="w-page-hero__aside">
              <div>
                <span className="ar-mono">LANGUAGE</span>
                <strong>Rust</strong>
                <small>Soroban SDK 30</small>
              </div>
              <div>
                <span className="ar-mono">NETWORK</span>
                <strong>Testnet</strong>
                <small>not deployed</small>
              </div>
              <div>
                <span className="ar-mono">MODULES</span>
                <strong>09</strong>
                <small>unit tested</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-content-section" id="architecture">
        <div className="ar-container">
          <SectionHeading
            eyebrow="ARCHITECTURE"
            title={
              <>
                Two layers.
                <br />
                <span className="w-silver">One source of truth.</span>
              </>
            }
            description="PostgreSQL is the operational source of truth for off-chain workflows and evidence metadata. Soroban enforces the financial state machine. The indexer reconciles events back into the operational ledger."
          />

          <div className="w-proto-arch">
            <div className="w-proto-arch__layer">
              <div className="w-proto-arch__label">
                <span className="ar-mono">APPLICATION</span>
                <h3>Portals & API</h3>
              </div>
              <div>
                <span>Investor portal</span>
                <span>Issuer portal</span>
                <span>Admin</span>
                <span>Operations</span>
                <span>Marketplace</span>
                <span>Typed API</span>
              </div>
            </div>
            <div className="w-proto-arch__connector">
              <span />
              <em className="ar-mono">AUTHENTICATED API · EVENT OUTBOX</em>
              <span />
            </div>
            <div className="w-proto-arch__layer is-services">
              <div className="w-proto-arch__label">
                <span className="ar-mono">SERVICES</span>
                <h3>Operational ledger</h3>
              </div>
              <div>
                <span>PostgreSQL</span>
                <span>Indexer</span>
                <span>Valuation engine</span>
                <span>Oracle adapters</span>
                <span>Document verification</span>
                <span>Notifications</span>
              </div>
            </div>
            <div className="w-proto-arch__connector">
              <span />
              <em className="ar-mono">SOROBAN RPC · CONTRACT EVENTS</em>
              <span />
            </div>
            <div className="w-proto-arch__layer is-protocol">
              <div className="w-proto-arch__label">
                <span className="ar-mono">ENFORCEMENT</span>
                <h3>Soroban contracts</h3>
              </div>
              <div>
                {demoProtocolModules.map((module) => (
                  <span key={module.id}>{module.name}</span>
                ))}
              </div>
            </div>
            <div className="w-proto-arch__connector">
              <span />
              <em className="ar-mono">STELLAR SETTLEMENT</em>
              <span />
            </div>
            <div className="w-proto-arch__layer is-stellar">
              <div className="w-proto-arch__label">
                <span className="ar-mono">SETTLEMENT</span>
                <h3>Stellar network</h3>
              </div>
              <div>
                <span>Stellar assets</span>
                <span>Stellar Asset Contract</span>
                <span>USDC</span>
                <span>Wallets</span>
                <span>Horizon / RPC</span>
              </div>
            </div>
          </div>

          <div className="w-proto-principles">
            {[
              [Database, 'Off-chain state is explicit', 'Documents, issuer workflows and reconciliation live in PostgreSQL with audit records.'],
              [GitBranch, 'Every chain state is derived', 'The indexer consumes Soroban events idempotently and advances a durable cursor.'],
              [LockKeyhole, 'Fail closed', 'Missing compliance, expired verification, paused contracts or unreleased escrow block movement.'],
              [Fingerprint, 'Evidence is addressable', 'Files are hashed; manifests bind asset ID, version, issuer and digest list.'],
            ].map(([Icon, title, text]) => {
              const Component = Icon as typeof Database;
              return (
                <div key={title as string}>
                  <Component size={18} />
                  <strong>{title as string}</strong>
                  <p>{text as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-content-section w-content-section--alt" id="contracts">
        <div className="ar-container">
          <SectionHeading
            eyebrow="SOROBAN MODULES"
            title={
              <>
                Contract surface.
                <br />
                <span className="w-silver">Explicit responsibilities.</span>
              </>
            }
            description="Each module has a narrow responsibility and a test suite. Status reflects implementation, not deployment or audit. No addresses are shown until a deployment manifest is generated."
            action={
              <ButtonLink href="/docs" variant="secondary">
                Build & deploy docs <ArrowUpRight size={14} />
              </ButtonLink>
            }
          />
          <div className="w-modules">
            {demoProtocolModules.map((module, index) => (
              <article key={module.id} className="w-module">
                <div className="w-module__top">
                  <span className="ar-mono">0{index + 1}</span>
                  <Badge tone="green">{module.status}</Badge>
                </div>
                <h3>{module.name}</h3>
                <p>{module.description}</p>
                <ul>
                  {module.responsibilities.map((responsibility) => (
                    <li key={responsibility}>{responsibility}</li>
                  ))}
                </ul>
                <div className="w-module__foot">
                  <Code2 size={12} />
                  <span>{module.language}</span>
                  <em>{module.testCount} test cases</em>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="w-content-section" id="asset-models">
        <div className="ar-container">
          <SectionHeading
            eyebrow="ASSET MODELS"
            title={
              <>
                Different assets.
                <br />
                <span className="w-silver">Different legal rights.</span>
              </>
            }
            description="The protocol does not force every asset into one token model. The issuer structure and legal documents define what the token represents. The contract enforces the transfer rules."
          />
          <div className="w-model-table">
            <div className="w-model-table__head">
              <span>Asset</span>
              <span>Token represents</span>
              <span>Does not represent</span>
              <span>Controls</span>
            </div>
            {assetModels.map((model) => (
              <div key={model.asset} className="w-model-table__row">
                <strong>{model.asset}</strong>
                <span>{model.represents}</span>
                <span>{model.doesNot}</span>
                <span>{model.controls}</span>
              </div>
            ))}
          </div>
          <div className="ar-alert ar-alert--amber">
            <ShieldCheck size={14} />
            <span>
              The legal structure is not a smart-contract configuration detail. Production issuance
              requires jurisdiction-specific counsel and a reviewed offering document before any token
              represents economic rights.
            </span>
          </div>
        </div>
      </section>

      <section className="w-content-section w-content-section--alt" id="standards">
        <div className="ar-container">
          <div className="w-two-col">
            <div>
              <div className="ar-eyebrow">
                <span className="ar-eyebrow__line" />
                STANDARDS
              </div>
              <h2 className="w-content-title">
                Aligned with the
                <br />
                <span className="w-silver">Stellar asset ecosystem.</span>
              </h2>
              <p className="w-content-lede">
                The token design uses the regulated-token concepts emerging around SEP-0057 and
                ERC-3643, implemented in Rust for Soroban. The reference contracts are intentionally
                understandable before they are clever.
              </p>
              <div className="w-standard-list">
                {[
                  ['SEP-0057', 'Controlled asset model with identity, transfer rules, freeze and recovery concepts.'],
                  ['ERC-3643 / T-REX', 'Reference for permissioned token transfer and identity registry patterns.'],
                  ['Stellar assets + SAC', 'Native settlement assets where issuance does not require custom logic.'],
                  ['OpenZeppelin Stellar', 'Reusable contract primitives and review conventions where applicable.'],
                  ['USDC', 'Optional settlement asset for subscriptions, rent and distributions.'],
                ].map(([label, text]) => (
                  <div key={label}>
                    <span className="ar-mono">{label}</span>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-code-panel">
              <div className="w-code-panel__bar">
                <span>
                  <StatusDot status="live" /> contracts/rwa-token/src/lib.rs
                </span>
                <span className="ar-mono">RUST</span>
              </div>
              <pre>
                <code>{`pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
    from.require_auth();

    require_not_paused(&env);
    assert_not_frozen(&env, &from);
    assert_not_frozen(&env, &to);
    require_eligible(&env, &from);
    require_eligible(&env, &to);
    move_balance(&env, &from, &to, amount);

    emit_transfer(&env, from, to, amount);
}`}</code>
              </pre>
              <div className="w-code-panel__note">
                <ShieldCheck size={13} />
                <span>
                  Eligibility is checked on both sides. A revoked or expired wallet cannot receive
                  tokens through a transfer or mint.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-content-section" id="security">
        <div className="ar-container">
          <SectionHeading
            eyebrow="SECURITY BOUNDARY"
            title={
              <>
                Designed for review.
                <br />
                <span className="w-silver">Not declared secure.</span>
              </>
            }
            description="The current repository is a reference implementation. Contracts are unaudited. Production requires independent review, operational controls and legal validation before capital is at risk."
          />
          <div className="w-security-grid">
            {[
              [Network, 'Threat model', 'Assets, actors, trust boundaries and abuse cases are documented before production.'],
              [ServerCog, 'Operational controls', 'API keys, role separation, audit events, idempotency keys and reconciliation.'],
              [Boxes, 'Custody boundary', 'The protocol does not custody private keys. Deployment uses the Stellar CLI keystore.'],
              [Globe2, 'Deployment gates', 'Mainnet requires explicit opt-in, independent audit and legal sign-off.'],
              [Wallet, 'Wallet safety', 'No silent signing. Network mismatch blocks the flow. No seed phrase handling.'],
              [Terminal, 'Reproducible builds', 'WASM is built from tagged source and compared to the deployment manifest.'],
            ].map(([Icon, title, text]) => {
              const Component = Icon as typeof ShieldCheck;
              return (
                <div key={title as string}>
                  <Component size={18} />
                  <h3>{title as string}</h3>
                  <p>{text as string}</p>
                </div>
              );
            })}
          </div>
          <div className="w-security-actions">
            <ButtonLink href="/docs#security" variant="secondary">
              Security documentation <ArrowUpRight size={13} />
            </ButtonLink>
            <ButtonLink href="https://stellar.org/soroban" variant="ghost">
              Stellar smart contracts <ArrowUpRight size={13} />
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="w-content-cta">
        <div className="ar-container w-content-cta__inner">
          <div>
            <div className="ar-eyebrow">
              <span className="ar-eyebrow__line" />
              IMPLEMENTATION STATUS
            </div>
            <h2>Reference protocol · Testnet design · No production deployment.</h2>
            <p>
              {demoSnapshot.metrics.assetsInRegistry} illustrative assets · {demoProtocolModules.length}{' '}
              contract modules · one evidence-first design.
            </p>
          </div>
          <ButtonLink href="/marketplace" size="lg">
            Explore structures <ArrowUpRight size={15} />
          </ButtonLink>
        </div>
      </section>
    </PublicPage>
  );
}
