// This file will look at the hacker news website and test tha thhe articles are sorted by newest first.
// It can be run by first going to the Hacker news file "cd HackerNews" and then running "node HackerNewsArticleSorting.js"
const { chromium } = require("playwright");

// function to get the timestamps and unique id's from the hacker news page
async function getTimestampsAndIds(page) {
  const timestamps = [];
  const ids = [];

  const articles = await page.locator(".athing");
  const count = await articles.count();

  for (let i = 0; i < count; i++) {
    const timestamp = await articles
      .nth(i)
      .locator("xpath=following-sibling::tr[1]")
      .locator(".age")
      .getAttribute("title");

    const articleId = await articles.nth(i).getAttribute("id");

    timestamps.push(timestamp);
    ids.push(articleId);
  }

  return { timestamps, ids };
}

//function to make sure more button is present
async function isMoreButtonPresent(page) {
  return await page.locator(".morelink").isVisible();
}

// function to move to the next page
async function nextPage(page) {
  await page.click(".morelink");
  await page.waitForLoadState("networkidle");
}

//function to check that timestamps are in correct order
async function checkTimestamps(timestamps) {
  for (let i = 0; i < timestamps.length - 1; i++) {
    const currentTimestamp = new Date(timestamps[i]);
    const nextTimestamp = new Date(timestamps[i + 1]);

    if (currentTimestamp < nextTimestamp) {
      return false;
    }
  }
  return true;
}

async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // go to Hacker News
  await page.goto("https://news.ycombinator.com/newest");

  const collectedTimestamps = [];
  const collectedIds = new Set();
  let timestampCount = 0;

  while (timestampCount < 100) {
    // First 100 articles are spread accross different pages, make sure that the more button is there for navigation.
    const moreButtonExists = await isMoreButtonPresent(page);
    if (!moreButtonExists) {
      console.error(
        "Test failed: More button not present before 100 articles loaded"
      );
      await browser.close();
      return;
    }

    const { timestamps, ids } = await getTimestampsAndIds(page);

    // Check that there are no duplicate articles accross pages to ensure first 100 articles are being tested.
    const hasDuplicates = ids.some((articleId) => collectedIds.has(articleId));
    if (hasDuplicates) {
      console.error("Test failed: Duplicate articles found on different pages");
      await browser.close();
      return;
    }

    ids.forEach((articleId) => collectedIds.add(articleId));
    collectedTimestamps.push(...timestamps);
    timestampCount = collectedTimestamps.length;

    if (timestampCount < 100) {
      await nextPage(page);
    }
  }

  // The while loop adds all articles from each page that it goes to, we must slice the array to get the first 100 articles.
  const first100Timestamps = collectedTimestamps.slice(0, 100);

  const isInCorrectOrder = await checkTimestamps(first100Timestamps);
  console.log(
    `The first 100 articles are in the correct order: ${
      isInCorrectOrder ? "Test pass" : "Test fail"
    }`
  );

  await browser.close();
}

//function to make sure that the page is navigable with the tab key
async function canReachMoreButtonWithTab() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://news.ycombinator.com/newest");

  let focusedElement;
  let reachedMoreLink = false;

  for (let i = 0; i < 400; i++) {
    await page.keyboard.press("Tab");

    focusedElement = await page.evaluate(
      () => document.activeElement.className
    );

    if (focusedElement === "morelink") {
      reachedMoreLink = true;
      break;
    }
  }

  console.log(
    `The more button is reachable by pressing the tab key: ${
      reachedMoreLink ? "Test pass" : "Test fail"
    }`
  );

  await browser.close();
}

(async () => {
  await sortHackerNewsArticles();
  await canReachMoreButtonWithTab();
})();
