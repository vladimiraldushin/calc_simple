import { toNumber } from './utils.js';

const calculateRevenueBasePerUnit = ({
  pricePerUnit,
  priceIncludesVat,
  vatEnabled,
  vatMode,
  vatRateOutput
}) => {
  if (vatEnabled && vatMode === 'withInputDeduction' && priceIncludesVat && vatRateOutput) {
    return pricePerUnit / (1 + vatRateOutput / 100);
  }
  return pricePerUnit;
};

export const calculateVariableExpenses = ({
  variableExpenses = [],
  plannedQuantity = 0,
  pricePerUnit = 0,
  priceIncludesVat,
  vatEnabled,
  vatMode,
  vatRateOutput
}) => {
  const revenueBasePerUnit = calculateRevenueBasePerUnit({
    pricePerUnit,
    priceIncludesVat,
    vatEnabled,
    vatMode,
    vatRateOutput
  });

  const breakdown = variableExpenses.map((item) => {
    const fixed = toNumber(item.valueFixedPerUnit);
    const percent = toNumber(item.valuePercentPerUnitRevenue);
    const perUnit = fixed + (revenueBasePerUnit * percent) / 100;
    return {
      ...item,
      variableCostPerUnit: perUnit,
      variableCostTotal: perUnit * plannedQuantity
    };
  });

  const variableCostPerUnitTotal = breakdown.reduce((sum, item) => sum + item.variableCostPerUnit, 0);
  const variableCostTotal = breakdown.reduce((sum, item) => sum + item.variableCostTotal, 0);

  return {
    breakdown,
    variableCostPerUnitTotal,
    variableCostTotal
  };
};

export const calculateFixedExpenses = ({
  fixedExpenses = [],
  revenueTotal = 0
}) => {
  const breakdown = fixedExpenses.map((item) => {
    const fixed = toNumber(item.valueFixedPerPeriod);
    const percent = toNumber(item.valuePercentOfRevenueTotal);
    const total = fixed + (revenueTotal * percent) / 100;
    return {
      ...item,
      fixedCostTotal: total
    };
  });

  const fixedCostTotal = breakdown.reduce((sum, item) => sum + item.fixedCostTotal, 0);

  return {
    breakdown,
    fixedCostTotal
  };
};

