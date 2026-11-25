/**
 * Domain model for the Aerospace RWA reference implementation.
 *
 * These types intentionally separate:
 *  - the physical / contractual asset;
 *  - the legal structure that holds it;
 *  - the token that represents defined economic rights; and
 *  - the transaction and evidence records around both.
 *
 * A token is never assumed to be title to an asset.
 */

export type Vertical = 'aviation' | 'space' | 'manufacturing' | 'drones' | 'marketplace';

export type AssetCategory =
  | 'aircraft'
  | 'engine'
  | 'satellite'
  | 'orbital-infrastructure'
  | 'tooling'
  | 'component'
  | 'inventory'
  | 'drone-fleet'
  | 'service-contract';

export type AssetStatus =
  | 'draft'
  | 'evidence_review'
  | 'verified'
  | 'tokenized'
  | 'active'
  | 'suspended'
  | 'retired';

export type OfferingStatus = 'draft' | 'open' | 'closing_soon' | 'closed' | 'funded';

export type Currency = 'USD' | 'USDC' | 'EUR';

export interface Money {
  amount: number;
  currency: Currency;
}

export interface PercentageRange {
  min: number;
  max: number;
}

export interface AssetSpecification {
  label: string;
  value: string;
}

export type DocumentKind =
  | 'legal'
  | 'technical'
  | 'financial'
  | 'insurance'
  | 'inspection'
  | 'valuation';

export interface AssetDocument {
  id: string;
  name: string;
  kind: DocumentKind;
  /** SHA-256 digest of the exact evidence file in this repository. */
  digest: string;
  ipfsCid?: string;
  version: string;
  addedAt: string;
  verified: boolean;
  /** Demo evidence is synthetic and must never be represented as a production document. */
  illustrative: boolean;
}

export interface ValuationSnapshot {
  value: Money;
  asOf: string;
  method: string;
  provider: string;
  confidence: 'high' | 'medium' | 'low';
  illustrative: boolean;
}

export interface AssetFinancials {
  annualRent?: Money;
  targetDistribution?: PercentageRange;
  tenorMonths?: number;
  utilizationPct?: number;
  ltvPct?: number;
  reserveMonths?: number;
  distributionFrequency?: 'monthly' | 'quarterly' | 'semi-annual';
}

export type ContractState = 'not_deployed' | 'testnet' | 'mainnet';

export interface TokenizationModel {
  structure: string;
  tokenRights: string[];
  transferRestrictions: string[];
  totalUnits: number;
  availableUnits: number;
  unitPrice: Money;
  tokenSymbol: string;
  decimals: number;
  contractState: ContractState;
  /** Intentionally omitted in demo mode rather than filled with a fake address. */
  tokenContract?: string;
  complianceContract?: string;
}

export interface Offering {
  id: string;
  assetId: string;
  status: OfferingStatus;
  targetRaise: Money;
  committed: Money;
  minTicket: Money;
  opensAt: string;
  closesAt: string;
  investorCount: number;
  distributionFrequency: 'monthly' | 'quarterly' | 'semi-annual';
  eligibility: string;
  escrowNote: string;
  illustrative: true;
}

export type RiskSeverity = 'low' | 'medium' | 'high';

export interface RiskFactor {
  id: string;
  category: string;
  title: string;
  severity: RiskSeverity;
  summary: string;
  mitigation: string;
}

export interface AssetMilestone {
  id: string;
  label: string;
  date: string;
  status: 'complete' | 'current' | 'upcoming';
  note: string;
}

export interface Asset {
  id: string;
  slug: string;
  registryId: string;
  name: string;
  shortName: string;
  vertical: Vertical;
  category: AssetCategory;
  status: AssetStatus;
  jurisdiction: string;
  operator: string;
  ownerEntity: string;
  tokenSymbol: string;
  summary: string;
  description: string;
  highlights: string[];
  specifications: AssetSpecification[];
  valuation: ValuationSnapshot;
  financials: AssetFinancials;
  tokenization: TokenizationModel;
  offering?: Offering;
  documents: AssetDocument[];
  risks: RiskFactor[];
  milestones: AssetMilestone[];
  evidenceCompleteness: number;
  lastVerifiedAt: string;
  illustrative: true;
}

export interface Holding {
  assetId: string;
  units: number;
  averageCost: Money;
  currentValue: Money;
  incomeToDate: Money;
  nextDistributionDate: string;
  status: 'active' | 'settling' | 'pending';
  illustrative: true;
}

export type DistributionStatus = 'scheduled' | 'available' | 'paid' | 'reconciling';

export interface Distribution {
  id: string;
  assetId: string;
  epoch: string;
  recordDate: string;
  payDate: string;
  amount: Money;
  status: DistributionStatus;
  source: string;
  illustrative: true;
}

export interface InvestorProfile {
  id: string;
  displayName: string;
  walletLabel: string;
  jurisdiction: string;
  verification: 'verified' | 'pending' | 'expired' | 'not_started';
  verificationTier: number;
  verificationExpiresAt: string;
  portfolioValue: Money;
  totalDistributed: Money;
  availableCash: Money;
  holdings: Holding[];
  distributions: Distribution[];
  illustrative: true;
}

