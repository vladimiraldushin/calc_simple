import appConfig from '../../config/appConfig.js';
import { toNumber } from '../../core/utils.js';
import { createPriceScenarioModel } from './priceScenario.model.js';
import { createPriceScenarioView } from './priceScenario.view.js';

export const initPriceScenarioModule = ({ state, eventBus }) => {
  const model = createPriceScenarioModel({ state });
  const view = createPriceScenarioView();
  const form = document.querySelector('#scenario-form');
  const stepTypeInput = document.querySelector('#scenario-step-type');
  const stepValueInput = document.querySelector('#scenario-step-value');
  const stepsInput = document.querySelector('#scenario-steps');

  const syncForm = () => {
    const { scenario } = state.getState();
    if (stepTypeInput) stepTypeInput.value = scenario.stepType;
    if (stepValueInput) stepValueInput.value = scenario.stepValue;
    if (stepsInput) stepsInput.value = scenario.steps;
  };

  const updateScenario = (payload) => {
    state.updateState((draft) => {
      draft.scenario = {
        ...draft.scenario,
        ...payload
      };
      return draft;
    });
    render();
  };

  const render = () => {
    const { scenario } = state.getState();
    const rows = model.buildScenarios({
      stepType: scenario.stepType,
      stepValue: scenario.stepValue || appConfig.defaultScenario.stepValue,
      steps: scenario.steps || appConfig.defaultScenario.steps
    });
    view.render(rows);
  };

  if (form) {
    form.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
      const { name, value } = target;
      if (!name) return;
      const mappedValue = target.type === 'number' ? toNumber(value, appConfig.defaultScenario[name]) : value;
      updateScenario({ [name]: mappedValue });
    });
  }

  eventBus.on('unitEconomics:updated', render);
  state.subscribe(syncForm);

  syncForm();
  render();
};

