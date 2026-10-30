export const PAGES = {
  pr: 'https://github.com/fandsdev/medical-backend/pull/694',
  changes: 'https://github.com/fandsdev/medical-backend/pull/694/changes',
  repo: 'https://github.com/fandsdev/medical-backend',
};

// Run in the page right before a check that names them, to reveal targets that only render on
// interaction. Scrolling makes GitHub re-render parts of the page, so they must be idempotent.
export const PREPARE = {
  reviewerPicker: async () => {
    const until = async (predicate) => {
      for (let i = 0; i < 100 && !predicate(); i++) await new Promise((r) => setTimeout(r, 150));
    };
    const menu = document.querySelector('#reviewers-select-menu');
    if (!menu.open) menu.querySelector('summary').click();
    const filter = document.querySelector('#review-filter-field');
    filter.focus();
    filter.value = 'co';
    filter.dispatchEvent(new Event('input', { bubbles: true }));
    await until(() => document.querySelector('#reviewers-select-menu .select-menu-item'));
  },
};

// What each setting must hide; a target counts as visible if any match is. `pseudo` checks a
// pseudo-element of the match instead of the match, `text` keeps only matches containing it.
export const TARGETS = [
  { page: 'pr', setting: 'copilot', name: 'header-copilot-group', selector: '[data-testid="top-bar-actions"] > :has(#copilot-chat-header-button)' },
  { page: 'pr', setting: 'copilot', name: 'agents-tab', selector: 'header a[href*="/agents"]' },
  { page: 'pr', setting: 'copilot', name: 'mergebox-copilot-watch', selector: '[data-testid="mergebox-border-container"] [data-testid="copilot-avatar"]' },
  { page: 'pr', setting: 'copilot', name: 'mergebox-copilot-button', selector: '[data-testid="mergebox-border-container"] .ButtonGroup button > .octicon-copilot' },
  { page: 'pr', setting: 'copilot', name: 'mention-copilot-banner', selector: '.js-discussion .Stack > .StackItem > .octicon-copilot' },
  { page: 'pr', setting: 'copilot', name: 'comment-toolbar-copilot', selector: '[id^="copilot-md-menu-anchor"]' },
  { page: 'pr', setting: 'copilot', name: 'sidebar-copilot-reviewer', selector: '#partial-discussion-sidebar [data-hovercard-type="copilot"]' },
  { page: 'pr', setting: 'copilot', name: 'picker-copilot-reviewer', selector: '#reviewers-select-menu[open] .select-menu-item .js-copilot-avatar:not([hidden])', prepare: 'reviewerPicker' },
  { page: 'pr', setting: 'notifDot', name: 'notifications-dot', selector: 'a[href="/notifications"]', pseudo: '::before' },
  { page: 'pr', setting: 'globalNav', name: 'all-issues', selector: '[data-testid="top-nav-right"] a[href="/issues"]' },
  { page: 'pr', setting: 'globalNav', name: 'all-pulls', selector: '[data-testid="top-nav-right"] a[href="/pulls"]' },
  { page: 'pr', setting: 'globalNav', name: 'all-repos', selector: '[data-testid="top-nav-right"] a[href="/repos"]' },
  { page: 'changes', setting: 'copilot', name: 'toolbar-copilot-panel', selector: '[data-testid="file-controls-divider"] ~ * button > .octicon-copilot' },
  { page: 'changes', setting: 'copilot', name: 'file-copilot-explain', selector: '[data-testid="copilot-diff-explain-button"]' },
  { page: 'repo', setting: 'copilot', name: 'agents-tab', selector: 'header a[href*="/agents"]' },
  { page: 'repo', setting: 'orgIcon', name: 'repo-title-avatar', selector: '#repo-title-component img[data-testid="github-avatar"]' },
];

// Neighbours that must stay visible whatever the settings are.
export const KEEP = [
  { page: 'pr', name: 'search', selector: '[data-testid="top-nav-center"] button[aria-label^="Open quick search"]' },
  { page: 'pr', name: 'create-menu', selector: '[data-testid="top-bar-actions"] button[aria-labelledby^="global-create-menu"]' },
  { page: 'pr', name: 'inbox', selector: 'a[href="/notifications"]' },
  { page: 'pr', name: 'actions-tab', selector: 'a[data-tab-item="actions"]' },
  { page: 'pr', name: 'org-breadcrumb', selector: 'nav[aria-label="Breadcrumbs"] a[href="/fandsdev"]' },
  { page: 'pr', name: 'mergebox-draft', selector: '[data-testid="mergebox-border-container"] section[aria-label="Draft state"]' },
  { page: 'pr', name: 'mergebox-resolve-conflicts', selector: '[data-testid="mergebox-border-container"] button', text: 'Resolve conflicts' },
  { page: 'pr', name: 'comment-toolbar-link', selector: '.ActionBar-item', text: 'Link' },
  { page: 'pr', name: 'comment-toolbar-numbered-list', selector: '.ActionBar-item', text: 'Numbered list' },
  { page: 'pr', name: 'reviewers-heading', selector: '#reviewers-select-menu summary' },
  { page: 'pr', name: 'reviewers-picker-open', selector: '#reviewers-select-menu[open] #review-filter-field', prepare: 'reviewerPicker' },
  { page: 'changes', name: 'toolbar-comments-panel', selector: '[data-testid="file-controls-divider"] ~ * div:has(> button)', text: 'Open comments panel' },
  { page: 'changes', name: 'file-viewed', selector: 'button[aria-label="Not Viewed"], button[aria-label="Viewed"]' },
  { page: 'repo', name: 'repo-name', selector: '#repo-title-component [data-testid="repo-name-link"]' },
];
