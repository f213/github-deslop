const form = document.getElementById('settings');

browser.storage.sync.get(DESLOP_DEFAULTS).then((settings) => {
  for (const [key, title] of Object.entries(DESLOP_SETTINGS)) {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = key;
    checkbox.checked = settings[key];
    checkbox.addEventListener('change', () => browser.storage.sync.set({ [key]: checkbox.checked }));
    label.append(checkbox, ` ${title}`);
    form.append(label);
  }
  form.dataset.ready = 'true';
});
