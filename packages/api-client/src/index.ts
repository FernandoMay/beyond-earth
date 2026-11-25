import {
  demoSnapshot,
  getDemoAsset,
  type AerospaceSnapshot,
  type Asset,
  type AssetStatus,
  type ComplianceCase,
  type Distribution,
  type InvestorProfile,
  type OperationsTask,
  type Vertical,
} from '@aerospace/shared-types';
import type { AssetQuery } from '@aerospace/validation';

export interface SubscriptionRequest {
  offeringId: string;
  wallet: string;
  amount: { amount: number; currency: 'USD' | 'USDC' | 'EUR' };
  acknowledgement: true;
  idempotencyKey?: string;
}

export type SubscriptionResult =
  | {
      mode: 'demo';
      accepted: false;
      code: 'DEMO_MODE';
      message: string;
    }
  | {
      mode: 'live';
      accepted: true;
      subscriptionId: string;
      status: 'pending_escrow';
      transactionXdr?: string;
    };

export interface ApiClientOptions {
  baseUrl?: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

export interface AerospaceApi {
  readonly mode: 'demo' | 'live';
  getSnapshot(): Promise<AerospaceSnapshot>;
  listAssets(query?: Partial<AssetQuery>): Promise<{ items: Asset[]; total: number }>;
  getAsset(idOrSlug: string): Promise<Asset | null>;
  getInvestor(): Promise<InvestorProfile>;
  getDistributions(): Promise<Distribution[]>;
  getComplianceCases(): Promise<ComplianceCase[]>;
  getOperationsTasks(): Promise<OperationsTask[]>;
  subscribe(input: SubscriptionRequest): Promise<SubscriptionResult>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function filterAssets(
  assets: Asset[],
  query: Partial<AssetQuery> = {},
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
  const offset = query.offset ?? 0;
  const limit = query.limit ?? 24;
  return { items: filtered.slice(offset, offset + limit), total: filtered.length };
}

export class DemoApi implements AerospaceApi {
  readonly mode = 'demo' as const;

  async getSnapshot(): Promise<AerospaceSnapshot> {
    return demoSnapshot;
  }

  async listAssets(query: Partial<AssetQuery> = {}): Promise<{ items: Asset[]; total: number }> {
    return filterAssets(demoSnapshot.assets, query);
  }

  async getAsset(idOrSlug: string): Promise<Asset | null> {
    return getDemoAsset(idOrSlug) ?? null;
  }

  async getInvestor(): Promise<InvestorProfile> {
    return demoSnapshot.investor;
  }

  async getDistributions(): Promise<Distribution[]> {
    return demoSnapshot.distributions;
  }

  async getComplianceCases(): Promise<ComplianceCase[]> {
    return demoSnapshot.compliance;
  }

  async getOperationsTasks(): Promise<OperationsTask[]> {
    return demoSnapshot.tasks;
  }

  async subscribe(_input: SubscriptionRequest): Promise<SubscriptionResult> {
    void _input;
    return {
      mode: 'demo',
      accepted: false,
      code: 'DEMO_MODE',
      message:
        'Demo mode does not accept subscriptions or sign transactions. Configure the API and a Testnet wallet to exercise the flow.',
    };
  }
}

interface LiveClientOptions {
  baseUrl: string;
  apiKey?: string;
  fetchImpl: typeof fetch;
}

export class LiveApi implements AerospaceApi {
  readonly mode = 'live' as const;

  constructor(private readonly options: LiveClientOptions) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set('accept', 'application/json');
    if (init?.body) headers.set('content-type', 'application/json');
    if (this.options.apiKey) headers.set('x-api-key', this.options.apiKey);

    const response = await this.options.fetchImpl(`${this.options.baseUrl}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { error?: string; code?: string }
        | null;
      throw new ApiError(
        body?.error ?? `API request failed with ${response.status}`,
        response.status,
        body?.code,
      );
    }
    return (await response.json()) as T;
  }

  getSnapshot(): Promise<AerospaceSnapshot> {
    return this.request('/v1/snapshot');
  }

  listAssets(query: Partial<AssetQuery> = {}): Promise<{ items: Asset[]; total: number }> {
    const params = new URLSearchParams();
    if (query.vertical) params.set('vertical', query.vertical);
    if (query.status) params.set('status', query.status);
    if (query.q) params.set('q', query.q);
    if (query.limit) params.set('limit', String(query.limit));
    if (query.offset) params.set('offset', String(query.offset));
    const suffix = params.size ? `?${params.toString()}` : '';
    return this.request(`/v1/assets${suffix}`);
  }

  async getAsset(idOrSlug: string): Promise<Asset | null> {
    try {
      return await this.request(`/v1/assets/${encodeURIComponent(idOrSlug)}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }

  getInvestor(): Promise<InvestorProfile> {
    return this.request('/v1/investor');
  }

  async getDistributions(): Promise<Distribution[]> {
    const result = await this.request<{ items: Distribution[] }>('/v1/distributions');
    return result.items;
  }

  async getComplianceCases(): Promise<ComplianceCase[]> {
    const result = await this.request<{ items: ComplianceCase[] }>('/v1/compliance/cases');
    return result.items;
  }

  async getOperationsTasks(): Promise<OperationsTask[]> {
    const result = await this.request<{ items: OperationsTask[] }>('/v1/operations/tasks');
    return result.items;
  }

  subscribe(input: SubscriptionRequest): Promise<SubscriptionResult> {
    return this.request('/v1/subscriptions', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: input.idempotencyKey ? { 'idempotency-key': input.idempotencyKey } : undefined,
    });
  }
}

export function createAerospaceApi(options: ApiClientOptions = {}): AerospaceApi {
  const baseUrl = options.baseUrl?.replace(/\/$/, '');
  if (!baseUrl) return new DemoApi();
  return new LiveApi({
    baseUrl,
    apiKey: options.apiKey,
    fetchImpl: options.fetchImpl ?? fetch,
  });
}

export function createBrowserApi(): AerospaceApi {
  return createAerospaceApi({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
  });
}

export function verticalLabel(vertical: Vertical): string {
  return {
    aviation: 'Aviation',
    space: 'Space',
    manufacturing: 'Manufacturing',
    drones: 'Drones',
    marketplace: 'Marketplace',
  }[vertical];
}

export function statusLabel(status: AssetStatus): string {
  return {
    draft: 'Draft',
    evidence_review: 'Evidence review',
    verified: 'Verified',
    tokenized: 'Tokenized',
    active: 'Active',
    suspended: 'Suspended',
    retired: 'Retired',
  }[status];
}