export type LeaseStatus = 'performing' | 'due_soon' | 'delinquent' | 'matured' | 'terminated';

export interface LeaseRecord {
  id: string;
  assetId: string;
  lessee: string;
  status: LeaseStatus;
  monthlyRent: Money;
  nextPaymentDate: string;
  maturityDate: string;
  paymentsMade: number;
  totalPayments: number;
  reserveMonths: number;
  illustrative: true;
}

export type MaintenanceStatus = 'current' | 'due_soon' | 'overdue' | 'scheduled';

export interface MaintenanceRecord {
  id: string;
  assetId: string;
  component: string;
  task: string;
  interval: string;
  lastCompleted: string;
  nextDue: string;
  status: MaintenanceStatus;
  provider: string;
  illustrative: true;
}

export interface InsurancePolicy {
  id: string;
  assetId: string;
  insurer: string;
  coverage: Money;
  deductible: Money;
  expiresAt: string;
  status: 'active' | 'expiring' | 'expired';
  illustrative: true;
}

export type ComplianceStatus = 'verified' | 'pending' | 'expired' | 'rejected';

export interface ComplianceCheck {
  label: string;
  state: 'pass' | 'pending' | 'fail';
  checkedAt: string;
}

export interface ComplianceCase {
  id: string;
  subject: string;
  type: 'investor' | 'issuer' | 'asset';
  jurisdiction: string;
  status: ComplianceStatus;
  risk: RiskSeverity;
  submittedAt: string;
  expiresAt: string;
  checks: ComplianceCheck[];
  illustrative: true;
}

export interface OperationsTask {
  id: string;
  assetId: string;
  type: 'lease' | 'maintenance' | 'insurance' | 'valuation' | 'inspection' | 'distribution';
  title: string;
  dueDate: string;
  owner: string;
  status: 'open' | 'in_progress' | 'blocked' | 'done';
  priority: RiskSeverity;
  illustrative: true;
}

export type ContractStatus = 'specified' | 'implemented' | 'tested' | 'deployed' | 'audited';

export interface ProtocolModule {
  id: string;
  name: string;
  description: string;
  responsibilities: string[];
  language: 'Rust / Soroban';
  status: ContractStatus;
  testCount: number;
  explorerUrl?: string;
}

export interface PlatformMetrics {
  assetsInRegistry: number;
  verifiedStructures: number;
  activeOfferings: number;
  illustrativeCapitalCommitted: Money;
  eligibleInvestors: number;
  pendingReviews: number;
  distributionsScheduled: Money;
  operationsDue: number;
}

export interface OracleSnapshot {
  id: string;
  assetId: string;
  provider: string;
  metric: string;
  value: string;
  observedAt: string;
  staleAfterHours: number;
  signed: boolean;
  illustrative: true;
}

export interface ActivityEvent {
  id: string;
  at: string;
  kind:
    | 'asset_registered'
    | 'evidence_verified'
    | 'offering_opened'
    | 'subscription_settled'
    | 'lease_paid'
    | 'distribution_claimed'
    | 'compliance_updated';
  title: string;
  detail: string;
  actor: string;
  severity: 'info' | 'success' | 'warning';
  illustrative: true;
}

export interface AerospaceSnapshot {
  assets: Asset[];
  investor: InvestorProfile;
  leases: LeaseRecord[];
  maintenance: MaintenanceRecord[];
  insurance: InsurancePolicy[];
  compliance: ComplianceCase[];
  tasks: OperationsTask[];
  distributions: Distribution[];
  oracles: OracleSnapshot[];
  activity: ActivityEvent[];
  metrics: PlatformMetrics;
  protocol: ProtocolModule[];
}

export const VERTICALS: ReadonlyArray<{
  id: Vertical;
  label: string;
  short: string;
  description: string;
}> = [
  {
    id: 'aviation',
    label: 'Aviation RWA',
    short: 'Aviation',
    description: 'Aircraft, engines, finance leases and fleet receivables.',
  },
  {
    id: 'space',
    label: 'Space RWA',
    short: 'Space',
    description: 'Satellites, orbital infrastructure and contracted service capacity.',
  },
  {
    id: 'manufacturing',
    label: 'Aerospace Manufacturing RWA',
    short: 'Manufacturing',
    description: 'Certified tooling, components, inventories and production orders.',
  },
  {
    id: 'drones',
    label: 'Drone RWA',
    short: 'Drones',
    description: 'Fleets, operational capacity and logistics service contracts.',
  },
  {
    id: 'marketplace',
    label: 'Aerospace Marketplace',
    short: 'Marketplace',
    description: 'A cross-vertical market for verified economic participation.',
  },
];

export const STATUS_LABELS: Record<AssetStatus, string> = {
  draft: 'Draft',
  evidence_review: 'Evidence review',
  verified: 'Verified',
  tokenized: 'Tokenized',
  active: 'Active',
  suspended: 'Suspended',
  retired: 'Retired',
};

export function formatMoney(money: Money, compact = false): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currency === 'USDC' ? 'USD' : money.currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(money.amount);

  return money.currency === 'USDC' ? `${formatted} USDC` : formatted;
}

export function formatUnits(units: number): string {
  return new Intl.NumberFormat('en-US').format(units);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}
