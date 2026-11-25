import type {
  Asset,
  AerospaceSnapshot,
  ComplianceCase,
  Distribution,
  InvestorProfile,
  OperationsTask,
} from '@aerospace/shared-types';
import type { AssetDraft, AssetQuery, ComplianceDecision } from '@aerospace/validation';
import { buildDraftAsset, type AerospaceRepository, type SubscriptionRecord } from './repository';

/**
 * Minimal query surface so the adapter can run against `pg`, a pool or a test double
 * without taking a hard runtime dependency on a driver.
 */
export interface SqlClient {
  query<T>(text: string, values?: unknown[]): Promise<{ rows: T[] }>;
}

interface PayloadRow<T> {
  payload: T;
}

function mapPayload<T>(rows: Array<PayloadRow<T>>): T[] {
  return rows.map((row) => row.payload);
}

/**
 * PostgreSQL-backed repository.
 *
 * The database stores authoritative operational records. Full domain payloads are
 * kept in JSONB alongside the indexed columns that queries actually filter on. The
 * migration in infrastructure/postgres defines the matching schema.
 */
export class PostgresRepository implements AerospaceRepository {
  readonly kind = 'postgres' as const;

  constructor(private readonly client: SqlClient) {}

  async getSnapshot(): Promise<AerospaceSnapshot> {
    const [assets, investor, distributions, compliance, tasks] = await Promise.all([
      this.listAssets({ limit: 100, offset: 0 }),
      this.getInvestor(),
      this.listDistributions(),
      this.listComplianceCases(),
      this.listOperationsTasks(),
    ]);
    const metrics = await this.client.query<PayloadRow<AerospaceSnapshot['metrics']>>(
      'select payload from platform_metrics where id = $1',
      ['current'],
    );
    if (!metrics.rows[0]) throw new Error('platform_metrics row "current" is missing');

    const sections = await this.client.query<{ id: string; payload: unknown }>(
      'select id, payload from platform_sections where id = any($1::text[])',
      [['leases', 'maintenance', 'insurance', 'oracles', 'activity', 'protocol']],
    );
    const section = <T>(id: string): T[] => {
      const row = sections.rows.find((entry) => entry.id === id);
      return (row?.payload as T[] | undefined) ?? [];
    };

    return {
      assets: assets.items,
      investor,
      distributions,
      compliance,
      tasks,
      metrics: metrics.rows[0].payload,
      leases: section<AerospaceSnapshot['leases'][number]>('leases'),
      maintenance: section<AerospaceSnapshot['maintenance'][number]>('maintenance'),
      insurance: section<AerospaceSnapshot['insurance'][number]>('insurance'),
      oracles: section<AerospaceSnapshot['oracles'][number]>('oracles'),
      activity: section<AerospaceSnapshot['activity'][number]>('activity'),
      protocol: section<AerospaceSnapshot['protocol'][number]>('protocol'),
    };
  }

