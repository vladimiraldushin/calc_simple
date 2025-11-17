import appConfig from './config/appConfig.js';
import { createState } from './core/state.js';
import { createEventBus } from './core/eventBus.js';
import { createId } from './core/utils.js';
import { initUnitEconomicsModule } from './modules/unit-economics/unitEconomics.controller.js';
import { initPriceScenarioModule } from './modules/price-scenario/priceScenario.controller.js';
import { initTaxSettingsModule } from './modules/tax-settings/taxSettings.controller.js';

const loadTaxPresets = async () => {
  const response = await fetch('./assets/js/config/taxPresets.default.json');
  if (!response.ok) {
    throw new Error('Не удалось получить пресеты налогов');
  }
  return response.json();
};

const createInitialState = (taxModes) => ({
  config: appConfig,
  taxModes,
  inputs: {
    mode: 'SERVICE',
    taxModeId: taxModes[0]?.id ?? '',
    plannedQuantity: appConfig.defaultPlannedQuantity,
    plannedRevenueTotal: 0,
    pricePerUnit: appConfig.defaultPricePerUnit,
    priceIncludesVat: true,
    variableExpenses: [
      {
        id: createId(),
        name: 'Себестоимость',
        valueFixedPerUnit: 400,
        valuePercentPerUnitRevenue: 0
      },
      {
        id: createId(),
        name: 'Комиссия маркетплейса',
        valueFixedPerUnit: 0,
        valuePercentPerUnitRevenue: 10
      }
    ],
    fixedExpenses: [
      {
        id: createId(),
        name: 'Аренда и офис',
        valueFixedPerPeriod: 80000,
        valuePercentOfRevenueTotal: 0
      },
      {
        id: createId(),
        name: 'Маркетинг',
        valueFixedPerPeriod: 20000,
        valuePercentOfRevenueTotal: 5
      }
    ]
  },
  scenario: {
    ...appConfig.defaultScenario
  }
});

const bootstrap = async () => {
  try {
    const taxModes = await loadTaxPresets();
    const state = createState(createInitialState(taxModes));
    const eventBus = createEventBus();

    initUnitEconomicsModule({ state, eventBus });
    initPriceScenarioModule({ state, eventBus });
    initTaxSettingsModule({ state, eventBus });
  } catch (error) {
    const main = document.querySelector('#main-content');
    if (main) {
      const alert = document.createElement('p');
      alert.className = 'panel__hint';
      alert.textContent = error.message;
      main.prepend(alert);
    }
    console.error(error);
  }
};

bootstrap();
