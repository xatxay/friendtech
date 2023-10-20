// import { Page } from 'puppeteer';
// import * as dotenv from 'dotenv';
// dotenv.config();

// async function loginLogic(page: Page, email: string, password: string): Promise<void> {
//   await page.goto('https://www.friend.tech/');
//   await page.waitForNavigation({ waitUntil: 'networkidle0' });
//   console.log('Logging in... (loginLogic fn)');
//   const loginButton = '.Home_buttonRound__Srte6';
//   await page.waitForSelector(loginButton);
//   await page.click(loginButton);
//   const googleLoginButton = '.sc-gdyeKB.eDvvZH';
//   await page.waitForSelector(googleLoginButton);
//   await page.click(googleLoginButton);
//   const googleLoginForm = '.whsOnd.zHQkBf';
//   await page.waitForSelector(googleLoginForm);
//   await page.type(googleLoginForm, email, { delay: 200 });
//   await page.keyboard.press('Enter');
//   await page.waitForNavigation({ waitUntil: 'networkidle0' });
//   await page.waitForSelector(googleLoginForm, { visible: true });
//   await new Promise((r) => setTimeout(r, 2000));
//   await page.type(googleLoginForm, password);
//   await page.keyboard.press('Enter');
//   await new Promise((r) => setTimeout(r, 10000));
//   const selector = 'button.Home_buttonRound__Srte6[style*="background-color: transparent;"]';
//   await page.waitForSelector(selector, { visible: true });
//   const noNotificationButton = await page.$(selector);
//   if (noNotificationButton) {
//     await noNotificationButton.click();
//   } else {
//     console.error('No notification button not found');
//   }
//   await new Promise((r) => setTimeout(r, 5000));
//   await page.goto('https://www.friend.tech/watchlist');
// }

// export default loginLogic;
