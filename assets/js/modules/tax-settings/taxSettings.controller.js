import { createTaxSettingsModel } from './taxSettings.model.js';
import { createTaxSettingsView } from './taxSettings.view.js';

export const initTaxSettingsModule = ({ state }) => {
  const model = createTaxSettingsModel();
  const view = createTaxSettingsView();
  const refreshBtn = document.querySelector('#refresh-tax-presets');

  const refresh = async () => {
    try {
      view.setStatus('Загружаем пресеты…', 'neutral');
      const presets = await model.loadPresets();
      state.updateState((draft) => {
        draft.taxModes = presets;
        if (!draft.inputs.taxModeId && presets.length) {
          draft.inputs.taxModeId = presets[0].id;
        }
        return draft;
      });
      view.setStatus('Пресеты обновлены', 'success');
    } catch (error) {
      view.setStatus(error.message, 'error');
    }
  };

  if (refreshBtn) {
    refreshBtn.addEventListener('click', refresh);
  }
};

