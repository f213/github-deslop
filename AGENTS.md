# github-deslop

Firefox extension hiding Copilot and other clutter from github.com. Machine-local setup is in the gitignored `AGENTS.local.md` — read it first.

- Every rule in `extension/content.css` needs a target in `scripts/targets.js` and a visible neighbour in `KEEP`; `npm run check` must pass and its screenshots in `artifacts/` must be looked at.
- Select by GitHub's ids, `data-testid`, hrefs and octicon classes, never by hashed class names like `__EuAHbg` or `prc-*-9n-Xk`.
- Comment-toolbar (`.ActionBar-item`) entries are collapsed, never `display: none`.
- Bump `version` in `extension/manifest.json` before `npm run sign`.
