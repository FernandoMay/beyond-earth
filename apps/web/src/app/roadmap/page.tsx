import type { Metadata } from 'next';
import { ArrowUpRight, Check, CircleDashed, LockKeyhole, ShieldCheck } from 'lucide-react';
import {
  Badge,
  ButtonLink,
  ProgressBar,
  PublicPage,
  SectionHeading,
} from '@aerospace/design-system';

export const metadata: Metadata = {
  title: 'Roadmap',
  description: 'The construction plan and production gates for Aerospace RWA.',
};

const phases = [
  {
    phase: '01',
    title: 'Foundation',
    subtitle: 'Project Genesis',
    status: 'complete' as const,
    progress: 100,
    deliverables: [
      'Monorepo, brand and design system',
      'Product and protocol architecture',
      'Domain model and PostgreSQL schema',
      'Threat model and security boundary',
      'Public platform and documentation',
    ],
    gate: 'A reproducible repository with a coherent product, protocol and risk model.',
  },
  {
    phase: '02',
    title: 'Core Protocol',
    subtitle: 'Soroban enforcement',
    status: 'complete' as const,
    progress: 100,
    deliverables: [
      'Asset registry and evidence linkage',
      'Investor compliance and eligibility',
      'Regulated token with transfer controls',
      'Investment, escrow and revenue modules',
      'Leasing, marketplace and governance',
    ],
    gate: 'All modules compile, pass unit tests and expose explicit failure paths.',
  },
  {
    phase: '03',
    title: 'Marketplace',
    subtitle: 'Investor & issuer surfaces',
    status: 'current' as const,
    progress: 82,
    deliverables: [
      'Issuer onboarding and asset drafts',
      'Marketplace discovery and filters',
      'Wallet connection and Testnet flow',
      'Investor portfolio and distributions',
      'Admin and operations workspaces',
    ],
    gate: 'End-to-end Testnet flow with an eligible test wallet and no fabricated settlement.',
  },
  {
    phase: '04',
    title: 'Aerospace Operations',
    subtitle: 'Lifecycle management',
    status: 'upcoming' as const,
    progress: 34,
    deliverables: [
      'Lease schedules and rent reconciliation',
      'Maintenance and inspection records',
      'Insurance and claims workflows',
      'Valuation history and oracle freshness',
      'Asset lifecycle events and alerts',
    ],
    gate: 'Operations data reconciles to payment and distribution records.',
  },
  {
    phase: '05',
    title: 'Multi-Vertical',
    subtitle: 'Five markets, one network',
    status: 'upcoming' as const,
    progress: 18,
    deliverables: [
      'Aviation and engine templates',
      'Space capacity and ground segment',
      'Manufacturing equipment and inventory',
      'Drone fleets and operating capacity',
      'Cross-vertical marketplace',
    ],
    gate: 'At least one structure per vertical passes legal and technical review.',
  },
  {
    phase: '06',
    title: 'Institutional Production',
    subtitle: 'Mainnet readiness',
    status: 'locked' as const,
    progress: 0,
    deliverables: [
      'Independent smart-contract audit',
      'Legal opinions and offering documents',
      'Custody and key-management integration',
      'Monitoring, incident response and DR',
      'Mainnet deployment and pilot issuer',
    ],
    gate: 'Audit, legal, operational and security sign-off before any real capital.',
  },
];

