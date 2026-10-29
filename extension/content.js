function applySettings(settings) {
  for (const key of Object.keys(DESLOP_SETTINGS)) {
    document.documentElement.classList.toggle(`deslop-${key}`, settings[key]);
  }
}

browser.storage.sync.get(DESLOP_DEFAULTS).then(applySettings);

browser.storage.onChanged.addListener(() => {
  browser.storage.sync.get(DESLOP_DEFAULTS).then(applySettings);
});
