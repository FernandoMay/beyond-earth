import type { Metadata } from 'next';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Blocks,
  Boxes,
  CircleDot,
  FileCheck2,
  Fingerprint,
  Globe2,
  Landmark,
  Layers3,
  LockKeyhole,
  Orbit,
  Radio,
  ShieldCheck,
  Satellite,
  ScanSearch,
  Waypoints,
} from 'lucide-react';
import {
  AssetCard,
  Badge,
  ButtonLink,
  DemoStrip,
  PORTALS,
  ProgressBar,
  PublicPage,
  SectionHeading,
  StatusDot,
} from '@aerospace/design-system';
import {
  VERTICALS,
  demoSnapshot,
  formatMoney,
  formatPercent,
  type Vertical,
} from '@aerospace/shared-types';

export const metadata: Metadata = {
  title: 'The Aerospace Asset Financial Network',
};

const verticalIcon: Record<Vertical, typeof Orbit> = {
  aviation: Orbit,
  space: Satellite,
  manufacturing: Layers3,
  drones: Radio,
  marketplace: Globe2,
};

const verticalExamples: Record<Vertical, string[]> = {
  aviation: ['Aircraft', 'Engines', 'Lease receivables'],
  space: ['Satellite capacity', 'Orbital infrastructure', 'Service contracts'],
  manufacturing: ['Tooling', 'Components', 'Verified inventory'],
  drones: ['Fleets', 'Operating capacity', 'Logistics contracts'],
  marketplace: ['Primary issuance', 'Secondary listings', 'Cross-vertical'],
};

const lifecycle = [
  {
    index: '01',
    title: 'Evidence',
    label: 'Asset verification',
    description:
      'Ownership, registration, inspection, insurance and financial evidence are captured as versioned digests.',
    meta: 'SHA-256 · IPFS-ready',
  },
  {
    index: '02',
    title: 'Registry',
    label: 'On-chain identity',
    description:
      'A single asset record anchors category, jurisdiction, operator, lifecycle state and evidence completeness.',
    meta: 'Soroban asset registry',
  },
  {
    index: '03',
    title: 'Structure',
    label: 'Legal boundary',
    description:
      'The issuer vehicle and economic rights are defined separately from the token. The token is never assumed to be title.',
    meta: 'SPV · rights · restrictions',
  },
  {
    index: '04',
    title: 'Token',
    label: 'Controlled representation',
    description:
      'A SEP-0057-aligned token enforces compliance, freezes and pauses at every mint and transfer.',
    meta: 'Regulated token',
  },
  {
    index: '05',
    title: 'Investment',
    label: 'Eligible participation',
    description:
      'Subscriptions pass identity, jurisdiction, tier and offering rules before value enters escrow.',
    meta: 'Eligibility · escrow',
  },
  {
    index: '06',
    title: 'Settlement',
    label: 'Revenue and exit',
    description:
      'Lease receipts and service income are reconciled, distributed per epoch and claimed exactly once.',
    meta: 'USDC · Stellar',
  },
];

const layers = {
  product: ['Investor portal', 'Issuer portal', 'Admin', 'Operations', 'Marketplace'],
  services: ['API', 'Indexer', 'Valuation', 'Oracles', 'Documents', 'Notifications'],
  protocol: [
    'Registry',
    'Compliance',
    'Token',
    'Investment',
    'Escrow',
    'Revenue',
    'Leasing',
    'Marketplace',
    'Governance',
  ],
  settlement: ['Stellar assets', 'SAC', 'USDC', 'Soroban', 'Wallets'],
};

const standards = [
  'SEP-0057 regulated token model',
  'Stellar assets and SAC',
  'ERC-3643 identity concepts',
  'OpenZeppelin Stellar components',
  'USDC settlement',
  'PostgreSQL operational ledger',
];

