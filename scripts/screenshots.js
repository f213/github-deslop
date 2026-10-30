// Takes the README's before/after screenshots of a public page, without the daily profile's other add-ons.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, startDriver } from './driver.js';

const URL = 'https://github.com/fandsdev/eslint-config-fans/pull/47';

for (const [name, extension] of [['before', false], ['after', true]]) {
  const driver = await startDriver({ extension, addons: false });
  try {
    // One viewport size for both, tall enough for the whole page, so the pair shows at the same scale.
    await driver.manage().window().setRect({ width: 1400, height: 1500 });
    await driver.get(URL);
    await driver.sleep(8000);
    await driver.executeScript(() => {
      // Keep the repo's open security alert count out of the README.
      document.querySelector('a[data-tab-item="security-and-quality"] [data-component="counter"]')?.remove();
      window.scrollTo(0, 0);
    });
    const file = path.join(ROOT, 'docs', `${name}.png`);
    fs.writeFileSync(file, await driver.takeScreenshot(), 'base64');
    console.log(file);
  } finally {
    await driver.quit();
  }
}
