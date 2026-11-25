import type { Metadata } from 'next';
import {
  ArrowUpRight,
  BadgeCheck,
  Ban,
  BookOpenCheck,
  Building2,
  CircleUserRound,
  FileSearch,
  Fingerprint,
  Globe2,
  Landmark,
  LockKeyhole,
  Radar,
  Scale,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  Badge,
  ButtonLink,
  PublicPage,
  SectionHeading,
} from '@aerospace/design-system';
import { demoSnapshot } from '@aerospace/shared-types';

export const metadata: Metadata = {
  title: 'Compliance',
  description:
    'Eligibility, identity, transfer restrictions, jurisdiction and the legal boundary of Aerospace RWA.',
};

const controls = [
  {
    icon: CircleUserRound,
    label: 'Identity',
    title: 'Who the investor is',
    body: 'Verified legal identity, beneficial ownership where relevant, sanctions screening and contactability.',
    state: 'KYC record',
  },
  {
    icon: Globe2,
    label: 'Jurisdiction',
    title: 'Where they can invest',
    body: 'Residency and offering restrictions are checked against an allowlist before a subscription or transfer.',
    state: 'Policy gate',
  },
  {
    icon: BadgeCheck,
    label: 'Eligibility',
    title: 'What they qualify for',
    body: 'Professional, institutional or other eligible status is represented as a tier with an expiry date.',
    state: 'Tier + expiry',
  },
  {
    icon: LockKeyhole,
    label: 'Transfer',
    title: 'Whether units can move',
    body: 'Both wallets are checked on every mint and transfer. Frozen, expired or revoked wallets fail closed.',
    state: 'On-chain check',
  },
];

const lifecycle = [
  ['01', 'Onboarding', 'Identity, ownership, sanctions and source-of-funds checks are initiated through a regulated provider.'],
  ['02', 'Decision', 'A compliance officer records approval, tier, jurisdiction and expiry as an auditable event.'],
  ['03', 'Subscription', 'The investment contract requires an eligible wallet before accepting value into escrow.'],
  ['04', 'Holding', 'The token contract checks eligibility on both sides of every transfer.'],
  ['05', 'Renewal', 'Verification expiry blocks new subscriptions and transfers until review is complete.'],
  ['06', 'Offboarding', 'Revocation, freeze or forced transfer follows documented legal and operational procedures.'],
];

const matrix = [
  ['Illustrative EU jurisdiction', 'Institutional / professional', 'KYC + source of funds', 'Illustrative only'],
  ['Illustrative UK jurisdiction', 'Professional', 'KYC + eligibility', 'Illustrative only'],
  ['Illustrative US jurisdiction', 'Accredited / institutional', 'KYC + accreditation', 'Illustrative only'],
  ['Illustrative Singapore jurisdiction', 'Institutional', 'KYC + AML', 'Illustrative only'],
  ['Other jurisdictions', 'Not admitted by default', 'Legal review required', 'Fail closed'],
];

