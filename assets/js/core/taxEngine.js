const PERCENT = 100;

const applyPercent = (value, percent) => (value * percent) / PERCENT;

const calculateVat = ({
  taxMode,
  revenueTotal,
  variableCostTotal,
  fixedCostTotal
}) => {
  if (!taxMode?.vatEnabled || taxMode?.vatMode === 'none') {
    return {
      outputVat: 0,
      inputVat: 0,
      vatToPay: 0
    };
  }

  if (taxMode.vatMode === 'noInputDeduction') {
    const outputVat = applyPercent(revenueTotal, taxMode.vatRateOutput ?? 0);
    return {
      outputVat,
      inputVat: 0,
      vatToPay: outputVat
    };
  }

  const outputVat = taxMode.vatRateOutput
    ? (revenueTotal * (taxMode.vatRateOutput / (PERCENT + taxMode.vatRateOutput)))
    : 0;
  const inputVatVariable = (taxMode.avgInputVatShareVariable ?? 0) * variableCostTotal;
  const inputVatFixed = (taxMode.avgInputVatShareFixed ?? 0) * fixedCostTotal;
  const inputVat = inputVatVariable + inputVatFixed;
  const vatToPay = Math.max(outputVat - inputVat, 0);

  return { outputVat, inputVat, vatToPay };
};

const calculateTaxBusiness = ({
  taxMode,
  revenueTotal,
  revenueNetOfVat,
  profitBeforeTax
}) => {
  if (!taxMode) {
    return 0;
  }

  const taxRate = taxMode.taxRate ?? 0;
  const minTaxRate = taxMode.minTaxRateFromRevenue ?? 0;

  switch (taxMode.baseType) {
    case 'PATENT':
      return taxMode.patentCostPerPeriod ?? 0;
    case 'USN':
    case 'AUSN':
    case 'OTHER':
    case 'OSNO':
    default:
      if (taxMode.incomeBase === 'REVENUE') {
        const base = taxMode.vatEnabled ? revenueNetOfVat : revenueTotal;
        return applyPercent(base, taxRate);
      }

      if (taxMode.incomeBase === 'PROFIT') {
        const base = Math.max(profitBeforeTax, 0);
        const taxFromProfit = applyPercent(base, taxRate);
        const minTax = minTaxRate ? applyPercent(revenueTotal, minTaxRate) : 0;
        if (taxMode.baseType === 'AUSN' && minTaxRate) {
          return Math.max(taxFromProfit, minTax);
        }
        if (taxMode.baseType === 'USN' && minTaxRate) {
          return Math.max(taxFromProfit, minTax);
        }
        return taxFromProfit;
      }

      if (taxMode.incomeBase === 'FIXED') {
        return taxMode.patentCostPerPeriod ?? 0;
      }

      return 0;
  }
};

export const calculateTaxes = ({
  revenueTotal,
  revenueNetOfVat,
  profitBeforeTax,
  variableCostTotal,
  fixedCostTotal,
  taxMode
}) => {
  const { outputVat, inputVat, vatToPay } = calculateVat({
    taxMode,
    revenueTotal,
    variableCostTotal,
    fixedCostTotal
  });

  const taxBusiness = calculateTaxBusiness({
    taxMode,
    revenueTotal,
    revenueNetOfVat,
    profitBeforeTax
  });

  return {
    taxBusiness,
    vatToPay,
    outputVat,
    inputVat,
    totalTax: taxBusiness + vatToPay
  };
};

