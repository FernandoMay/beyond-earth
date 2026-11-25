import { describe, expect, it, vi } from 'vitest';
import {
  NotificationService,
  NotificationTemplateError,
  renderTemplate,
  type NotificationMessage,
} from '../src/index';

describe('renderTemplate', () => {
  it('renders required variables into subject and body', () => {
    const rendered = renderTemplate('compliance.action_required', {
      recipientName: 'Demo Reviewer',
      caseId: 'case_001',
      requestedItem: 'Beneficial ownership chart',
      deadline: '2026-06-15',
    });

    expect(rendered.subject).toContain('case_001');
    expect(rendered.body).toContain('Beneficial ownership chart');
    expect(rendered.body).toContain('2026-06-15');
    expect(rendered.body).not.toContain('{{');
  });

  it('throws on missing variables', () => {
    expect(() =>
      renderTemplate('distribution.published', {
        recipientName: 'Investor',
        distributionId: 'dist_1',
      }),
    ).toThrow(NotificationTemplateError);
  });

  it('throws on empty variables', () => {
    expect(() =>
      renderTemplate('lease.payment_overdue', {
        recipientName: ' ',
        leaseId: 'lease_1',
        dueDate: '2026-06-01',
        amount: 100,
        currency: 'USDC',
      }),
    ).toThrow(/recipientName/);
  });

  it('throws on unknown templates', () => {
    expect(() => renderTemplate('does.not.exist', {})).toThrow(/Unknown notification template/);
  });
});

describe('NotificationService', () => {
  function setup() {
    const sent: NotificationMessage[] = [];
    const transport = {
      send: vi.fn(async (message: NotificationMessage) => {
        sent.push(message);
      }),
    };
    const service = new NotificationService({ transport, environment: 'demo' });
    return { service, transport, sent };
  }

  const input = {
    idempotencyKey: 'notify-demo-0001',
    templateId: 'subscription.demo_blocked' as const,
    to: 'reviewer@example.com',
    data: { recipientName: 'Reviewer', assetName: 'Reference Turbofan Engine Lease' },
  };

  it('sends a labelled demo notification', async () => {
    const { service, sent } = setup();
    const result = await service.send(input);

    expect(result.status).toBe('sent');
    expect(sent).toHaveLength(1);
    expect(sent[0]?.environment).toBe('demo');
    expect(sent[0]?.body).toContain('DEMO ENVIRONMENT');
    expect(sent[0]?.body).toContain('No funds were moved');
  });

  it('suppresses duplicate delivery for the same idempotency key', async () => {
    const { service, transport } = setup();
    await service.send(input);
    const replay = await service.send({ ...input, data: { ...input.data } });

    expect(replay.status).toBe('duplicate');
    expect(transport.send).toHaveBeenCalledTimes(1);
    expect(service.getDeliveredCount()).toBe(1);
  });

  it('labels testnet and mainnet messages distinctly', async () => {
    const testnet = new NotificationService({
      transport: { send: vi.fn(async () => undefined) },
      environment: 'testnet',
    });
    const testnetResult = await testnet.send(input);
    expect(testnetResult.message.body).toContain('STELLAR TESTNET');
    expect(testnetResult.message.body).not.toContain('DEMO ENVIRONMENT');

    const mainnet = new NotificationService({
      transport: { send: vi.fn(async () => undefined) },
      environment: 'mainnet',
    });
    const mainnetResult = await mainnet.send(input);
    expect(mainnetResult.message.body).toContain('production notification');
  });

  it('rejects invalid recipients and weak idempotency keys', async () => {
    const { service } = setup();
    await expect(service.send({ ...input, to: 'not-an-email' })).rejects.toThrow(/valid email/);
    await expect(service.send({ ...input, idempotencyKey: 'short' })).rejects.toThrow(
      /at least 8/,
    );
  });

  it('does not record a message when the transport fails', async () => {
    const service = new NotificationService({
      transport: {
        send: async () => {
          throw new Error('smtp unavailable');
        },
      },
      environment: 'demo',
    });

    await expect(service.send(input)).rejects.toThrow(/smtp unavailable/);
    expect(service.getDeliveredCount()).toBe(0);
  });
});
