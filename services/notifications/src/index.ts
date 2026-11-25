export type Environment = 'demo' | 'testnet' | 'mainnet';

export type TemplateId =
  | 'compliance.action_required'
  | 'distribution.published'
  | 'subscription.demo_blocked'
  | 'lease.payment_overdue';

export interface NotificationTemplate {
  id: TemplateId;
  subject: string;
  body: string;
}

const TEMPLATES: Record<TemplateId, NotificationTemplate> = {
  'compliance.action_required': {
    id: 'compliance.action_required',
    subject: 'Action required: compliance evidence for {{caseId}}',
    body: [
      'Hello {{recipientName}},',
      '',
      'Case {{caseId}} needs additional information before review can continue.',
      '',
      'Requested item: {{requestedItem}}',
      'Deadline: {{deadline}}',
      '',
      'Open the compliance workspace to respond. Do not send identity documents by email.',
    ].join('\n'),
  },
  'distribution.published': {
    id: 'distribution.published',
    subject: 'Distribution {{distributionId}} published for {{assetName}}',
    body: [
      'Hello {{recipientName}},',
      '',
      'A distribution has been published for {{assetName}}.',
      '',
      'Period: {{period}}',
      'Gross amount: {{grossAmount}} {{currency}}',
      'Payment date: {{paymentDate}}',
      '',
      'Claiming requires an eligible wallet and a signed transaction. Nothing is claimed automatically.',
    ].join('\n'),
  },
  'subscription.demo_blocked': {
    id: 'subscription.demo_blocked',
    subject: 'Demo mode: subscription not submitted',
    body: [
      'Hello {{recipientName}},',
      '',
      'Your subscription request for {{assetName}} was not submitted because this environment runs in demo mode.',
      'No funds were moved and no transaction was signed.',
      '',
      'This environment is for product evaluation only.',
    ].join('\n'),
  },
  'lease.payment_overdue': {
    id: 'lease.payment_overdue',
    subject: 'Lease payment overdue: {{leaseId}}',
    body: [
      'Hello {{recipientName}},',
      '',
      'Payment for lease {{leaseId}} was due on {{dueDate}} and has not been observed.',
      'Outstanding amount: {{amount}} {{currency}}',
      '',
      'Operations should confirm the payment status before any investor reporting is updated.',
    ].join('\n'),
  },
};

export class NotificationTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationTemplateError';
  }
}

export function renderTemplate(
  templateId: string,
  data: Record<string, string | number>,
): { subject: string; body: string } {
  const template = TEMPLATES[templateId as TemplateId];
  if (!template) {
    throw new NotificationTemplateError(`Unknown notification template: ${templateId}`);
  }
  const substitute = (text: string): string =>
    text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key: string) => {
      const value = data[key];
      if (value === undefined || String(value).trim() === '') {
        throw new NotificationTemplateError(`Missing template variable: ${key}`);
      }
      return String(value);
    });

  return { subject: substitute(template.subject), body: substitute(template.body) };
}

export interface NotificationMessage {
  to: string;
  subject: string;
  body: string;
  templateId: TemplateId;
  environment: Environment;
  metadata: Record<string, string>;
}

export interface NotificationTransport {
  send(message: NotificationMessage): Promise<void>;
}

export interface SendNotificationInput {
  idempotencyKey: string;
  templateId: TemplateId;
  to: string;
  data: Record<string, string | number>;
  metadata?: Record<string, string>;
}

export interface SendResult {
  status: 'sent' | 'duplicate';
  message: NotificationMessage;
}

const ENVIRONMENT_FOOTER: Record<Environment, string> = {
  demo: 'DEMO ENVIRONMENT: synthetic data only. No investment, asset or transaction is real.',
  testnet: 'STELLAR TESTNET: no mainnet funds are involved.',
  mainnet: 'Aerospace RWA production notification.',
};

export interface NotificationServiceOptions {
  transport: NotificationTransport;
  environment: Environment;
}

/**
 * Renders and delivers notifications with idempotent delivery keys and an
 * environment label on every message. Delivery is intentionally transport-neutral
 * so email, in-app inbox and webhook channels can share one audited pipeline.
 */
export class NotificationService {
  private readonly sent = new Map<string, NotificationMessage>();

  constructor(private readonly options: NotificationServiceOptions) {}

  async send(input: SendNotificationInput): Promise<SendResult> {
    if (!input.idempotencyKey || input.idempotencyKey.length < 8) {
      throw new Error('Notification idempotency key must be at least 8 characters.');
    }
    if (!isDeliverableAddress(input.to)) {
      throw new Error('Notification recipient is not a valid email address.');
    }
    const existing = this.sent.get(input.idempotencyKey);
    if (existing) return { status: 'duplicate', message: existing };

    const rendered = renderTemplate(input.templateId, input.data);
    const message: NotificationMessage = {
      to: input.to,
      subject: rendered.subject,
      body: `${rendered.body}\n\n${ENVIRONMENT_FOOTER[this.options.environment]}`,
      templateId: input.templateId,
      environment: this.options.environment,
      metadata: { ...input.metadata, idempotencyKey: input.idempotencyKey },
    };

    await this.options.transport.send(message);
    this.sent.set(input.idempotencyKey, message);
    return { status: 'sent', message };
  }

  getDeliveredCount(): number {
    return this.sent.size;
  }
}

function isDeliverableAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}