export default function CompliancePage() {
  return (
    <PublicPage>
      <section className="w-page-hero">
        <div className="ar-container">
          <div className="w-page-hero__grid">
            <div>
              <div className="ar-eyebrow">
                <span className="ar-eyebrow__line" />
                COMPLIANCE & LEGAL BOUNDARY
              </div>
              <h1>
                Eligibility is
                <br />
                <span className="w-silver">infrastructure.</span>
              </h1>
              <p>
                A regulated asset network must know who can hold an instrument, where they can hold
                it and when their eligibility expires. Aerospace RWA treats those questions as
                protocol inputs, not back-office afterthoughts.
              </p>
            </div>
            <div className="w-page-hero__aside">
              <div>
                <span className="ar-mono">VERIFIED (DEMO)</span>
                <strong>{demoSnapshot.metrics.eligibleInvestors}</strong>
                <small>eligible investor records</small>
              </div>
              <div>
                <span className="ar-mono">PENDING</span>
                <strong>{demoSnapshot.metrics.pendingReviews}</strong>
                <small>open reviews</small>
              </div>
              <div>
                <span className="ar-mono">DEFAULT</span>
                <strong>Deny</strong>
                <small>no jurisdiction assumption</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-content-section">
        <div className="ar-container">
          <SectionHeading
            eyebrow="THE CONTROL MODEL"
            title={
              <>
                Four questions.
                <br />
                <span className="w-silver">Continuous enforcement.</span>
              </>
            }
            description="Identity is not a one-time PDF upload. Eligibility has a tier, a jurisdiction and an expiry. The protocol consumes that state before value or tokens move."
          />
          <div className="w-compliance-controls">
            {controls.map((control, index) => {
              const Icon = control.icon;
              return (
                <article key={control.label}>
                  <div className="w-compliance-controls__top">
                    <Icon size={20} strokeWidth={1.35} />
                    <span className="ar-mono">0{index + 1}</span>
                  </div>
                  <span className="w-compliance-controls__label">{control.label}</span>
                  <h3>{control.title}</h3>
                  <p>{control.body}</p>
                  <div className="w-compliance-controls__state">
                    <Fingerprint size={11} /> {control.state}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-content-section w-content-section--alt">
        <div className="ar-container">
          <div className="w-two-col">
            <div>
              <div className="ar-eyebrow">
                <span className="ar-eyebrow__line" />
                OPERATING MODEL
              </div>
              <h2 className="w-content-title">
                A lifecycle,
                <br />
                <span className="w-silver">not a checkbox.</span>
              </h2>
              <p className="w-content-lede">
                The demo interface models the sequence that a production deployment would implement
                with a regulated KYC/AML provider, a compliance officer and a documented review
                committee.
              </p>
              <div className="ar-alert ar-alert--amber">
                <Scale size={14} />
                <span>
                  The current repository does not include a live KYC provider. Verification states
                  shown in the portals are synthetic and must not be used to onboard real investors.
                </span>
              </div>
            </div>
            <ol className="w-compliance-lifecycle">
              {lifecycle.map(([index, title, text]) => (
                <li key={index}>
                  <span className="ar-mono">{index}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="w-content-section">
        <div className="ar-container">
          <SectionHeading
            eyebrow="JURISDICTION FRAMEWORK"
            title={
              <>
                No default market.
                <br />
                <span className="w-silver">No implied passport.</span>
              </>
            }
            description="The matrix below is illustrative and shows how a jurisdiction policy would be represented. It is not legal advice and does not approve any offering in any jurisdiction."
          />
          <div className="w-jurisdiction">
            <div className="w-jurisdiction__head">
              <span>Illustrative jurisdiction</span>
              <span>Eligible category</span>
              <span>Evidence required</span>
              <span>Status</span>
            </div>
            {matrix.map((row) => (
              <div key={row[0]} className="w-jurisdiction__row">
                <strong>{row[0]}</strong>
                <span>{row[1]}</span>
                <span>{row[2]}</span>
                <Badge tone={row[3] === 'Illustrative only' ? 'amber' : 'neutral'}>{row[3]}</Badge>
              </div>
            ))}
          </div>
          <div className="w-compliance-notes">
            <div>
              <Ban size={16} />
              <strong>No public offering</strong>
              <p>Nothing in this repository constitutes an offer or solicitation in any jurisdiction.</p>
            </div>
            <div>
              <Scale size={16} />
              <strong>Local counsel required</strong>
              <p>Each issuer structure and distribution model requires jurisdiction-specific legal review.</p>
            </div>
            <div>
              <FileSearch size={16} />
              <strong>Evidence before approval</strong>
              <p>Asset and issuer approvals require complete evidence, not merely a completed form.</p>
            </div>
            <div>
              <Landmark size={16} />
              <strong>Regulatory perimeter</strong>
              <p>Licensing, custody and marketing requirements depend on the activity and jurisdiction.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-content-section w-content-section--alt">
        <div className="ar-container">
          <SectionHeading
            eyebrow="INVESTOR PROTECTION"
            title={
              <>
                Disclosure before
                <br />
                <span className="w-silver">participation.</span>
              </>
            }
            description="The product must make it difficult to misunderstand the asset, the token and the risk. These controls are reflected in the interface and the protocol."
          />
          <div className="w-protection-grid">
            {[
              [UserCheck, 'Eligibility first', 'No subscription without a verified, unexpired investor record.'],
              [BookOpenCheck, 'Documented rights', 'Token rights, restrictions and waterfall are stated in offering documents.'],
              [Radar, 'Risk visibility', 'Counterparty, liquidity, technology and regulatory risks are disclosed per structure.'],
              [Building2, 'Segregated structure', 'The issuer vehicle is separate from the platform and, where used, bankruptcy-remote.'],
              [ShieldCheck, 'On-chain restrictions', 'Compliance and transfer controls are enforced by the token contract.'],
              [Globe2, 'Jurisdiction control', 'The compliance contract checks both wallet and policy before movement.'],
            ].map(([Icon, title, text]) => {
              const Component = Icon as typeof ShieldCheck;
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

      <section className="w-content-section">
        <div className="ar-container">
          <div className="w-compliance-callout">
            <div>
              <div className="ar-eyebrow">
                <span className="ar-eyebrow__line" />
                IMPORTANT LEGAL NOTICE
              </div>
              <h2>Tokens are not automatically the asset.</h2>
              <p>
                A token may represent contractual economic rights, receivables, service capacity or
                another defined interest. It does not automatically convey title, possession, voting
                control, spectrum rights, airworthiness authority or any other right not expressly
                granted in the applicable documents. Production structures require legal opinions,
                licensing analysis, investor disclosures and independent review.
              </p>
            </div>
            <div className="w-compliance-callout__actions">
              <ButtonLink href="/protocol#asset-models">
                Asset models <ArrowUpRight size={13} />
              </ButtonLink>
              <a href="/docs" className="ar-text-link">
                Compliance documentation <ArrowUpRight size={11} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
