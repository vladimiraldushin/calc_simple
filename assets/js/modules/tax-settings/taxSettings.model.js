export const createTaxSettingsModel = () => {
  const loadPresets = async () => {
    const response = await fetch('./assets/js/config/taxPresets.default.json');
    if (!response.ok) {
      throw new Error('Не удалось загрузить пресеты налоговых режимов');
    }
    return response.json();
  };

  return { loadPresets };
};

