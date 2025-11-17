import appConfig from '../../config/appConfig.js';
import { createId, toNumber } from '../../core/utils.js';
import { createUnitEconomicsModel } from './unitEconomics.model.js';
import { createUnitEconomicsView } from './unitEconomics.view.js';

const mapInputValue = (name, value, target) => {
  if (target.type === 'number') {
    return toNumber(value, 0);
  }
  if (target.type === 'checkbox') {
    return target.checked;
  }
  return value;
};

export const initUnitEconomicsModule = ({ state, eventBus }) => {
  const model = createUnitEconomicsModel({ state });
  const view = createUnitEconomicsView();

  const inputsForm = document.querySelector('#unit-inputs-form');
  const addVariableBtn = document.querySelector('#add-variable-expense');
  const addFixedBtn = document.querySelector('#add-fixed-expense');
  const variableBody = document.querySelector('#variable-expenses-body');
  const fixedBody = document.querySelector('#fixed-expenses-body');
  const taxModeSelect = document.querySelector('#tax-mode-select');
  const modeSelect = document.querySelector('#mode-select');
  const quantityInput = document.querySelector('#planned-quantity');
  const revenueInput = document.querySelector('#planned-revenue');
  const priceInput = document.querySelector('#price-per-unit');
  const priceIncludesVatInput = document.querySelector('#price-includes-vat');

  let taxModesSignature = '';

  const syncFormWithState = () => {
    const { inputs, taxModes } = state.getState();
    if (modeSelect) modeSelect.value = inputs.mode;
    if (taxModeSelect) {
      const nextSignature = taxModes.map((mode) => mode.id).join('|');
      if (nextSignature !== taxModesSignature) {
        taxModesSignature = nextSignature;
        taxModeSelect.innerHTML = taxModes.map((mode) => `
          <option value="${mode.id}">${mode.name}</option>
        `).join('');
      }
      taxModeSelect.value = inputs.taxModeId ?? taxModes[0]?.id ?? '';
    }
    if (quantityInput) quantityInput.value = inputs.plannedQuantity ?? appConfig.defaultPlannedQuantity;
    if (revenueInput) revenueInput.value = inputs.plannedRevenueTotal ?? '';
    if (priceInput) priceInput.value = inputs.pricePerUnit ?? appConfig.defaultPricePerUnit;
    if (priceIncludesVatInput) priceIncludesVatInput.checked = Boolean(inputs.priceIncludesVat);
  };

  const updateInputs = (payload) => {
    state.updateState((draft) => {
      draft.inputs = {
        ...draft.inputs,
        ...payload
      };
      draft.inputs.plannedQuantity = Math.max(1, Number(draft.inputs.plannedQuantity) || 1);
      draft.inputs.pricePerUnit = Math.max(0, Number(draft.inputs.pricePerUnit) || 0);
      draft.inputs.plannedRevenueTotal = Math.max(0, Number(draft.inputs.plannedRevenueTotal) || 0);
      if (payload.mode === 'TURNOVER' && !draft.inputs.plannedRevenueTotal) {
        draft.inputs.plannedRevenueTotal = appConfig.defaultPlannedQuantity * draft.inputs.pricePerUnit;
      }
      if (!draft.inputs.taxModeId) {
        draft.inputs.taxModeId = draft.taxModes?.[0]?.id;
      }
      return draft;
    });
  };

  const addExpenseItem = ({ type }) => {
    state.updateState((draft) => {
      const targetKey = type === 'variable' ? 'variableExpenses' : 'fixedExpenses';
      draft.inputs[targetKey] = draft.inputs[targetKey] ?? [];
      if (draft.inputs[targetKey].length >= appConfig.maxExpenseItems) {
        return draft;
      }
      draft.inputs[targetKey].push({
        id: createId(),
        name: '',
        ...(type === 'variable'
          ? { valueFixedPerUnit: 0, valuePercentPerUnitRevenue: 0 }
          : { valueFixedPerPeriod: 0, valuePercentOfRevenueTotal: 0 })
      });
      return draft;
    });
  };

  const handleExpenseInput = ({ type, row, fieldName, value }) => {
    state.updateState((draft) => {
      const targetKey = type === 'variable' ? 'variableExpenses' : 'fixedExpenses';
      const list = draft.inputs[targetKey] ?? [];
      const index = list.findIndex((item) => item.id === row.dataset.id);
      if (index === -1) return draft;
      list[index][fieldName] = value;
      return draft;
    });
  };

  const handleExpenseRemove = ({ type, row }) => {
    state.updateState((draft) => {
      const targetKey = type === 'variable' ? 'variableExpenses' : 'fixedExpenses';
      draft.inputs[targetKey] = (draft.inputs[targetKey] ?? []).filter((item) => item.id !== row.dataset.id);
      return draft;
    });
  };

  const render = () => {
    const result = model.calculate();
    view.renderSummary(result);
    view.renderDetails(result);
    view.updateVariableExpenses(result.variable.breakdown);
    view.updateFixedExpenses(result.fixed.breakdown);
    const current = state.getState();
    view.renderTaxPresets(current.taxModes);
    eventBus.emit('unitEconomics:updated', result);
  };

  state.subscribe(() => {
    syncFormWithState();
    render();
  });

  if (inputsForm) {
    inputsForm.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
      const { name, value } = target;
      if (!name) return;
      updateInputs({ [name]: mapInputValue(name, value, target) });
    });
    inputsForm.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
      const { name, value } = target;
      if (!name) return;
      updateInputs({ [name]: mapInputValue(name, value, target) });
    });
  }

  if (addVariableBtn) {
    addVariableBtn.addEventListener('click', () => addExpenseItem({ type: 'variable' }));
  }

  if (addFixedBtn) {
    addFixedBtn.addEventListener('click', () => addExpenseItem({ type: 'fixed' }));
  }

  const handleTableEvent = (event, type) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const row = target.closest('tr');
    if (!row) return;
    if (target.matches('.btn-icon')) {
      handleExpenseRemove({ type, row });
      return;
    }
    if (target.matches('input')) {
      const fieldName = target.getAttribute('name');
      if (!fieldName) return;
      const value = target.type === 'number' ? toNumber(target.value) : target.value;
      handleExpenseInput({ type, row, fieldName, value });
    }
  };

  if (variableBody) {
    variableBody.addEventListener('input', (event) => handleTableEvent(event, 'variable'));
    variableBody.addEventListener('click', (event) => handleTableEvent(event, 'variable'));
  }

  if (fixedBody) {
    fixedBody.addEventListener('input', (event) => handleTableEvent(event, 'fixed'));
    fixedBody.addEventListener('click', (event) => handleTableEvent(event, 'fixed'));
  }

  syncFormWithState();
  render();
};
