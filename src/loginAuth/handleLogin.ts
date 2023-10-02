import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());
import loginLogic from './loginLogic';

async function navigateToFriendTech(): Promise<void> {
  try {
    const email = 'jametrades618@gmail.com';
    const password = 'Xatxay123789';
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: false,
    });
    const page = await browser.newPage();
    await loginLogic(page, email, password);
  } catch (err) {
    console.error(err);
  }
}

navigateToFriendTech();
