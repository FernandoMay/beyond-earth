import { expect, test } from '@playwright/test';

const API = 'http://localhost:4000';

test.describe('reference API', () => {
  test('health reports demo mode', async ({ request }) => {
    const response = await request.get(`${API}/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toMatchObject({
      status: 'ok',
      service: 'aerospace-rwa-api',
      mode: 'demo',
      repository: 'demo',
      network: 'testnet',
    });
  });

  test('snapshot contains only illustrative assets', async ({ request }) => {
    const response = await request.get(`${API}/v1/snapshot`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.assets.length).toBeGreaterThan(0);
    expect(body.assets.every((asset: { illustrative: boolean }) => asset.illustrative)).toBe(true);
  });

  test('demo subscriptions are refused without signing', async ({ request }) => {
    const response = await request.post(`${API}/v1/subscriptions`, {
      data: {
        offeringId: 'offering_demo_1',
        wallet: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        amount: { amount: 25_000, currency: 'USDC' },
        idempotencyKey: 'e2e-demo-0001',
        acknowledgement: true,
      },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toMatchObject({ mode: 'demo', accepted: false, code: 'DEMO_MODE' });
  });

  test('metrics endpoint exposes demo gauge', async ({ request }) => {
    const response = await request.get(`${API}/metrics`);
    expect(response.ok()).toBeTruthy();
    expect(await response.text()).toContain('aerospace_api_demo_mode 1');
  });
});
