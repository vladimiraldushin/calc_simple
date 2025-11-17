import { calculateVariableExpenses, calculateFixedExpenses } from '../../core/expensesEngine.js';
import { calculateTaxes } from '../../core/taxEngine.js';
import { calculateRevenue, calculateRevenueNetOfVat } from '../../core/utils.js';

export const createUnitEconomicsModel = ({ state }) => {
  const calculate = (overrides = {}) => {
    const current = state.getState();
    const { taxModes } = current;
    const inputs = {
      ...current.inputs,
      ...overrides
    };

    const taxMode = taxModes.find((mode) => mode.id === inputs.taxModeId) ?? taxModes[0];

    const revenueTotal = calculateRevenue({
      mode: inputs.mode,
      pricePerUnit: inputs.pricePerUnit,
      plannedQuantity: inputs.plannedQuantity,
      plannedRevenueTotal: inputs.plannedRevenueTotal
    });

    const revenueNetOfVat = calculateRevenueNetOfVat({
      revenueTotal,
      vatEnabled: taxMode?.vatEnabled,
      vatMode: taxMode?.vatMode,
      priceIncludesVat: inputs.priceIncludesVat,
      vatRateOutput: taxMode?.vatRateOutput
    });

    const variable = calculateVariableExpenses({
      variableExpenses: inputs.variableExpenses,
      plannedQuantity: inputs.plannedQuantity,
      pricePerUnit: inputs.pricePerUnit,
      priceIncludesVat: inputs.priceIncludesVat,
      vatEnabled: taxMode?.vatEnabled,
      vatMode: taxMode?.vatMode,
      vatRateOutput: taxMode?.vatRateOutput
    });

    const fixed = calculateFixedExpenses({
      fixedExpenses: inputs.fixedExpenses,
      revenueTotal
    });

    const grossProfit = revenueTotal - variable.variableCostTotal;
    const profitBeforeTax = grossProfit - fixed.fixedCostTotal;

    const taxes = calculateTaxes({
      revenueTotal,
      revenueNetOfVat,
      profitBeforeTax,
      variableCostTotal: variable.variableCostTotal,
      fixedCostTotal: fixed.fixedCostTotal,
      taxMode
    });

    const plannedQuantity = inputs.mode === 'TURNOVER' ? inputs.plannedQuantity : inputs.plannedQuantity || 1;
    const netProfitTotal = profitBeforeTax - taxes.totalTax;
    const netProfitPerUnit = plannedQuantity ? netProfitTotal / plannedQuantity : 0;

    return {
      revenueTotal,
      revenueNetOfVat,
      variable,
      fixed,
      grossProfit,
      profitBeforeTax,
      taxes,
      netProfitTotal,
      netProfitPerUnit,
      plannedQuantity,
      taxMode
    };
  };

  return { calculate };
};
