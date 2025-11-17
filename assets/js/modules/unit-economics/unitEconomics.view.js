import { formatCurrency, formatPercent } from '../../core/utils.js';

const summaryConfig = [
  { id: 'revenueTotal', label: 'Выручка', accessor: (data) => data.revenueTotal },
  { id: 'grossProfit', label: 'Валовая прибыль', accessor: (data) => data.grossProfit },
  { id: 'profitBeforeTax', label: 'Прибыль до налога', accessor: (data) => data.profitBeforeTax },
  { id: 'netProfitTotal', label: 'Чистая прибыль', accessor: (data) => data.netProfitTotal }
];

const detailConfig = [
  { label: 'Переменные расходы / ед.', accessor: (data) => data.variable.variableCostPerUnitTotal },
  { label: 'Переменные расходы всего', accessor: (data) => data.variable.variableCostTotal },
  { label: 'Постоянные расходы', accessor: (data) => data.fixed.fixedCostTotal },
  { label: 'Налог по режиму', accessor: (data) => data.taxes.taxBusiness },
  { label: 'НДС к уплате', accessor: (data) => data.taxes.vatToPay },
  { label: 'Чистая прибыль / ед.', accessor: (data) => data.netProfitPerUnit }
];

export const createUnitEconomicsView = () => {
  const summaryContainer = document.querySelector('#summary-cards');
  const detailsContainer = document.querySelector('#details-grid');
  const variableBody = document.querySelector('#variable-expenses-body');
  const fixedBody = document.querySelector('#fixed-expenses-body');
  const taxPresetBody = document.querySelector('#tax-presets-body');

  const renderSummary = (data) => {
    if (!summaryContainer) return;
    summaryContainer.innerHTML = summaryConfig.map(({ id, label, accessor }) => `
      <article class="card" data-id="${id}">
        <p class="card__label">${label}</p>
        <p class="card__value">${formatCurrency(accessor(data))}</p>
      </article>
    `).join('');
  };

  const renderDetails = (data) => {
    if (!detailsContainer) return;
    detailsContainer.innerHTML = detailConfig.map(({ label, accessor }) => `
      <article role="listitem">
        <p class="card__label">${label}</p>
        <p class="card__value">${formatCurrency(accessor(data))}</p>
      </article>
    `).join('');
  };

  const renderExpenseRows = (tbody, items, templateId, valueField) => {
    const template = document.querySelector(templateId);
    if (!tbody || !template) return;
    tbody.innerHTML = '';

    items.forEach((item) => {
      const row = template.content.firstElementChild.cloneNode(true);
      row.dataset.id = item.id;
      row.querySelector('[name="name"]').value = item.name ?? '';
      const valueInputs = row.querySelectorAll('input');
      valueInputs.forEach((input) => {
        const fieldName = input.getAttribute('name');
        input.value = item[fieldName] ?? '';
      });
      const valueCell = row.querySelector(`[data-field="${valueField}"]`);
      if (valueCell) {
        valueCell.textContent = formatCurrency(item[valueField] ?? 0);
      }
      tbody.appendChild(row);
    });
  };

  const renderTaxPresets = (taxModes) => {
    if (!taxPresetBody) return;
    taxPresetBody.innerHTML = taxModes.map((mode) => `
      <tr>
        <td>${mode.name}</td>
        <td>${mode.baseType}</td>
        <td>${mode.incomeBase === 'FIXED' ? 'фиксированный' : formatPercent(mode.taxRate ?? 0, 0)}</td>
        <td>${mode.vatEnabled ? (mode.vatMode === 'withInputDeduction' ? `НДС ${formatPercent(mode.vatRateOutput ?? 0, 0)} с вычетами` : `НДС ${formatPercent(mode.vatRateOutput ?? 0, 0)}`) : '—'}</td>
        <td>${mode.notes ?? ''}</td>
      </tr>
    `).join('');
  };

  const updateVariableExpenses = (breakdown) => {
    renderExpenseRows(variableBody, breakdown, '#variable-expense-row', 'variableCostPerUnit');
  };

  const updateFixedExpenses = (breakdown) => {
    renderExpenseRows(fixedBody, breakdown, '#fixed-expense-row', 'fixedCostTotal');
  };

  return {
    renderSummary,
    renderDetails,
    updateVariableExpenses,
    updateFixedExpenses,
    renderTaxPresets
  };
};