export default function HomePage() {
  const featured = demoSnapshot.assets[0]!;
  const featuredPct = featured.offering
    ? (featured.offering.committed.amount / featured.offering.targetRaise.amount) * 100
    : 0;
  const previewAssets = demoSnapshot.assets.slice(0, 3);

  return (
    <PublicPage>
      <section className="w-hero">
        <div className="w-hero__grid" aria-hidden="true" />
        <div className="w-hero__beam" aria-hidden="true" />
        <div className="ar-container w-hero__inner">
          <div className="w-hero__copy">
            <div className="ar-eyebrow">
              <span className="ar-eyebrow__line" />
              STELLAR + SOROBAN · REFERENCE IMPLEMENTATION
            </div>
            <h1>
              Financing the <br />
              <span>infrastructure</span>
              <br /> beyond Earth.
            </h1>
            <p className="w-hero__lede">
              A financial network for aerospace assets — evidence-linked registry, regulated
              tokenization, eligible investment and transparent settlement in one protocol.
            </p>
            <div className="w-hero__actions">
              <ButtonLink href="/marketplace" size="lg">
                Explore the network <ArrowUpRight size={16} />
              </ButtonLink>
              <ButtonLink href="/protocol" variant="secondary" size="lg">
                Read the protocol
              </ButtonLink>
            </div>
            <div className="w-hero__proof">
              <div>
                <strong>05</strong>
                <span>vertical asset classes</span>
              </div>
              <div>
                <strong>09</strong>
                <span>Soroban contract modules</span>
              </div>
              <div>
                <strong>01</strong>
                <span>common asset ledger</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>evidence-linked records</span>
              </div>
            </div>
          </div>

          <div className="w-hero__visual" aria-label="Aerospace asset network map">
            <div className="w-orbit">
              <div className="w-orbit__header">
                <span>
                  <StatusDot status="live" /> NETWORK MAP
                </span>
                <span className="ar-mono">ARWA / 01</span>
              </div>
              <svg viewBox="0 0 560 560" className="w-orbit__svg" aria-hidden="true">
                <defs>
                  <radialGradient id="w-core-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#2f7bff" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#2f7bff" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="w-core-fill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#152b4f" />
                    <stop offset="100%" stopColor="#081120" />
                  </linearGradient>
                  <pattern id="w-orbit-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                    <path d="M28 0H0v28" fill="none" stroke="#7ba6d8" strokeOpacity="0.045" />
                  </pattern>
                </defs>
                <rect width="560" height="560" fill="url(#w-orbit-grid)" />
                <circle
                  cx="280"
                  cy="280"
                  r="210"
                  fill="none"
                  stroke="#7ba6d8"
                  strokeOpacity="0.09"
                />
                <circle
                  cx="280"
                  cy="280"
                  r="155"
                  fill="none"
                  stroke="#7ba6d8"
                  strokeOpacity="0.12"
                />
                <circle
                  cx="280"
                  cy="280"
                  r="98"
                  fill="none"
                  stroke="#7ba6d8"
                  strokeOpacity="0.14"
                />
                <circle cx="280" cy="280" r="248" fill="url(#w-core-glow)" />
                <g className="w-orbit__ring">
                  <ellipse
                    cx="280"
                    cy="280"
                    rx="205"
                    ry="68"
                    transform="rotate(-27 280 280)"
                    fill="none"
                    stroke="#2f7bff"
                    strokeOpacity="0.3"
                    strokeDasharray="2 9"
                  />
                  <ellipse
                    cx="280"
                    cy="280"
                    rx="176"
                    ry="50"
                    transform="rotate(31 280 280)"
                    fill="none"
                    stroke="#5fd5ff"
                    strokeOpacity="0.18"
                  />
                </g>
                <path
                  d="M280 82v396M82 280h396M148 148l264 264M412 148 148 412"
                  stroke="#7ba6d8"
                  strokeOpacity="0.055"
                />
                {[
                  [280, 70, 'ASSET REGISTRY', 'left'],
                  [490, 280, 'COMPLIANCE', 'right'],
                  [280, 490, 'REVENUE', 'left'],
                  [70, 280, 'TOKEN', 'right'],
                  [425, 135, 'INVESTMENT', 'right'],
                  [135, 425, 'MARKETPLACE', 'left'],
                ].map(([x, y, label, side], index) => (
                  <g key={label as string}>
                    <circle
                      cx={x as number}
                      cy={y as number}
                      r="14"
                      fill="#07101f"
                      stroke="#2f7bff"
                      strokeOpacity="0.5"
                    />
                    <circle cx={x as number} cy={y as number} r="4" fill="#5fd5ff" />
                    <text
                      x={side === 'left' ? (x as number) - 22 : (x as number) + 22}
                      y={(y as number) + 3}
                      textAnchor={side === 'left' ? 'end' : 'start'}
                      fill="#8c9bb2"
                      fontSize="7.5"
                      fontFamily="var(--ar-font-mono)"
                      letterSpacing="1.2"
                    >
                      {label as string}
                    </text>
                    {index < 5 && (
                      <path
                        d={`M${x as number} ${y as number} L280 280`}
                        stroke="#2f7bff"
                        strokeOpacity="0.08"
                        strokeDasharray="2 6"
                      />
                    )}
                  </g>
                ))}
                <circle
                  cx="280"
                  cy="280"
                  r="64"
                  fill="url(#w-core-fill)"
                  stroke="#5fd5ff"
                  strokeOpacity="0.45"
                />
                <circle
                  cx="280"
                  cy="280"
                  r="48"
                  fill="none"
                  stroke="#7ba6d8"
                  strokeOpacity="0.18"
                />
                <ellipse
                  cx="280"
                  cy="280"
                  rx="48"
                  ry="17"
                  transform="rotate(-34 280 280)"
                  fill="none"
                  stroke="#7ba6d8"
                  strokeOpacity="0.35"
                />
                <path d="M280 246 299 292h-11l-4-9h-8l-4 9h-11l19-46h0Z" fill="#eef4ff" />
                <text
                  x="280"
                  y="374"
                  textAnchor="middle"
                  fill="#5d6b80"
                  fontSize="7"
                  fontFamily="var(--ar-font-mono)"
                  letterSpacing="1.8"
                >
                  AEROSPACE ASSET NETWORK
                </text>
              </svg>
              <div className="w-orbit__card w-orbit__card--tl">
                <span>REGISTRY STATE</span>
                <strong>Evidence-linked</strong>
                <em>
                  <i /> 6 structured records
                </em>
              </div>
              <div className="w-orbit__card w-orbit__card--br">
                <span>SETTLEMENT</span>
                <strong>Stellar Testnet</strong>
                <em>
                  <i /> USDC-ready design
                </em>
              </div>
              <div className="w-orbit__footer">
                <span>VERTICALS</span>
                <div>AVIATION</div>
                <div>SPACE</div>
                <div>MANUFACTURING</div>
                <div>DRONES</div>
              </div>
            </div>
          </div>
        </div>
        <div className="ar-container w-hero__status">
          <div>
            <span className="w-hero__status-label">NETWORK</span>
            <strong>
              <StatusDot status="pending" /> Stellar Testnet
            </strong>
          </div>
          <div>
            <span className="w-hero__status-label">ASSET CLASSES</span>
            <strong>05 verticals</strong>
          </div>
          <div>
            <span className="w-hero__status-label">SETTLEMENT</span>
            <strong>Stellar · USDC</strong>
          </div>
          <div>
            <span className="w-hero__status-label">PROTOCOL</span>
            <strong>Rust · Soroban</strong>
          </div>
          <div className="w-hero__status-note">
            <span className="ar-mono">REFERENCE BUILD · NOT PRODUCTION</span>
          </div>
        </div>
      </section>

      <section className="w-standards" aria-label="Technical standards">
        <div className="ar-container w-standards__inner">
          <span className="w-standards__label">DESIGNED AROUND OPEN FINANCIAL STANDARDS</span>
          <div className="w-standards__items">
            <span>SEP-0057</span>
            <span>STELLAR ASSETS</span>
            <span>SOROBAN</span>
            <span>USDC</span>
            <span>ERC-3643 CONCEPTS</span>
            <span>OPENZEPPELIN</span>
          </div>
          <a href="/protocol#standards" className="ar-text-link">
            Standards <ArrowUpRight size={11} />
          </a>
        </div>
      </section>

      <section className="w-section">
        <div className="ar-container">
          <SectionHeading
            eyebrow="THE ASSET LAYER"
            title={
              <>
                Five markets.
                <br />
                <span className="w-silver">One financial infrastructure.</span>
              </>
            }
            description="Aerospace is not a single asset class. It is a network of aircraft, orbital systems, production capacity and operating fleets. Aerospace RWA gives each a common evidence, compliance and settlement layer."
            action={
              <ButtonLink href="/marketplace" variant="secondary">
                View marketplace <ArrowUpRight size={14} />
              </ButtonLink>
            }
          />
          <div className="w-verticals">
            {VERTICALS.map((vertical, index) => {
              const Icon = verticalIcon[vertical.id];
              return (
                <article className="w-vertical" key={vertical.id}>
                  <div className="w-vertical__top">
                    <span className="ar-mono">0{index + 1}</span>
                    <Icon size={20} strokeWidth={1.3} />
                  </div>
                  <h3>{vertical.label}</h3>
                  <p>{vertical.description}</p>
                  <ul>
                    {verticalExamples[vertical.id].map((example) => (
                      <li key={example}>{example}</li>
                    ))}
                  </ul>
                  <a
                    href={`/marketplace?vertical=${vertical.id}`}
                    aria-label={`Explore ${vertical.label}`}
                  >
                    Explore market <ArrowUpRight size={12} />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-section w-lifecycle">
        <div className="ar-container w-lifecycle__grid">
          <div className="w-lifecycle__intro">
            <div className="ar-eyebrow">
              <span className="ar-eyebrow__line" />
              ASSET LIFECYCLE
            </div>
            <h2>
              One asset.
              <br />
              <span className="w-silver">A complete financial lifecycle.</span>
            </h2>
            <p>
              The protocol connects the physical and contractual reality of an asset to its digital
              representation, without collapsing the legal, compliance and technical layers into
              one.
            </p>
            <div className="w-lifecycle__note">
              <Fingerprint size={16} />
              <span>
                Every state change is attributable to an actor, an evidence packet and a contract
                event.
              </span>
            </div>
          </div>
          <div className="w-lifecycle__steps">
            {lifecycle.map((step) => (
              <article key={step.index} className="w-lifecycle__step">
                <span className="w-lifecycle__index ar-mono">{step.index}</span>
                <div>
                  <span className="w-lifecycle__label">{step.label}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <em className="ar-mono">{step.meta}</em>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="w-section w-feature-section">
        <div className="ar-container">
          <div className="w-feature">
            <div className="w-feature__visual">
              <img src="/assets/engine.svg" alt="Illustrative turbofan engine technical view" />
              <div className="w-feature__overlay">
                <Badge tone="amber" dot>
                  Reference structure 01
                </Badge>
                <span className="ar-mono">DEMO-AV-0001</span>
              </div>
              <div className="w-feature__caption">
                <span className="ar-mono">ILLUSTRATIVE ASSET · NOT A REAL ENGINE</span>
              </div>
            </div>
            <div className="w-feature__body">
              <div className="ar-eyebrow">
                <span className="ar-eyebrow__line" />
                FEATURED STRUCTURE
              </div>
              <h2>{featured.name}</h2>
              <p>{featured.summary}</p>
              <dl className="w-feature__metrics">
                <div>
                  <dt>Reference value</dt>
                  <dd>{formatMoney(featured.valuation.value, true)}</dd>
                </div>
                <div>
                  <dt>Target distribution</dt>
                  <dd>
                    {featured.financials.targetDistribution
                      ? `${formatPercent(featured.financials.targetDistribution.min)}–${formatPercent(
                          featured.financials.targetDistribution.max,
                        )}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt>Structure</dt>
                  <dd>SPV lease participation</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>{featured.evidenceCompleteness}% complete</dd>
                </div>
              </dl>
              <ProgressBar
                value={featuredPct}
                label={`Demo commitments ${formatMoney(
                  featured.offering?.committed ?? { amount: 0, currency: 'USDC' },
                  true,
                )} / ${formatMoney(featured.offering?.targetRaise ?? { amount: 0, currency: 'USDC' }, true)}`}
              />
              <div className="w-feature__actions">
                <ButtonLink href={`/assets/${featured.slug}`}>
                  Review the structure <ArrowRight size={14} />
                </ButtonLink>
                <a href={PORTALS.investor} className="ar-text-link">
                  Investor workspace <ArrowUpRight size={11} />
                </a>
              </div>
              <div className="w-feature__disclaimer">
                <ShieldCheck size={14} />
                <span>
                  Token represents defined economic rights, not automatic ownership of the engine.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-section w-protocol-section" id="architecture">
        <div className="ar-container">
          <SectionHeading
            eyebrow="PROTOCOL ARCHITECTURE"
            title={
              <>
                Institutional control,
                <br />
                <span className="w-silver">from evidence to settlement.</span>
              </>
            }
            description="Two layers, one source of truth. Applications consume a typed API; the protocol enforces eligibility, escrow and distribution rules; Stellar provides the settlement rail."
            action={
              <ButtonLink href="/protocol" variant="secondary">
                Protocol detail <ArrowUpRight size={14} />
              </ButtonLink>
            }
          />
          <div className="w-stack">
            <div className="w-stack__layer w-stack__layer--product">
              <div className="w-stack__label">
                <span className="ar-mono">01 / EXPERIENCE</span>
                <strong>Product & application layer</strong>
              </div>
              <div className="w-stack__items">
                {layers.product.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
            <div className="w-stack__connector" aria-hidden="true">
              <span />
              <em className="ar-mono">TYPED API · EVENT STREAM</em>
              <span />
            </div>
            <div className="w-stack__layer w-stack__layer--services">
              <div className="w-stack__label">
                <span className="ar-mono">02 / OPERATIONS</span>
                <strong>Services & data layer</strong>
              </div>
              <div className="w-stack__items">
                {layers.services.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
            <div className="w-stack__connector" aria-hidden="true">
              <span />
              <em className="ar-mono">SOROBAN RPC · INDEXED EVENTS</em>
              <span />
            </div>
            <div className="w-stack__layer w-stack__layer--protocol">
              <div className="w-stack__label">
                <span className="ar-mono">03 / ENFORCEMENT</span>
                <strong>Aerospace RWA protocol</strong>
              </div>
              <div className="w-stack__items w-stack__items--protocol">
                {layers.protocol.map((item, index) => (
                  <span key={item}>
                    <b className="ar-mono">0{index + 1}</b>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="w-stack__connector" aria-hidden="true">
              <span />
              <em className="ar-mono">STELLAR SETTLEMENT</em>
              <span />
            </div>
            <div className="w-stack__layer w-stack__layer--stellar">
              <div className="w-stack__label">
                <span className="ar-mono">04 / SETTLEMENT</span>
                <strong>Stellar network</strong>
              </div>
              <div className="w-stack__items">
                {layers.settlement.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-section">
        <div className="ar-container">
          <div className="w-controls">
            <div className="w-controls__intro">
              <div className="ar-eyebrow">
                <span className="ar-eyebrow__line" />
                INSTITUTIONAL CONTROLS
              </div>
              <h2>
                Built for
                <br />
                <span className="w-silver">regulated capital.</span>
              </h2>
              <p>
                Compliance is not a dashboard checkbox. It is enforced at the protocol boundary,
                recorded as an event and reflected in every investor-facing state.
              </p>
              <div className="w-controls__status">
                <span>
                  <LockKeyhole size={13} /> Fail-closed design
                </span>
                <span>
                  <FileCheck2 size={13} /> Evidence versioning
                </span>
                <span>
                  <ShieldCheck size={13} /> Explicit authorisation
                </span>
              </div>
            </div>
            <div className="w-controls__grid">
              <ControlCard
                icon={ScanSearch}
                index="01"
                title="Evidence-linked registry"
                text="An asset cannot reach verified state without a document digest, owner record and issuer authorization."
              />
              <ControlCard
                icon={Fingerprint}
                index="02"
                title="Eligibility at transfer"
                text="Every mint and transfer checks wallet verification, jurisdiction, tier and expiry before balances move."
              />
              <ControlCard
                icon={LockKeyhole}
                index="03"
                title="Conditional escrow"
                text="Subscription and marketplace value is held until explicit release conditions are satisfied."
              />
              <ControlCard
                icon={Waypoints}
                index="04"
                title="Reconciled distributions"
                text="Revenue epochs map recorded allocations to claims, with one-time claim enforcement and events."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="w-section">
        <div className="ar-container">
          <SectionHeading
            eyebrow="MARKETPLACE PREVIEW"
            title={
              <>
                Structures ready
                <br />
                <span className="w-silver">for review.</span>
              </>
            }
            description="Explore demonstration structures across aviation, space and manufacturing. Every record is illustrative and linked to synthetic evidence."
            action={
              <ButtonLink href="/marketplace" variant="secondary">
                All assets <ArrowUpRight size={14} />
              </ButtonLink>
            }
          />
          <div className="w-asset-grid">
            {previewAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        </div>
      </section>

      <section className="w-section">
        <div className="ar-container">
          <div className="w-standards-block">
            <div className="w-standards-block__copy">
              <div className="ar-eyebrow">
                <span className="ar-eyebrow__line" />
                STANDARDS & SECURITY
              </div>
              <h2>
                Not another token.
                <br />
                <span className="w-silver">A regulated asset rail.</span>
              </h2>
              <p>
                The protocol uses the Stellar ecosystem&apos;s regulated-token primitives and keeps
                the legal boundary explicit. Contracts, services and infrastructure are designed to
                be independently reviewed before production capital is involved.
              </p>
              <div className="w-standards-block__actions">
                <ButtonLink href="/compliance" variant="secondary">
                  Compliance model <ArrowUpRight size={13} />
                </ButtonLink>
                <a href="/docs" className="ar-text-link">
                  Read security posture
                </a>
              </div>
            </div>
            <div className="w-standards-block__list">
              {standards.map((standard, index) => (
                <div key={standard}>
                  <span className="ar-mono">0{index + 1}</span>
                  <strong>{standard}</strong>
                  <BadgeCheck size={14} />
                </div>
              ))}
            </div>
          </div>
          <div className="w-metrics-strip">
            <div>
              <span className="ar-mono">REGISTRY</span>
              <strong>{demoSnapshot.metrics.assetsInRegistry} illustrative assets</strong>
              <small>Five verticals represented</small>
            </div>
            <div>
              <span className="ar-mono">PROTOCOL</span>
              <strong>9 Soroban modules</strong>
              <small>Unit tested, unaudited</small>
            </div>
            <div>
              <span className="ar-mono">ELIGIBILITY</span>
              <strong>{demoSnapshot.metrics.eligibleInvestors} demo investors</strong>
              <small>Compliance-gated state</small>
            </div>
            <div>
              <span className="ar-mono">SETTLEMENT</span>
              <strong>USDC-ready</strong>
              <small>Stellar Testnet only</small>
            </div>
          </div>
        </div>
      </section>

      <section className="w-cta">
        <div className="ar-container w-cta__inner">
          <div>
            <div className="ar-eyebrow">
              <span className="ar-eyebrow__line" />
              AEROSPACE RWA
            </div>
            <h2>
              The financial infrastructure
              <br />
              for the aerospace economy.
            </h2>
            <p>
              Start with the structure. Verify the evidence. Enforce eligibility. Settle what is
              real.
            </p>
          </div>
          <div className="w-cta__actions">
            <ButtonLink href="/marketplace" size="lg">
              Explore marketplace <ArrowUpRight size={16} />
            </ButtonLink>
            <ButtonLink href={PORTALS.issuer} variant="secondary" size="lg">
              Issuer workspace
            </ButtonLink>
          </div>
          <div className="w-cta__grid" aria-hidden="true" />
        </div>
      </section>

      <DemoStrip>
        <span>End of page · all assets and returns illustrative · no offer of securities</span>
      </DemoStrip>
    </PublicPage>
  );
}

function ControlCard({
  icon: Icon,
  index,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  index: string;
  title: string;
  text: string;
}) {
  return (
    <article className="w-control-card">
      <div className="w-control-card__top">
        <Icon size={19} strokeWidth={1.4} />
        <span className="ar-mono">{index}</span>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="w-control-card__line" aria-hidden="true" />
    </article>
  );
}
