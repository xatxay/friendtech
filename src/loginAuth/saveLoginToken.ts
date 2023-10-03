import { Page } from 'puppeteer';

let loginToken = '';

async function isLoggedIn(page: Page): Promise<string> {
  if (!loginToken) {
    loginToken = await page.evaluate(() => {
      return window.localStorage.getItem('jwt');
    });
  }
  return loginToken;
}

export { isLoggedIn };
