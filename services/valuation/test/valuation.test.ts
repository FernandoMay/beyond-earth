import { describe, expect, it } from 'vitest';
import { valueAsset } from '../src/index';

const base = {
  assetId: 'ast_eng_001',
  annualCashFlow: 100,
  discountRatePct: 10,
  terminalValue: 100,
  years: 2,
  maintenanceHaircutPct: 5,
  liquidityHaircutPct: 2,
  methodology: 'Illustrative DCF for engine lease cash flows',
  asOf: new Date('2026-06-01T00:00:00Z'),
};

describe('valueAsset', () => {
  it('discounts cash flows and terminal value, then applies haircuts', () => {
    const result = valueAsset(base);

    expect(result.breakdown.presentValueCashFlows).toBeCloseTo(173.55, 2);
    expect(result.breakdown.presentValueTerminal).toBeCloseTo(82.64, 2);
    expect(result.breakdown.grossValue).toBeCloseTo(256.2, 2);
    expect(result.breakdown.maintenanceHaircut).toBeCloseTo(12.81, 2);
    expect(result.breakdown.liquidityHaircut).toBeCloseTo(4.87, 2);
    expect(result.breakdown.netValue).toBeCloseTo(238.52, 2);
    expect(result.illustrative).toBe(true);
    expect(result.currency).toBe('USD');
  });

  it('applies growth to later cash flows', () => {
    const flat = valueAsset(base);
    const growing = valueAsset({ ...base, growthRatePct: 10, terminalValue: 0 });

    expect(growing.breakdown.presentValueCashFlows).toBeCloseTo(181.82, 2);
    expect(growing.breakdown.presentValueCashFlows).toBeGreaterThan(
      flat.breakdown.presentValueCashFlows,
    );
  });

  it('uses zero terminal value when none is supplied', () => {
    const result = valueAsset({ ...base, terminalValue: 0 });
    expect(result.breakdown.presentValueTerminal).toBe(0);
    expect(result.breakdown.grossValue).toBeCloseTo(173.55, 2);
  });

  it('rounds money to cents', () => {
    const result = valueAsset({ ...base, annualCashFlow: 123.456789 });
    for (const value of Object.values(result.breakdown)) {
      expect(Number.isInteger(Math.round(value * 100))).toBe(true);
      expect(value).toBe(Math.round(value * 100) / 100);
    }
  });

  it('warns about aggressive assumptions', () => {
    const result = valueAsset({
      ...base,
      years: 25,
      discountRatePct: 2,
      maintenanceHaircutPct: 30,
      liquidityHaircutPct: 20,
      terminalValue: 100_000,
    });
    expect(result.warnings.length).toBeGreaterThanOrEqual(4);
    expect(result.warnings.join(' ')).toMatch(/Terminal value/);
    expect(result.warnings.join(' ')).toMatch(/haircuts/);
    expect(result.warnings.join(' ')).toMatch(/20 years/);
    expect(result.warnings.join(' ')).toMatch(/Discount rate/);
  });

  it('rejects invalid discount rates and inputs', () => {
    expect(() => valueAsset({ ...base, discountRatePct: 100 })).toThrow(/below 100/);
    expect(() => valueAsset({ ...base, years: 0 })).toThrow();
    expect(() => valueAsset({ ...base, annualCashFlow: -1 })).toThrow();
  });

  it('marks every result illustrative', () => {
    expect(valueAsset({ ...base, methodology: 'Independent appraisal' }).illustrative).toBe(true);
  });
});
