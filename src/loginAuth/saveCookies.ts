import fs from 'fs';
import { Page } from 'puppeteer';

async function createCookies(page: Page): Promise<void> {
  const cookies = await page.cookies();
  fs.writeFileSync('./cookies.json', JSON.stringify(cookies, null, 2));
}

async function loadCookies(page: Page): Promise<void> {
  const previosSession = fs.existsSync('./cookies.json');
  if (previosSession) {
    const cookiesArr = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));
    if (cookiesArr.length !== 0) {
      for (const cookie of cookiesArr) {
        await page.setCookie(cookie);
      }
      console.log('Cookies loaded');
    }
  }
}

export { createCookies, loadCookies };
