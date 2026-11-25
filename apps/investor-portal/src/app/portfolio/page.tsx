import type { Metadata } from 'next';
import { ArrowUpRight, Info, Layers3, ShieldCheck } from 'lucide-react';
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

export const metadata: Metadata = { title: 'Portfolio' };

export default function PortfolioPage() {
  const investor = demoSnapshot.investor;
  const totalCost = investor.holdings.reduce((sum, item) => sum + item.averageCost.amount, 0);
  const totalValue = investor.holdings.reduce((sum, item) => sum + item.currentValue.amount, 0);
  const totalIncome = investor.holdings.reduce((sum, item) => sum + item.incomeToDate.amount, 0);

  const columns: Column<Holding>[] = [
    {
      key: 'asset',
      header: 'Structure',
      render: (holding) => {
        const asset = getDemoAssetById(holding.assetId);
        return (
          <div className="i-holdings__asset">
            <span>
              <strong>{asset?.name ?? holding.assetId}</strong>
              <small>
                {asset?.registryId} · {asset?.tokenization.tokenSymbol}
              </small>
            </span>
          </div>
        );
      },
    },
    {
      key: 'units',
      header: 'Units',
      align: 'right',
      render: (holding) => formatUnits(holding.units),
    },
    {
      key: 'cost',
      header: 'Average cost',
      align: 'right',
      render: (holding) => formatMoney(holding.averageCost),
    },
    {
      key: 'value',
      header: 'Reference value',
      align: 'right',
      render: (holding) => formatMoney(holding.currentValue),
    },
    {
      key: 'income',
      header: 'Income',
      align: 'right',
      render: (holding) => formatMoney(holding.incomeToDate),
    },
    {
      key: 'next',
      header: 'Next pay date',
      align: 'right',
      render: (holding) => <span className="ar-mono">{holding.nextDistributionDate}</span>,
    },
  ];

  return (
    <PortalFrame
      title="Portfolio"
      subtitle="Illustrative positions and reference marks across the aerospace verticals."
      actions={
        <ButtonLink href="/opportunities" variant="secondary" size="sm">
          Add exposure
        </ButtonLink>
      }
    >
      <div className="p-page">
        <div className="ar-kpis">
          <div className="ar-kpi">
            <span className="ar-kpi__label">Reference value</span>
            <span className="ar-kpi__value">
              {formatMoney({ amount: totalValue, currency: 'USD' })}
            </span>
            <span className="ar-kpi__detail">Synthetic marks · 2026-11-18</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">Cost basis</span>
            <span className="ar-kpi__value">
              {formatMoney({ amount: totalCost, currency: 'USD' })}
            </span>
            <span className="ar-kpi__detail">Illustrative subscription cost</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">Income to date</span>
            <span className="ar-kpi__value">
              {formatMoney({ amount: totalIncome, currency: 'USD' })}
            </span>
            <span className="ar-kpi__detail is-positive">Synthetic only</span>
          </div>
          <div className="ar-kpi">
            <span className="ar-kpi__label">Positions</span>
            <span className="ar-kpi__value">{investor.holdings.length}</span>
            <span className="ar-kpi__detail">Across three verticals</span>
          </div>
        </div>

        <section className="p-card p-card--flush">
          <div className="p-card__head" style={{ padding: '18px 20px 0' }}>
            <div>
              <h3>Position register</h3>
              <p>Each row links a token position to an illustrative asset record.</p>
            </div>
            <Badge tone="amber">Demo data</Badge>
          </div>
          <DataTable
            columns={columns}
            rows={investor.holdings}
            getKey={(row) => row.assetId}
            caption="Illustrative investor holdings"
          />
        </section>

        <div className="p-split">
          <section className="p-card">
            <div className="p-card__head">
              <div>
                <h3>Exposure by vertical</h3>
                <p>Reference value allocation</p>
              </div>
              <Layers3 size={15} style={{ color: 'var(--ar-cyan)' }} />
            </div>
            <DonutChart
              data={[
                {
                  label: 'Aviation',
                  value: investor.holdings
                    .filter((holding) => getDemoAssetById(holding.assetId)?.vertical === 'aviation')
                    .reduce((sum, holding) => sum + holding.currentValue.amount, 0),
                  color: '#2f7bff',
                },
                {
                  label: 'Space',
                  value: investor.holdings
                    .filter((holding) => getDemoAssetById(holding.assetId)?.vertical === 'space')
                    .reduce((sum, holding) => sum + holding.currentValue.amount, 0),
                  color: '#5fd5ff',
                },
                {
                  label: 'Manufacturing',
                  value: investor.holdings
                    .filter(
                      (holding) => getDemoAssetById(holding.assetId)?.vertical === 'manufacturing',
                    )
                    .reduce((sum, holding) => sum + holding.currentValue.amount, 0),
                  color: '#9bb4d6',
                },
              ]}
              centerValue={`${investor.holdings.length}`}
              centerLabel="POSITIONS"
            />
          </section>

          <section className="p-card">
            <div className="p-card__head">
              <div>
                <h3>Concentration controls</h3>
                <p>Design-target limits, not live policy</p>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <ProgressBar value={35} label="Largest single structure" tone="blue" />
              <ProgressBar value={58} label="Aviation exposure" tone="blue" />
              <ProgressBar value={22} label="Illiquid holdings" tone="amber" />
            </div>
            <div className="p-callout" style={{ marginTop: 18 }}>
              <Info size={13} />
              <span>
                Concentration limits shown here are illustrative design targets. A production
                offering would define them in the investor agreement and suitability policy.
              </span>
            </div>
          </section>
        </div>

        <section className="p-card">
          <div className="p-card__head">
            <div>
              <h3>Income history</h3>
              <p>Twelve synthetic distribution periods · USDC-equivalent reference values</p>
            </div>
            <Badge tone="green" dot>
              Reconciled (demo)
            </Badge>
          </div>
          <Sparkline
            values={[610, 640, 660, 655, 700, 720, 715, 760, 790, 810, 840, 915]}
            width={760}
            height={90}
            stroke="var(--ar-cyan)"
          />
          <div className="p-chart-labels">
            <span>DEC 2025</span>
            <span>MAR 2026</span>
            <span>JUN 2026</span>
            <span>SEP 2026</span>
            <span>NOV 2026</span>
          </div>
          <div className="p-callout" style={{ marginTop: 16 }}>
            <ShieldCheck size={13} />
            <span>
              Historical values are generated for interface testing. They do not describe the
              performance of any real asset or offering.
            </span>
          </div>
        </section>

        <div className="p-actions">
          <ButtonLink href="/distributions">Open distributions</ButtonLink>
          <ButtonLink href="http://localhost:3000/marketplace" variant="secondary">
            Public marketplace <ArrowUpRight size={12} />
          </ButtonLink>
        </div>
      </div>
    </PortalFrame>
  );
}
