import { valuationInputSchema, type ValuationInput } from '@aerospace/validation';
import { z } from 'zod';

export const valuationRequestSchema = valuationInputSchema.extend({
  currency: z.enum(['USD', 'USDC', 'EUR']).default('USD'),
  growthRatePct: z.number().finite().min(-50).max(50).default(0),
});

export type ValuationRequest = z.input<typeof valuationRequestSchema>;

export interface ValuationBreakdown {
  presentValueCashFlows: number;
  presentValueTerminal: number;
  grossValue: number;
  maintenanceHaircut: number;
  liquidityHaircut: number;
  netValue: number;
}

export interface ValuationResult {
  assetId: string;
  currency: 'USD' | 'USDC' | 'EUR';
  asOf: string;
  methodology: string;
  breakdown: ValuationBreakdown;
  assumptions: {
    annualCashFlow: number;
    growthRatePct: number;
    discountRatePct: number;
    years: number;
    terminalValue: number;
    maintenanceHaircutPct: number;
    liquidityHaircutPct: number;
  };
  warnings: string[];
  /** Reference-engine output is illustrative until a signed appraisal is attached. */
  illustrative: true;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Discounted cash-flow reference engine.
 *
 * This is a transparent, testable methodology for the platform's valuation
 * service, not a substitute for an independent aerospace appraisal. Every result
 * is marked illustrative and carries the exact assumptions used.
 */
export function valueAsset(input: ValuationRequest): ValuationResult {
  const parsed = valuationRequestSchema.parse(input);
  const discountRate = parsed.discountRatePct / 100;
  if (discountRate >= 1) {
    throw new Error('Discount rate must be below 100%.');
  }
  const growthRate = parsed.growthRatePct / 100;
  const warnings: string[] = [];

  let presentValueCashFlows = 0;
  for (let year = 1; year <= parsed.years; year += 1) {
    const cashFlow = parsed.annualCashFlow * (1 + growthRate) ** (year - 1);
    presentValueCashFlows += cashFlow / (1 + discountRate) ** year;
  }

  const presentValueTerminal =
    parsed.terminalValue > 0 ? parsed.terminalValue / (1 + discountRate) ** parsed.years : 0;

  const grossValue = presentValueCashFlows + presentValueTerminal;
  const maintenanceHaircut = grossValue * (parsed.maintenanceHaircutPct / 100);
  const afterMaintenance = grossValue - maintenanceHaircut;
  const liquidityHaircut = afterMaintenance * (parsed.liquidityHaircutPct / 100);
  const netValue = afterMaintenance - liquidityHaircut;

  if (parsed.terminalValue > parsed.annualCashFlow * parsed.years * 2) {
    warnings.push('Terminal value is large relative to the modelled operating cash flows.');
  }
  if (parsed.maintenanceHaircutPct + parsed.liquidityHaircutPct > 40) {
    warnings.push('Combined haircuts exceed 40% of gross value; review the assumptions.');
  }
  if (parsed.years > 20) {
    warnings.push('Projection exceeds 20 years; long-dated assumptions materially affect value.');
  }
  if (parsed.discountRatePct < 3) {
    warnings.push('Discount rate is below 3%; confirm the rate reflects asset and liquidity risk.');
  }

  return {
    assetId: parsed.assetId,
    currency: parsed.currency,
    asOf: parsed.asOf.toISOString(),
    methodology: parsed.methodology,
    breakdown: {
      presentValueCashFlows: roundMoney(presentValueCashFlows),
      presentValueTerminal: roundMoney(presentValueTerminal),
      grossValue: roundMoney(grossValue),
      maintenanceHaircut: roundMoney(maintenanceHaircut),
      liquidityHaircut: roundMoney(liquidityHaircut),
      netValue: roundMoney(netValue),
    },
    assumptions: {
      annualCashFlow: parsed.annualCashFlow,
      growthRatePct: parsed.growthRatePct,
      discountRatePct: parsed.discountRatePct,
      years: parsed.years,
      terminalValue: parsed.terminalValue,
      maintenanceHaircutPct: parsed.maintenanceHaircutPct,
      liquidityHaircutPct: parsed.liquidityHaircutPct,
    },
    warnings,
    illustrative: true,
  };
}
