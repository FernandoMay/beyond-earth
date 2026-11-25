import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  CircleCheck,
  Clock3,
  Landmark,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import {
  Badge,
  ButtonLink,
  DataTable,
  DonutChart,
  ProgressBar,
  Sparkline,
  type Column,
} from '@aerospace/design-system';
import {
  demoSnapshot,
  formatMoney,
  formatUnits,
  getDemoAssetById,
  type Holding,
} from '@aerospace/shared-types';
import { PortalFrame } from '@/components/portal-frame';

export const metadata: Metadata = { title: 'Overview' };

const chartPoints = [32, 35, 34, 38, 41, 39, 44, 46, 45, 49, 52, 55];

export default function InvestorDashboard() {
  const investor = demoSnapshot.investor;
  const available = investor.distributions.filter((item) => item.status === 'available');
  const scheduled = investor.distributions.filter((item) => item.status === 'scheduled');

  const columns: Column<Holding>[] = [
    {
      key: 'asset',
      header: 'Holding',
      render: (holding) => {
        const asset = getDemoAssetById(holding.assetId);
        return (
          <div className="i-holdings__asset">
            <span>
              <strong>{asset?.shortName ?? holding.assetId}</strong>
              <small>{asset?.registryId ?? 'DEMO'} · {formatUnits(holding.units)} units</small>
            </span>
          </div>
        );
      },
    },
    {
      key: 'value',
      header: 'Current value',
      align: 'right',
      render: (holding) => formatMoney(holding.currentValue, true),
    },
    {
      key: 'cost',
      header: 'Cost basis',
      align: 'right',
      render: (holding) => formatMoney(holding.averageCost, true),
    },
    {
      key: 'income',
      header: 'Income to date',
      align: 'right',
      render: (holding) => formatMoney(holding.incomeToDate, true),
    },
    {
      key: 'next',
      header: 'Next distribution',
      align: 'right',
      render: (holding) => <span className="ar-mono">{holding.nextDistributionDate}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (holding) => (
        <Badge tone={holding.status === 'active' ? 'green' : 'amber'} dot>
          {holding.status}
        </Badge>
      ),
    },
  ];

  return (
    <PortalFrame
      title="Portfolio overview"
      subtitle="Illustrative positions, eligibility state and distribution schedule."
      actions={
        <ButtonLink href="/opportunities" size="sm">
          Explore structures <ArrowUpRight size={12} />
        </ButtonLink>
      }
    >
      <div className="p-page">
        <section className="i-hero">
          <div className="i-hero__copy">
            <span>INVESTOR · DEMO PROFILE</span>
            <h2>Your aerospace allocation, evidence and eligibility in one workspace.</h2>
            <p>
              This workspace shows synthetic holdings and distribution records for a demonstration
              investor. Nothing here is an offer, a valuation or a claim on a real asset.
            </p>
          </div>
          <div className="i-hero__status">
            <div>
              <span>Verification</span>
              <b>{investor.verification.toUpperCase()}</b>
            </div>
            <div>
              <span>Tier</span>
              <b>TIER {investor.verificationTier}</b>
            </div>
            <div>
              <span>Expires</span>
              <b>{investor.verificationExpiresAt}</b>
            </div>
            <div>
              <span>Jurisdiction</span>
              <b>ILLUSTRATIVE</b>
            </div>
          </div>
        </section>

        <section className="ar-kpis">
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Portfolio value <Wallet size={13} />
            </span>
            <span className="ar-kpi__value">{formatMoney(investor.portfolioValue)}</span>
            <span className="ar-kpi__detail is-positive">
              <ArrowUpRight size={11} /> Reference mark · illustrative
            </span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Income to date <Landmark size={13} />
            </span>
            <span className="ar-kpi__value">{formatMoney(investor.totalDistributed)}</span>
            <span className="ar-kpi__detail">Synthetic distributions only</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Available cash <CircleCheck size={13} />
            </span>
            <span className="ar-kpi__value">{formatMoney(investor.availableCash)}</span>
            <span className="ar-kpi__detail is-warning">Not connected to a wallet</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">
              Claimable <CalendarClock size={13} />
            </span>
            <span className="ar-kpi__value">
              {formatMoney({ amount: available.reduce((sum, item) => sum + item.amount.amount, 0), currency: 'USDC' })}
            </span>
            <span className="ar-kpi__detail">{available.length} available epoch</span>
          </div>
        </section>

        <div className="p-split">
          <div className="p-stack">
            <section className="p-card p-card--flush">
              <div className="p-card__head" style={{ padding: '18px 20px 0' }}>
                <div>
                  <h3>Holdings</h3>
                  <p>Four synthetic positions across aviation, space and manufacturing.</p>
                </div>
                <Link href="/portfolio" className="ar-text-link">
                  Full portfolio <ArrowUpRight size={11} />
                </Link>
              </div>
              <div className="p-table-wrap">
                <DataTable columns={columns} rows={investor.holdings} getKey={(row) => row.assetId} />
              </div>
            </section>

            <section className="p-card">
              <div className="p-card__head">
                <div>
                  <h3>Reference portfolio trajectory</h3>
                  <p>Illustrative marks · not a performance track record.</p>
                </div>
                <Badge tone="amber">Synthetic</Badge>
              </div>
              <Sparkline values={chartPoints} />
              <div className="p-chart-labels">
                <span>DEC 2025</span>
                <span>MAR 2026</span>
                <span>JUN 2026</span>
                <span>SEP 2026</span>
                <span>NOV 2026</span>
              </div>
            </section>
          </div>

          <div className="p-stack">
            <section className="p-card">
              <div className="p-card__head">
                <div>
                  <h3>Allocation</h3>
                  <p>By reference value</p>
                </div>
              </div>
              <DonutChart
                data={investor.holdings.map((holding, index) => ({
                  label: getDemoAssetById(holding.assetId)?.shortName ?? holding.assetId,
                  value: holding.currentValue.amount,
                  color: ['#2f7bff', '#5fd5ff', '#7d90aa', '#58d6a9'][index % 4]!,
                }))}
                centerValue={formatMoney(investor.portfolioValue, true)}
                centerLabel="DEMO VALUE"
              />
              <div className="i-alloc" style={{ marginTop: 16 }}>
                {investor.holdings.map((holding, index) => {
                  const pct = (holding.currentValue.amount / investor.portfolioValue.amount) * 100;
                  return (
                    <div className="i-alloc__row" key={holding.assetId}>
                      <span>{getDemoAssetById(holding.assetId)?.shortName}</span>
                      <div className="i-alloc__bar">
                        <i style={{ width: `${pct}%`, opacity: 1 - index * 0.14 }} />
                      </div>
                      <b>{pct.toFixed(1)}%</b>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="p-card">
              <div className="p-card__head">
                <div>
                  <h3>Eligibility</h3>
                  <p>Demo compliance record</p>
                </div>
                <Badge tone="green" dot>
                  Verified
                </Badge>
              </div>
              <div className="i-eligibility">
                {[
                  ['Identity verification', 'Synthetic KYC record · tier 2', true],
                  ['Jurisdiction', 'Illustrative jurisdiction approved', true],
                  ['Sanctions screening', 'Synthetic screening pass', true],
                  ['Source of funds', 'Annual review due 2027-06-30', false],
                ].map(([label, detail, done]) => (
                  <div className="i-eligibility__item" key={label as string}>
                    <span className={`i-eligibility__icon ${done ? '' : 'is-pending'}`}>
                      {done ? <BadgeCheck size={13} /> : <Clock3 size={13} />}
                    </span>
                    <div>
                      <strong>{label as string}</strong>
                      <p>{detail as string}</p>
                    </div>
                  </div>
                ))}
              </div>
              <ButtonLink href="/onboarding" variant="secondary" size="sm" style={{ marginTop: 14 }}>
                Review eligibility
              </ButtonLink>
            </section>
          </div>
        </div>

        <div className="p-split">
          <section className="p-card">
            <div className="p-card__head">
              <div>
                <h3>Distribution schedule</h3>
                <p>Record date, pay date and synthetic source.</p>
              </div>
              <Link href="/distributions" className="ar-text-link">
                All distributions <ArrowUpRight size={11} />
              </Link>
            </div>
            <div className="i-dist">
              {investor.distributions.slice(0, 4).map((distribution) => (
                <div className="i-dist__item" key={distribution.id}>
                  <div>
                    <strong>{getDemoAssetById(distribution.assetId)?.shortName}</strong>
                    <small>{distribution.epoch} · {distribution.source}</small>
                  </div>
                  <div className="i-dist__amount">{formatMoney(distribution.amount)}</div>
                  <div className="i-dist__meta">
                    <span>RECORD {distribution.recordDate}</span>
                    <span>·</span>
                    <span>PAY {distribution.payDate}</span>
                    <Badge tone={distribution.status === 'available' ? 'green' : 'neutral'}>
                      {distribution.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="p-card">
            <div className="p-card__head">
              <div>
                <h3>Protocol activity</h3>
                <p>Synthetic event feed</p>
              </div>
              <ShieldCheck size={15} style={{ color: 'var(--ar-cyan)' }} />
            </div>
            <div className="p-activity">
              {demoSnapshot.activity.slice(0, 6).map((event) => (
                <div className="p-activity__item" key={event.id}>
                  <span className={`p-activity__dot is-${event.severity}`} aria-hidden="true" />
                  <div className="p-activity__body">
                    <strong>{event.title}</strong>
                    <p>{event.detail}</p>
                  </div>
                  <span className="p-activity__time">{event.at.slice(5, 10)}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <ProgressBar
                value={investor.verification === 'verified' ? 100 : 40}
                label="Annual eligibility review"
                tone="green"
              />
            </div>
          </section>
        </div>

        <div className="p-callout">
          <ShieldCheck size={14} />
          <span>
            <strong>No production data.</strong> Holdings, cash balances and distributions are
            illustrative records for a demo investor. No wallet is connected, no USDC is held and no
            transaction has been signed. {scheduled.length} scheduled epochs are shown for design
            review only.
          </span>
        </div>
      </div>
    </PortalFrame>
  );
}
