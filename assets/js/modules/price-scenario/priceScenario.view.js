import { formatCurrency } from '../../core/utils.js';

export const createPriceScenarioView = () => {
  const tbody = document.querySelector('#scenario-body');

  const render = (rows) => {
    if (!tbody) return;
    tbody.innerHTML = rows.map((row) => `
      <tr>
        <td>${row.label}</td>
        <td>${formatCurrency(row.pricePerUnit)}</td>
        <td>${formatCurrency(row.revenueTotal)}</td>
        <td>${formatCurrency(row.netProfitTotal)}</td>
        <td>${formatCurrency(row.netProfitPerUnit)}</td>
        <td class="${row.deltaVsBase >= 0 ? 'text-success' : 'text-danger'}">
          ${row.deltaVsBase >= 0 ? '+' : ''}${formatCurrency(row.deltaVsBase)}
        </td>
      </tr>
    `).join('');
  };

  return { render };
};

