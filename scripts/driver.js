import fs from 'node:fs';
import path from 'node:path';
import { Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { ADDONS_DIR, PROFILE_DIR } from './profile.js';

export const ROOT = path.resolve(import.meta.dirname, '..');
const ADDON_ID = JSON.parse(fs.readFileSync(path.join(ROOT, 'extension/manifest.json'))).browser_specific_settings.gecko.id;
const ADDON_UUID = '5e1f0c0a-de51-4d00-9a7e-000000000001';
const OPTIONS_URL = `moz-extension://${ADDON_UUID}/options.html`;

export async function startDriver({ extension = true, addons = true } = {}) {
  if (!fs.existsSync(PROFILE_DIR)) throw new Error(`No profile at ${PROFILE_DIR}; run \`npm run login\` first`);
  const options = new firefox.Options()
    .setProfile(PROFILE_DIR)
    .setPreference('extensions.webextensions.uuids', JSON.stringify({ [ADDON_ID]: ADDON_UUID }))
    .windowSize({ width: 1400, height: 1000 });
  if (!process.env.HEADED) options.addArguments('-headless');
  const service = new firefox.ServiceBuilder().addArguments('--allow-system-access');
  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(service)
    .build();
  // Signed add-ons from the daily profile (Refined GitHub), so the test page matches what is really seen.
  if (addons && fs.existsSync(ADDONS_DIR)) {
    for (const xpi of fs.readdirSync(ADDONS_DIR).filter((f) => f.endsWith('.xpi'))) {
      await driver.installWebExtension(path.join(ADDONS_DIR, xpi), { permanent: false });
    }
  }
  if (extension) await driver.installWebExtension(path.join(ROOT, 'extension'), { permanent: false });

  // Add-ons may open welcome tabs on install; keep driving the original one.
  await driver.sleep(1000);
  const [main, ...extra] = await driver.getAllWindowHandles();
  for (const handle of extra) {
    await driver.switchTo().window(handle);
    await driver.close();
  }
  await driver.switchTo().window(main);
  return driver;
}

export async function openOptions(driver) {
  // WebDriver refuses to navigate to moz-extension:// URLs, so load it from the privileged chrome context.
  await driver.setContext(firefox.Context.CHROME);
  await driver.executeScript((url) => {
    const triggeringPrincipal = Services.scriptSecurityManager.getSystemPrincipal();
    gBrowser.selectedBrowser.fixupAndLoadURIString(url, { triggeringPrincipal });
  }, OPTIONS_URL);
  await driver.setContext(firefox.Context.CONTENT);
}
