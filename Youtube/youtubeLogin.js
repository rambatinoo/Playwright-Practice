// this function tests that the correct error message displays when trying to login to youtube with invalid credentials
// to run the function first navigate to the Youtube folder & run "node youtubeLogin.js" from the terminal

const { chromium } = require("playwright");

async function youtubeInvalidLogin() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto("https://youtube.com");

  // accept initial cookies
  await page.locator('button:has-text("Accept all")').click();

  await page.locator('a:has-text("Sign in")').first().click();

  await page.waitForSelector("#identifierId");

  await page.fill("#identifierId", "invalidID@bubbles.com");

  await page.click('button:has-text("Next")');

  await page.waitForTimeout(1000);

  if (
    await page
      .locator('.Ekjuhf.Jj6Lae:has-text("Couldn\'t find your Google Account")')
      .isVisible()
  ) {
    console.log("Error message correctly displayed.");
  } else {
    console.log("Test Failed");
  }

  await browser.close();
}

youtubeInvalidLogin();
