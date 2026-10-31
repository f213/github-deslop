// Launches Firefox with the extension and the logged-in profile, opens real GitHub pages and
// checks every target twice: hidden with all settings on, visible again with all settings off.
import fs from 'node:fs';
import path from 'node:path';
import { By, until } from 'selenium-webdriver';
import { ROOT, openOptions, startDriver } from './driver.js';
import { KEEP, PAGES, PREPARE, TARGETS } from './targets.js';

const ARTIFACTS = path.join(ROOT, 'artifacts');
const SETTLE_TIMEOUT = 10_000;

const onlyPage = process.argv[2];

function probe(selector, pseudo, text) {
  const elements = [...document.querySelectorAll(selector)].filter((el) => !text || el.textContent.includes(text));
  const isVisible = (el) => {
    if (!el.checkVisibility({ visibilityProperty: true })) return false;
    if (!pseudo) return true;
    const style = getComputedStyle(el, pseudo);
    return style.content !== 'none' && style.display !== 'none';
  };
  return { found: elements.length, visible: elements.some(isVisible) };
}

function scrollToNearestVisible(selector) {
  let el = document.querySelector(selector);
  while (el && !el.checkVisibility()) el = el.parentElement;
  el?.scrollIntoView({ block: 'center' });
}

async function setAllSettings(driver, enabled) {
  await openOptions(driver);
  await driver.wait(until.elementLocated(By.css('form[data-ready]')), SETTLE_TIMEOUT);
  for (const checkbox of await driver.findElements(By.css('input[type=checkbox]'))) {
    if ((await checkbox.isSelected()) !== enabled) await checkbox.click();
  }
  const stored = await driver.executeAsyncScript((done) => browser.storage.sync.get().then(done));
  console.log(`settings: ${JSON.stringify(stored)}`);
}

async function assertSignedIn(driver) {
  const login = await driver.executeScript(() => document.querySelector('meta[name="user-login"]')?.content);
  if (!login) throw new Error('GitHub is not signed in for this profile; run `npm run login`');
  return login;
}

async function waitForSelectors(driver, selectors) {
  // GitHub renders the header and sidebar lazily, so give missing selectors a chance to appear.
  try {
    await driver.wait(
      () => driver.executeScript((all) => all.every((s) => document.querySelector(s)), selectors),
      SETTLE_TIMEOUT,
    );
  } catch {
    // Reported as "not found" below.
  }
}

async function checkPage(driver, state, page, results) {
  const targets = TARGETS.filter((t) => t.page === page);
  const keep = KEEP.filter((k) => k.page === page);
  await driver.get(PAGES[page]);
  if (results.length === 0) console.log(`signed in as ${await assertSignedIn(driver)}`);
  await waitForSelectors(driver, [...targets, ...keep].filter((t) => !t.prepare).map((t) => t.selector));

  const checks = [
    ...targets.map((t) => ({ ...t, expected: state === 'on' ? 'hidden' : 'visible' })),
    ...keep.map((k) => ({ ...k, setting: 'keep', expected: 'visible' })),
  ];
  for (const check of checks) {
    if (check.prepare) {
      await driver.executeScript(PREPARE[check.prepare]);
      await waitForSelectors(driver, [check.selector]);
    }
    const { found, visible } = await driver.executeScript(probe, check.selector, check.pseudo, check.text);
    const actual = found === 0 ? 'not found' : visible ? 'visible' : 'hidden';
    results.push({ state, page, setting: check.setting, name: check.name, expected: check.expected, actual });

    await driver.executeScript(scrollToNearestVisible, check.selector);
    const png = await driver.takeScreenshot();
    fs.writeFileSync(path.join(ARTIFACTS, `${state}-${page}-${check.name}.png`), png, 'base64');
  }
}

async function main() {
  fs.rmSync(ARTIFACTS, { recursive: true, force: true });
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  const pages = onlyPage ? [onlyPage] : Object.keys(PAGES);
  const driver = await startDriver();
  const results = [];
  try {
    for (const state of ['on', 'off']) {
      await setAllSettings(driver, state === 'on');
      for (const page of pages) await checkPage(driver, state, page, results);
    }
  } finally {
    await driver.quit();
  }

  for (const r of results) {
    const mark = r.actual === r.expected ? 'PASS' : 'FAIL';
    console.log(`${mark}  ${r.state.padEnd(3)} ${r.page.padEnd(10)} ${r.setting.padEnd(9)} ${r.name.padEnd(32)} expected ${r.expected}, got ${r.actual}`);
  }
  const failed = results.filter((r) => r.actual !== r.expected).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed; screenshots in ${ARTIFACTS}`);
  process.exitCode = failed ? 1 : 0;
}

await main();
