import { createUnitEconomicsModel } from '../unit-economics/unitEconomics.model.js';
import { calculateRevenue } from '../../core/utils.js';

export const createPriceScenarioModel = ({ state }) => {
  const unitModel = createUnitEconomicsModel({ state });

  const buildScenarios = ({ stepType, stepValue, steps }) => {
    const { inputs } = state.getState();
    const totalSteps = Math.max(steps, 1);
    const scenarioRange = [];
    for (let i = -totalSteps; i <= totalSteps; i += 1) {
      scenarioRange.push(i);
    }

    const entries = scenarioRange.map((offset) => {
      const basePrice = inputs.pricePerUnit;
      const delta = stepType === 'percent'
        ? basePrice * (stepValue / 100) * offset
        : stepValue * offset;
      const pricePerUnit = Math.max(basePrice + delta, 0);
      const overrides = { pricePerUnit };
      const result = unitModel.calculate(overrides);
      const revenueTotal = calculateRevenue({
        mode: inputs.mode,
        pricePerUnit,
        plannedQuantity: result.plannedQuantity,
        plannedRevenueTotal: inputs.plannedRevenueTotal
      });
      return {
        id: `${offset}`,
        offset,
        label: offset === 0 ? 'База' : `${offset > 0 ? '+' : ''}${offset * stepValue}${stepType === 'percent' ? '%' : '₽'}`,
        pricePerUnit,
        revenueTotal,
        netProfitTotal: result.netProfitTotal,
        netProfitPerUnit: result.netProfitPerUnit
      };
    });

    const base = entries.find((entry) => entry.offset === 0) ?? entries[0];
    return entries.map((entry) => ({
      ...entry,
      deltaVsBase: entry.netProfitTotal - base.netProfitTotal
    }));
  };

  return { buildScenarios };
};

