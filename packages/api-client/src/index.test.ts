import { describe, expect, it } from 'vitest';
import { DemoApi, createAerospaceApi } from '../src';

describe('API client', () => {
  it('uses the demo adapter when no base URL is configured', () => {
    expect(createAerospaceApi().mode).toBe('demo');
  });

  it('filters assets by vertical and search text', async () => {
    const api = new DemoApi();
    const aviation = await api.listAssets({ vertical: 'aviation' });
    expect(aviation.items.length).toBeGreaterThan(0);
    expect(aviation.items.every((asset) => asset.vertical === 'aviation')).toBe(true);

    const search = await api.listAssets({ q: 'drone' });
    expect(search.items.some((asset) => asset.slug === 'cargo-drone-fleet')).toBe(true);
  });

  it('resolves assets by slug', async () => {
    const asset = await new DemoApi().getAsset('reference-turbofan-engine-lease');
    expect(asset?.registryId).toBe('DEMO-AV-0001');
  });

  it('never fabricates a subscription or transaction in demo mode', async () => {
    const result = await new DemoApi().subscribe({
      offeringId: 'off_eng_001',
      wallet: 'DEMO-WALLET-01',
      amount: { amount: 25_000, currency: 'USDC' },
      acknowledgement: true,
    });
    expect(result.mode).toBe('demo');
    expect(result.accepted).toBe(false);
    if (result.mode === 'demo') expect(result.code).toBe('DEMO_MODE');
    expect(JSON.stringify(result)).not.toContain('signed');
  });
});
