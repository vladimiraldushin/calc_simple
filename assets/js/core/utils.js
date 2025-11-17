export const formatCurrency = (value, currencySymbol = '₽') =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0).replace('₽', currencySymbol);

export const formatPercent = (value, digits = 1) =>
  `${Number(value).toFixed(digits)}%`;

export const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const createId = () => {
  if (globalThis.crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
};

export const calculateRevenue = ({ mode, pricePerUnit, plannedQuantity, plannedRevenueTotal }) => {
  if (mode === 'TURNOVER' && Number.isFinite(plannedRevenueTotal)) {
    return plannedRevenueTotal;
  }
  return pricePerUnit * plannedQuantity;
};

export const calculateRevenueNetOfVat = ({
  revenueTotal,
  vatEnabled,
  vatMode,
  priceIncludesVat,
  vatRateOutput
}) => {
  if (vatEnabled && vatMode === 'withInputDeduction' && priceIncludesVat && vatRateOutput) {
    return revenueTotal / (1 + vatRateOutput / 100);
  }
  return revenueTotal;
};
