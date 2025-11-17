export const createTaxSettingsView = () => {
  const statusEl = document.querySelector('#tax-presets-status');

  const setStatus = (message, state = 'neutral') => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.dataset.state = state;
  };

  return { setStatus };
};

