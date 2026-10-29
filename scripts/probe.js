// Prints a compact DOM outline of the elements matching a selector, as GitHub renders them for the
// logged-in profile without the extension: `npm run probe -- <url> <selector> [depth] [waitMs]`.
// A selector starting with `js:` is evaluated as an expression instead and its result printed.
import { startDriver } from './driver.js';

const [url, selector, depth = '6', waitMs = '6000'] = process.argv.slice(2);

function outline(selector, maxDepth) {
  const KEEP_ATTRS = /^(id|href|role|aria-label|aria-labelledby|data-testid|data-component|data-tab-item|data-target|data-action|data-hovercard-type|data-view-component|data-content|data-selected-links|hidden|type|name|src)$/;
  const lines = [];
  const walk = (el, d) => {
    const attrs = [...el.attributes]
      .filter((a) => KEEP_ATTRS.test(a.name) || (a.name === 'class' && !el.closest('svg')))
      .map((a) => `${a.name}="${a.value.slice(0, 120)}"`)
      .join(' ');
    const ownText = [...el.childNodes]
      .filter((n) => n.nodeType === 3 && n.textContent.trim())
      .map((n) => n.textContent.trim().slice(0, 80))
      .join(' ');
    const vis = el.checkVisibility() ? '' : ' [invisible]';
    lines.push(`${'  '.repeat(d)}<${el.localName} ${attrs}>${ownText ? ` «${ownText}»` : ''}${vis}`);
    if (el.localName === 'svg') return;
    if (d >= (maxDepth < 0 ? 3 - maxDepth : maxDepth)) {
      if (el.children.length) lines.push(`${'  '.repeat(d + 1)}… ${el.children.length} children`);
      return;
    }
    for (const child of el.children) walk(child, d + 1);
  };
  const matches = [...document.querySelectorAll(selector)];
  matches.slice(0, 8).forEach((el, i) => {
    lines.push(`=== match ${i + 1}/${matches.length}`);
    // A negative depth outlines the ancestor that many levels up instead of the match itself.
    let root = el;
    for (let up = maxDepth; up < 0 && root.parentElement; up++) root = root.parentElement;
    walk(root, 0);
  });
  if (!matches.length) lines.push('=== no matches');
  return lines.join('\n');
}

const driver = await startDriver({ extension: false });
try {
  await driver.get(url);
  await driver.sleep(Number(waitMs));
  const result = selector.startsWith('js:')
    ? await driver.executeScript(`return (${selector.slice(3)})`)
    : await driver.executeScript(outline, selector, Number(depth));
  console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
} finally {
  await driver.quit();
}