export default function RoadmapPage() {
  return (
    <PublicPage>
      <section className="w-page-hero">
        <div className="ar-container">
          <div className="w-page-hero__grid">
            <div>
              <div className="ar-eyebrow">
                <span className="ar-eyebrow__line" />
                CONSTRUCTION ROADMAP
              </div>
              <h1>
                Build the rail.
                <br />
                <span className="w-silver">Then earn the right to use it.</span>
              </h1>
              <p>
                The project advances through explicit gates. A working interface is not production
                readiness, and a deployed contract is not a regulated financial product.
              </p>
            </div>
            <div className="w-page-hero__aside">
              <div>
                <span className="ar-mono">CURRENT</span>
                <strong>03</strong>
                <small>Marketplace</small>
              </div>
              <div>
                <span className="ar-mono">MODULES</span>
                <strong>09</strong>
                <small>implemented & tested</small>
              </div>
              <div>
                <span className="ar-mono">MAINNET</span>
                <strong>Locked</strong>
                <small>audit + legal gates</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-content-section">
        <div className="ar-container">
          <SectionHeading
            eyebrow="DELIVERY PLAN"
            title={
              <>
                Six phases.
                <br />
                <span className="w-silver">No skipped controls.</span>
              </>
            }
            description="Each phase has a concrete outcome, an acceptance gate and an explicit status. Production activation requires independent audit and legal sign-off."
          />
          <div className="w-roadmap">
            {phases.map((phase) => (
              <article
                key={phase.phase}
                className={`w-roadmap__item is-${phase.status}`}
              >
                <div className="w-roadmap__rail">
                  <span className="w-roadmap__marker">
                    {phase.status === 'complete' ? (
                      <Check size={12} />
                    ) : phase.status === 'locked' ? (
                      <LockKeyhole size={12} />
                    ) : (
                      <CircleDashed size={12} />
                    )}
                  </span>
                  <span className="w-roadmap__line" aria-hidden="true" />
                </div>
                <div className="w-roadmap__content">
                  <div className="w-roadmap__top">
                    <div>
                      <span className="ar-mono">PHASE {phase.phase}</span>
                      <h2>{phase.title}</h2>
                      <p>{phase.subtitle}</p>
                    </div>
                    <Badge
                      tone={
                        phase.status === 'complete'
                          ? 'green'
                          : phase.status === 'current'
                            ? 'blue'
                            : phase.status === 'locked'
                              ? 'red'
                              : 'neutral'
                      }
                      dot
                    >
                      {phase.status}
                    </Badge>
                  </div>
                  <div className="w-roadmap__body">
                    <ul>
                      {phase.deliverables.map((deliverable) => (
                        <li key={deliverable}>
                          {phase.status === 'complete' ? (
                            <Check size={11} />
                          ) : (
                            <span className="ar-mono">·</span>
                          )}
                          {deliverable}
                        </li>
                      ))}
                    </ul>
                    <div className="w-roadmap__gate">
                      <span className="ar-mono">ACCEPTANCE GATE</span>
                      <p>{phase.gate}</p>
                      <ProgressBar value={phase.progress} label="Phase progress" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="w-content-section w-content-section--alt">
        <div className="ar-container">
          <div className="w-definition">
            <div>
              <div className="ar-eyebrow">
                <span className="ar-eyebrow__line" />
                DEFINITION OF SUCCESS
              </div>
              <h2>
                It is not finished
                <br />
                <span className="w-silver">because it has a UI.</span>
              </h2>
              <p>
                The project succeeds only when a real issuer, a valid legal structure and a real asset
                complete an end-to-end cycle with verifiable evidence, controlled transfer and
                reconciled settlement.
              </p>
            </div>
            <ul>
              {[
                'Verified asset record with versioned evidence',
                'Eligibility enforced before subscription and transfer',
                'Escrow release with explicit conditions',
                'Settlement in a Stellar asset with a verifiable transaction',
                'Revenue distribution reconciled to off-chain receipts',
                'Independent audit and reproducible deployment',
                'At least one real issuer with a valid legal structure',
              ].map((item) => (
                <li key={item}>
                  <ShieldCheck size={13} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-roadmap__cta">
            <ButtonLink href="/marketplace" size="lg">
              Explore the reference assets <ArrowUpRight size={15} />
            </ButtonLink>
            <ButtonLink href="/protocol" variant="secondary" size="lg">
              Review protocol
            </ButtonLink>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
