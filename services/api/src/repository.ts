import type {
  Asset,
  ComplianceCase,
  Distribution,
  InvestorProfile,
  OperationsTask,
  AerospaceSnapshot,
} from '@aerospace/shared-types';
import { demoSnapshot } from '@aerospace/shared-types';
import type { AssetDraft, AssetQuery, ComplianceDecision } from '@aerospace/validation';

export interface SubscriptionRecord {
  id: string;
  offeringId: string;
  wallet: string;
  amount: { amount: number; currency: 'USD' | 'USDC' | 'EUR' };
  idempotencyKey: string;
  status: 'pending_escrow';
  createdAt: string;
  illustrative: true;
}

export interface AerospaceRepository {
  readonly kind: 'demo' | 'postgres';
  getSnapshot(): Promise<AerospaceSnapshot>;
  listAssets(query: AssetQuery): Promise<{ items: Asset[]; total: number }>;
  getAsset(idOrSlug: string): Promise<Asset | null>;
  getInvestor(): Promise<InvestorProfile>;
  listDistributions(): Promise<Distribution[]>;
  listComplianceCases(): Promise<ComplianceCase[]>;
  decideCompliance(decision: ComplianceDecision): Promise<ComplianceCase | null>;
  listOperationsTasks(): Promise<OperationsTask[]>;
  createAssetDraft(draft: AssetDraft & { actor: string }): Promise<Asset>;
  createSubscription(input: {
    offeringId: string;
    wallet: string;
    amount: { amount: number; currency: 'USD' | 'USDC' | 'EUR' };
    idempotencyKey: string;
  }): Promise<SubscriptionRecord>;
  findSubscriptionByIdempotencyKey(key: string): Promise<SubscriptionRecord | null>;
}

function filterAssets(
  assets: Asset[],
  query: AssetQuery,
): { items: Asset[]; total: number } {
  const text = query.q?.trim().toLowerCase();
  const filtered = assets.filter((asset) => {
    if (query.vertical && asset.vertical !== query.vertical) return false;
    if (query.status && asset.status !== query.status) return false;
    if (
      text &&
      ![asset.name, asset.summary, asset.registryId, asset.operator, asset.tokenSymbol]
        .join(' ')
        .toLowerCase()
        .includes(text)
    ) {
      return false;
    }
    return true;
  });
  return {
    items: filtered.slice(query.offset, query.offset + query.limit),
    total: filtered.length,
  };
}

export function buildDraftAsset(
  draft: AssetDraft & { actor: string },
  sequence: number,
): Asset {
  const now = new Date().toISOString().slice(0, 10);
  const id = `ast_demo_${String(sequence).padStart(3, '0')}`;
  return {
    id,
    slug: draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    registryId: `DEMO-DRAFT-${String(sequence).padStart(4, '0')}`,
    name: draft.name,
    shortName: draft.shortName ?? draft.name,
    vertical: draft.vertical,
    category: draft.category,
    status: 'draft',
    jurisdiction: draft.jurisdiction,
    operator: draft.operator,
    ownerEntity: draft.ownerEntity,
    summary: draft.summary,
    description: draft.summary,
    tokenSymbol: 'DRAFT',
    highlights: ['Draft record created through the reference API'],
    specifications: [],
    valuation: {
      value: draft.valuation,
      asOf: now,
      method: 'Issuer-provided illustrative value',
      provider: 'Issuer draft',
      confidence: 'low',
      illustrative: true,
    },
    financials: {},
    tokenization: {
      structure: 'Not yet defined',
      tokenRights: [],
      transferRestrictions: ['Draft record only'],
      totalUnits: 0,
      availableUnits: 0,
      unitPrice: draft.valuation,
      tokenSymbol: 'DRAFT',
      decimals: 7,
      contractState: 'not_deployed',
    },
    documents: draft.documentDigests.map((digest, index) => ({
      id: `doc_draft_${index + 1}`,
      name: `Issuer evidence ${index + 1}`,
      kind: 'legal',
      digest,
      version: 'v1-draft',
      addedAt: now,
      verified: false,
      illustrative: true,
    })),
    risks: [],
    milestones: [
      {
        id: 'ms_draft',
        label: 'Draft created',
        date: now,
        status: 'current',
        note: 'Evidence and legal review required before verification.',
      },
    ],
    evidenceCompleteness: 20,
    lastVerifiedAt: now,
    illustrative: true,
  };
}

/**
 * In-memory repository used for local demo mode and tests.
 * Deterministic demo data is cloned so writes cannot mutate the shared dataset.
 */
export class InMemoryRepository implements AerospaceRepository {
  readonly kind = 'demo' as const;

  private readonly assets: Asset[];
  private readonly compliance: ComplianceCase[];
  private readonly subscriptions = new Map<string, SubscriptionRecord>();

  constructor(snapshot: AerospaceSnapshot = structuredClone(demoSnapshot)) {
    this.assets = snapshot.assets;
    this.compliance = snapshot.compliance;
  }

  async getSnapshot(): Promise<AerospaceSnapshot> {
    return {
      ...structuredClone(demoSnapshot),
      assets: this.assets,
      compliance: this.compliance,
    };
  }

  async listAssets(query: AssetQuery) {
    return filterAssets(this.assets, query);
  }

  async getAsset(idOrSlug: string) {
    return (
      this.assets.find((asset) => asset.id === idOrSlug || asset.slug === idOrSlug) ?? null
    );
  }

  async getInvestor() {
    return demoSnapshot.investor;
  }

  async listDistributions() {
    return demoSnapshot.distributions;
  }

  async listComplianceCases() {
    return this.compliance;
  }

  async decideCompliance(decision: ComplianceDecision) {
    const item = this.compliance.find((entry) => entry.id === decision.caseId);
    if (!item) return null;
    item.status =
      decision.decision === 'approve'
        ? 'verified'
        : decision.decision === 'reject'
          ? 'rejected'
          : 'pending';
    return item;
  }

  async listOperationsTasks() {
    return demoSnapshot.tasks;
  }

  async createAssetDraft(draft: AssetDraft & { actor: string }) {
    const asset = buildDraftAsset(draft, this.assets.length + 1);
    this.assets.push(asset);
    return asset;
  }

  async createSubscription(input: {
    offeringId: string;
    wallet: string;
    amount: { amount: number; currency: 'USD' | 'USDC' | 'EUR' };
    idempotencyKey: string;
  }) {
    const existing = this.subscriptions.get(input.idempotencyKey);
    if (existing) return existing;
    const record: SubscriptionRecord = {
      id: `sub_demo_${this.subscriptions.size + 1}`,
      offeringId: input.offeringId,
      wallet: input.wallet,
      amount: input.amount,
      idempotencyKey: input.idempotencyKey,
      status: 'pending_escrow',
      createdAt: new Date().toISOString(),
      illustrative: true,
    };
    this.subscriptions.set(input.idempotencyKey, record);
    return record;
  }

  async findSubscriptionByIdempotencyKey(key: string) {
    return this.subscriptions.get(key) ?? null;
  }
}
