import { withBrowserPage } from './browser.js';
import { loadData, saveData } from './storage.js';

const START_URL = process.env.START_URL ?? 'https://example.com';
const OUTPUT_FILE = 'scraped.json';

async function scrapePage(page) {
  await page.goto(START_URL, { waitUntil: 'domcontentloaded' });

  const title = (await page.title()) ?? '';
  const url = page.url() ?? '';
  const heading = (await page.locator('h1').first().textContent())?.trim() ?? '';
  const paragraph = (await page.locator('p').first().textContent())?.trim() ?? '';

  return {
    scrapedAt: new Date().toISOString(),
    startUrl: START_URL,
    title,
    url,
    heading,
    paragraph,
  };
}

async function main() {
  const previous = await loadData(OUTPUT_FILE);

  const scraped = await withBrowserPage(async ({ page }) => scrapePage(page), {
    headless: process.env.HEADLESS !== 'false',
  });

  const payload = {
    latest: scraped,
    history: [
      ...(Array.isArray(previous?.history) ? previous.history : []),
      scraped,
    ],
  };

  const savedPath = await saveData(OUTPUT_FILE, payload);
  console.log('Đã lưu:', savedPath);
  console.log(JSON.stringify(scraped, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
