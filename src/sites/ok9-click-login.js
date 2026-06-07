import { chromium } from 'playwright';
import crypto from 'node:crypto';

const OK9_URL = 'https://ok9-okvip.info/';
const KEEP_OPEN_MS = Number(process.env.KEEP_OPEN_MS ?? 10 * 60 * 1000);

function generateAccountData() {
  const timePart = Date.now().toString(36).slice(-6);
  const randomPart = crypto.randomBytes(4).toString('hex').slice(0, 4);
  const username = `u${timePart}${randomPart}`.slice(0, 11);
  const password = `pw${crypto.randomBytes(8).toString('hex').slice(0, 10)}`;
  const phone = `3${crypto.randomInt(10_000_000, 99_999_999)}`;
  const fullNames = [
    'Nguyen Van An',
    'Tran Minh Khang',
    'Le Hoang Nam',
    'Pham Gia Bao',
    'Do Thanh Tung',
  ];
  const fullName = fullNames[crypto.randomInt(0, fullNames.length)];

  return {
    username,
    password,
    phone,
    fullName,
  };
}

async function findLoginButton(page) {
  const candidates = [
    page.getByRole('link', { name: /đăng ký\s*\/\s*đăng nhập/i }).first(),
    page.locator('a.button.primary:has-text("Đăng ký / Đăng nhập")').first(),
    page.locator('a:has-text("Đăng ký / Đăng nhập")').first(),
    page.locator('a:has-text("Đăng Nhập - Đăng Ký")').first(),
  ];

  for (const locator of candidates) {
    try {
      await locator.waitFor({ state: 'visible', timeout: 3_000 });
      return locator;
    } catch {
      // Try the next known selector/text variant.
    }
  }

  throw new Error('Không tìm thấy button/link "Đăng ký / Đăng nhập".');
}

async function fillRegisterForm(page, accountData) {
  const registerForm = page.locator('.registerForm, div.registerForm').first();
  await registerForm.waitFor({ state: 'visible', timeout: 30_000 });

  await page
    .getByPlaceholder(/tên tài khoản.*4-11.*ký tự.*số.*chữ/i)
    .fill(accountData.username);
  await page
    .getByPlaceholder(/mật khẩu.*6-16.*ký tự.*số.*chữ/i)
    .fill(accountData.password);
  await page.getByPlaceholder(/số điện thoại/i).fill(accountData.phone);
  await page.getByPlaceholder(/họ và tên thật/i).fill(accountData.fullName);
}

async function main() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: Number(process.env.SLOW_MO ?? 250),
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  await page.goto(OK9_URL, { waitUntil: 'domcontentloaded' });

  const loginButton = await findLoginButton(page);

  const popupPromise = page.waitForEvent('popup', { timeout: 10_000 }).catch(() => null);
  await loginButton.click();

  const popup = await popupPromise;
  const activePage = popup ?? page;
  await activePage.waitForLoadState('domcontentloaded').catch(() => {});
  await activePage.bringToFront();

  const accountData = generateAccountData();
  await fillRegisterForm(activePage, accountData);

  console.log('Đã click nút Đăng ký / Đăng nhập.');
  console.log('Trang hiện tại:', activePage.url());
  console.log('Đã điền form đăng ký bằng dữ liệu test:');
  console.log(JSON.stringify(accountData, null, 2));
  console.log('Dừng ở bước xác minh để bạn thao tác thủ công.');
  console.log(`Giữ browser mở trong ${Math.round(KEEP_OPEN_MS / 1000)} giây...`);

  try {
    await activePage.waitForTimeout(KEEP_OPEN_MS);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (!message.includes('Target page, context or browser has been closed')) {
      throw err;
    }
  }

  if (browser.isConnected()) {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
