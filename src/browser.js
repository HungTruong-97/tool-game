import { chromium } from 'playwright';

/**
 * @param {{ headless?: boolean }} [options]
 */
export async function launchBrowser(options = {}) {
  const headless = options.headless ?? process.env.HEADLESS !== 'false';
  return chromium.launch({ headless });
}

/**
 * Mở browser, tạo context + page, chạy callback, tự đóng.
 * @template T
 * @param {(ctx: { browser: import('playwright').Browser; page: import('playwright').Page }) => Promise<T>} fn
 * @param {{ headless?: boolean }} [options]
 * @returns {Promise<T>}
 */
export async function withBrowserPage(fn, options = {}) {
  const browser = await launchBrowser(options);
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    return await fn({ browser, page });
  } finally {
    await browser.close();
  }
}