  async listAssets(query: AssetQuery): Promise<{ items: Asset[]; total: number }> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (query.vertical) {
      values.push(query.vertical);
      conditions.push(`vertical = $${values.length}`);
    }
    if (query.status) {
      values.push(query.status);
      conditions.push(`status = $${values.length}`);
    }
    if (query.q) {
      values.push(`%${query.q}%`);
      conditions.push(
        `(payload->>'name' ilike $${values.length} or payload->>'summary' ilike $${values.length}
          or registry_id ilike $${values.length} or payload->>'operator' ilike $${values.length})`,
      );
    }
    const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';
    values.push(query.limit, query.offset);
    const rows = await this.client.query<PayloadRow<Asset>>(
      `select payload from assets ${where} order by updated_at desc limit $${values.length - 1} offset $${values.length}`,
      values,
    );
    const count = await this.client.query<{ count: string }>(
      `select count(*)::text as count from assets ${where}`,
      values.slice(0, -2),
    );
    return { items: mapPayload(rows.rows), total: Number(count.rows[0]?.count ?? 0) };
  }

  async getAsset(idOrSlug: string): Promise<Asset | null> {
    const result = await this.client.query<PayloadRow<Asset>>(
      'select payload from assets where id = $1 or slug = $1 limit 1',
      [idOrSlug],
    );
    return result.rows[0]?.payload ?? null;
  }

  async getInvestor(): Promise<InvestorProfile> {
    const result = await this.client.query<PayloadRow<InvestorProfile>>(
      'select payload from investors order by created_at asc limit 1',
    );
    if (!result.rows[0]) throw new Error('No investor record present');
    return result.rows[0].payload;
  }

  async listDistributions(): Promise<Distribution[]> {
    const result = await this.client.query<PayloadRow<Distribution>>(
      'select payload from distributions order by pay_date asc',
    );
    return mapPayload(result.rows);
  }

  async listComplianceCases(): Promise<ComplianceCase[]> {
    const result = await this.client.query<PayloadRow<ComplianceCase>>(
      'select payload from compliance_cases order by submitted_at asc',
    );
    return mapPayload(result.rows);
  }

  async decideCompliance(decision: ComplianceDecision): Promise<ComplianceCase | null> {
    const current = await this.client.query<PayloadRow<ComplianceCase>>(
      'select payload from compliance_cases where id = $1 for update',
      [decision.caseId],
    );
    const record = current.rows[0]?.payload;
    if (!record) return null;
    record.status =
      decision.decision === 'approve'
        ? 'verified'
        : decision.decision === 'reject'
          ? 'rejected'
          : 'pending';
    await this.client.query(
      'update compliance_cases set status = $2, payload = $3, updated_at = now() where id = $1',
      [decision.caseId, record.status, record],
    );
    return record;
  }

  async listOperationsTasks(): Promise<OperationsTask[]> {
    const result = await this.client.query<PayloadRow<OperationsTask>>(
      'select payload from operations_tasks order by due_date asc',
    );
    return mapPayload(result.rows);
  }

  async createAssetDraft(draft: AssetDraft & { actor: string }): Promise<Asset> {
    const count = await this.client.query<{ count: string }>(
      'select count(*)::text as count from assets',
    );
    const asset = buildDraftAsset(draft, Number(count.rows[0]?.count ?? 0) + 1);
    await this.client.query(
      `insert into assets (id, slug, registry_id, vertical, status, payload, updated_at)
       values ($1, $2, $3, $4, $5, $6, now())`,
      [asset.id, asset.slug, asset.registryId, asset.vertical, asset.status, asset],
    );
    return asset;
  }

  async createSubscription(input: {
    offeringId: string;
    wallet: string;
    amount: { amount: number; currency: 'USD' | 'USDC' | 'EUR' };
    idempotencyKey: string;
  }): Promise<SubscriptionRecord> {
    const existing = await this.findSubscriptionByIdempotencyKey(input.idempotencyKey);
    if (existing) return existing;
    const result = await this.client.query<{
      id: string;
      offering_id: string;
      wallet: string;
      amount: SubscriptionRecord['amount'];
      idempotency_key: string;
      status: SubscriptionRecord['status'];
      created_at: string;
    }>(
      `insert into subscriptions (idempotency_key, offering_id, wallet, amount, status)
       values ($1, $2, $3, $4, $5)
       on conflict (idempotency_key) do update set idempotency_key = excluded.idempotency_key
       returning id, offering_id, wallet, amount, idempotency_key, status, created_at`,
      [input.idempotencyKey, input.offeringId, input.wallet, input.amount, 'pending_escrow'],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Subscription insert returned no row');
    return {
      id: row.id,
      offeringId: row.offering_id,
      wallet: row.wallet,
      amount: row.amount,
      idempotencyKey: row.idempotency_key,
      status: row.status,
      createdAt: row.created_at,
      illustrative: true,
    };
  }

  async findSubscriptionByIdempotencyKey(key: string): Promise<SubscriptionRecord | null> {
    const result = await this.client.query<{
      id: string;
      offering_id: string;
      wallet: string;
      amount: SubscriptionRecord['amount'];
      idempotency_key: string;
      status: SubscriptionRecord['status'];
      created_at: string;
    }>('select * from subscriptions where idempotency_key = $1 limit 1', [key]);
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      offeringId: row.offering_id,
      wallet: row.wallet,
      amount: row.amount,
      idempotencyKey: row.idempotency_key,
      status: row.status,
      createdAt: row.created_at,
      illustrative: true,
    };
  }
}
