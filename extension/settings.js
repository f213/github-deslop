// Each setting toggles a `deslop-<key>` class on <html>; content.css scopes its rules under it.
const DESLOP_SETTINGS = {
  copilot: 'Remove Copilot mentions',
  notifDot: 'Hide the new notifications badge',
  orgIcon: 'Hide the org icon',
  globalNav: 'Hide All issues / All PRs / All repos buttons',
};

const DESLOP_DEFAULTS = Object.fromEntries(Object.keys(DESLOP_SETTINGS).map((key) => [key, true]));
