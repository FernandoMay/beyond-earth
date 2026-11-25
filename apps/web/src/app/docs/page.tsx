import type { Metadata } from 'next';
import {
  ArrowUpRight,
  BookOpen,
  Database,
  FileCode2,
  FolderTree,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { Badge, ButtonLink, PublicPage, SectionHeading } from '@aerospace/design-system';

export const metadata: Metadata = {
  title: 'Documentation',
};

const docIndex = [
  ['VISION.md', 'Product thesis, boundaries and five-vertical strategy'],
  ['ARCHITECTURE.md', 'Layers, data flow, trust boundaries and deployment topology'],
  ['PROTOCOL.md', 'Contract responsibilities, interfaces, events and invariants'],
  ['TOKENOMICS.md', 'Economic rights, waterfall, fees and distribution mechanics'],
  ['ASSET-MODELS.md', 'How each aerospace vertical maps to a legal and token model'],
  ['COMPLIANCE.md', 'Eligibility, jurisdiction, KYC/AML and legal boundaries'],
  ['SECURITY.md', 'Threat model, controls, audit requirements and incident response'],
  ['API.md', 'HTTP endpoints, schemas, auth and error behaviour'],
  ['ROADMAP.md', 'Delivery phases, acceptance gates and production criteria'],
];

const endpoints = [
  ['GET', '/health', 'Process and network status'],
  ['GET', '/v1/assets', 'Filterable asset registry'],
  ['GET', '/v1/assets/:id', 'Asset detail by ID or slug'],
  ['POST', '/v1/assets', 'Create an evidence-backed draft (issuer)'],
  ['GET', '/v1/distributions', 'Distribution calendar'],
  ['POST', '/v1/subscriptions', 'Validate and quote a subscription'],
  ['GET', '/v1/compliance/cases', 'Review queue (admin)'],
  ['GET', '/v1/operations/tasks', 'Lease and maintenance work queue'],
];

export default function DocsPage() {
  return (
    <PublicPage>
      <section className="w-page-hero">
        <div className="ar-container">
          <div className="w-page-hero__grid">
            <div>
              <div className="ar-eyebrow">
                <span className="ar-eyebrow__line" />
                DOCUMENTATION
              </div>
              <h1>
                Build the network.
                <br />
                <span className="w-silver">Understand every boundary.</span>
              </h1>
              <p>
                The repository contains the product, protocol, services, infrastructure and delivery
                gates. This page is the operating index for engineers, reviewers and institutional
                partners.
              </p>
            </div>
            <div className="w-page-hero__aside">
              <div>
                <span className="ar-mono">APPS</span>
                <strong>05</strong>
                <small>public + four portals</small>
              </div>
              <div>
                <span className="ar-mono">CONTRACTS</span>
                <strong>09</strong>
                <small>Rust / Soroban</small>
              </div>
              <div>
                <span className="ar-mono">SERVICES</span>
                <strong>06</strong>
                <small>API + 5 services</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-content-section">
        <div className="ar-container">
          <SectionHeading
            eyebrow="QUICK START"
            title={
              <>
                Run the reference stack.
                <br />
                <span className="w-silver">No database required for demo mode.</span>
              </>
            }
            description="Install the workspace, start all five applications and the API, and explore deterministic illustrative data. No transaction is signed in demo mode."
          />
          <div className="w-docs-grid">
            <div className="w-docs-code">
              <div className="w-code-panel__bar">
                <span>
                  <Terminal size={11} /> LOCAL
                </span>
                <span className="ar-mono">SHELL</span>
              </div>
              <pre>
                <code>{`npm install

# Public site + investor + issuer + admin + operations + API
npm run dev

# Validate everything
npm run typecheck
npm run test:unit
npm run test:contracts
npm run build`}</code>
              </pre>
            </div>
            <div className="w-docs-grid__aside">
              <div>
                <FolderTree size={17} />
                <strong>Monorepo</strong>
                <p>
                  npm workspaces for apps, packages and services; Cargo workspace for contracts.
                </p>
              </div>
              <div>
                <Database size={17} />
                <strong>Demo adapter</strong>
                <p>Deterministic dataset with the same domain types as the live API.</p>
              </div>
              <div>
                <ShieldCheck size={17} />
                <strong>Safe by default</strong>
                <p>Demo mode accepts no subscription and produces no signed transaction.</p>
              </div>
            </div>
          </div>
          <div className="w-docs-urls">
            <span>PUBLIC :3000</span>
            <span>INVESTOR :3001</span>
            <span>ISSUER :3002</span>
            <span>ADMIN :3003</span>
            <span>OPERATIONS :3004</span>
            <span>API :4000</span>
          </div>
        </div>
      </section>

      <section className="w-content-section w-content-section--alt">
        <div className="ar-container">
          <SectionHeading
            eyebrow="REPOSITORY INDEX"
            title="Documents and decisions"
            description="Every material domain has a written model. Architecture decisions are recorded as ADRs and remain in history when superseded."
          />
          <div className="w-docs-index">
            {docIndex.map(([file, description]) => (
              <div key={file}>
                <FileCode2 size={14} />
                <strong>{file}</strong>
                <p>{description}</p>
                <span className="ar-mono">docs/</span>
              </div>
            ))}
          </div>
          <div className="w-docs-index__note">
            <BookOpen size={14} />
            <span>
              Repository files are the canonical documentation. This site is a visual index and
              product surface, not a substitute for reading the source and its security notes.
            </span>
          </div>
        </div>
      </section>

      <section className="w-content-section">
        <div className="ar-container">
          <div className="w-two-col">
            <div>
              <div className="ar-eyebrow">
                <span className="ar-eyebrow__line" />
                HTTP API
              </div>
              <h2 className="w-content-title">Typed endpoints</h2>
              <p className="w-content-lede">
                The API validates inputs with Zod, separates demo and live repositories, and
                requires an API key for issuer and administrative writes. Read endpoints are safe in
                demo mode.
              </p>
              <div className="ar-alert">
                <ShieldCheck size={14} />
                <span>
                  API keys are never embedded in browser bundles. Portal actions that require
                  privileges must call a server boundary with a scoped session.
                </span>
              </div>
            </div>
            <div className="w-api-list">
              {endpoints.map(([method, path, description]) => (
                <div key={path}>
                  <Badge tone={method === 'GET' ? 'blue' : 'amber'}>{method}</Badge>
                  <code>{path}</code>
                  <span>{description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="w-content-section w-content-section--alt" id="security">
        <div className="ar-container">
          <SectionHeading
            eyebrow="SECURITY & DEPLOYMENT"
            title={
              <>
                Testnet is a design target.
                <br />
                <span className="w-silver">Mainnet is a decision.</span>
              </>
            }
            description="The deployment scripts refuse Mainnet unless explicitly allowed. Production requires independent audits, legal sign-off, custody integration, monitoring, and a tested incident-response plan."
          />
          <div className="w-deploy-steps">
            {[
              ['01', 'Build', 'Compile WASM from a tagged commit and record hashes.'],
              ['02', 'Review', 'Complete internal review and independent audit.'],
              [
                '03',
                'Legal',
                'Finalise issuer structure, offering documents and jurisdiction analysis.',
              ],
              [
                '04',
                'Testnet',
                'Deploy, index, reconcile and exercise failure paths with test wallets.',
              ],
              [
                '05',
                'Pilot',
                'Run a controlled issuer pilot with production controls and human oversight.',
              ],
              [
                '06',
                'Mainnet',
                'Deploy behind explicit opt-in, monitoring and rollback procedures.',
              ],
            ].map(([index, title, text]) => (
              <div key={index}>
                <span className="ar-mono">{index}</span>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div className="w-docs-actions">
            <ButtonLink href="/protocol" variant="secondary">
              Protocol reference <ArrowUpRight size={13} />
            </ButtonLink>
            <ButtonLink href="/compliance" variant="secondary">
              Compliance model <ArrowUpRight size={13} />
            </ButtonLink>
            <ButtonLink href="/roadmap" variant="ghost">
              Delivery gates <ArrowUpRight size={13} />
            </ButtonLink>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
