// choose which test(s) you wouold like to run by adding a ".only" after the it or describe otherwise
// the tests will take a long time to run. after adding the ".only" run "npm test"

const { chromium } = require("playwright");

describe("Hacker News Article Sorting", () => {
  let browser;
  let context;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await page.goto("https://news.ycombinator.com/newest");
  });

  it("more button should be present accross pages ", async () => {
    let moreButtonVisible = await page.locator(".morelink").isVisible();
    expect(moreButtonVisible).toBe(true);

    for (let i = 0; i < 10; i++) {
      await page.locator(".morelink").click();
      await page.waitForLoadState("networkidle");

      moreButtonVisible = await page.locator(".morelink").isVisible();

      expect(moreButtonVisible).toBe(true);
    }
  }, 10000);

  it("should not duplicate articles when the more button is pressed", async () => {
    const collectedIds = new Set();

    while (collectedIds.size < 100) {
      const ids = [];
      const articles = await page.locator(".athing");
      const count = await articles.count();

      for (let i = 0; i < count; i++) {
        const articleId = await articles.nth(i).getAttribute("id");
        ids.push(articleId);
      }

      const hasDuplicates = ids.some((articleId) =>
        collectedIds.has(articleId)
      );
      expect(hasDuplicates).toBe(false);

      ids.forEach((articleId) => collectedIds.add(articleId));

      if (collectedIds.size < 100) {
        await page.click(".morelink");
        await page.waitForLoadState("networkidle");
      }
    }
  });

  it("should sort the first 100 articles from newest to oldest", async () => {
    const collectedTimestamps = [];
    while (collectedTimestamps.length < 100) {
      const timestamps = [];
      const articles = await page.locator(".athing");
      const count = await articles.count();

      for (let i = 0; i < count; i++) {
        const timestamp = await articles
          .nth(i)
          .locator("xpath=following-sibling::tr[1]")
          .locator(".age")
          .getAttribute("title");
        timestamps.push(timestamp);
      }
      collectedTimestamps.push(...timestamps);

      if (collectedTimestamps.length < 100) {
        await page.click(".morelink");
        await page.waitForLoadState("networkidle");
      }
    }

    const first100Timestamps = collectedTimestamps.slice(0, 100);
    for (let i = 0; i < 99; i++) {
      expect(first100Timestamps[i] >= first100Timestamps[i + 1]).toBe(true);
    }
  });
});

describe("Hacker News Accessibility", () => {
  let browser;
  let context;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await page.goto("https://news.ycombinator.com/newest");
  });

  it("more button should be reachable by pressing tab key", async () => {
    let focusedElement = "";
    let presses = 0;

    while (focusedElement !== "morelink" && presses < 400) {
      await page.keyboard.press("Tab");

      focusedElement = await page.evaluate(
        () => document.activeElement.className
      );

      presses++;
    }

    expect(focusedElement).toBe("morelink");
  });

  it("all items in the nav bar are labelled as links for a screen reader", async () => {
    const navBarElements = await page.locator(".pagetop a");
    const elementCount = await navBarElements.count();

    for (let i = 0; i < elementCount; i++) {
      const href = await navBarElements.nth(i).getAttribute("href");
      expect(href).not.toBeNull();
      expect(href).not.toBe("");
    }
  });
});

describe("Hacker News Article Selection", () => {
  let browser;
  let context;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await page.goto("https://news.ycombinator.com/newest");
  });

  it("Navigates to the correct article when one is selected", async () => {
    const firstArticleTitle = page
      .locator(".athing")
      .first()
      .locator(".titleline a")
      .first();

    const href = await firstArticleTitle.getAttribute("href");

    await firstArticleTitle.click();
    await page.waitForLoadState("networkidle");

    const currentUrl = await page.url();
    expect(currentUrl).toContain(href);
  }, 10000);
});

describe("Hacker News Search", () => {
  let browser;
  let context;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await page.goto("https://news.ycombinator.com/newest");
  });

  it("search bar should be present on the page", async () => {
    const isSearchBarVisible = await page
      .locator("input[name='q']")
      .isVisible();

    expect(isSearchBarVisible).toBe(true);
  });

  it("when a word is searched all articles should contain that word", async () => {
    const searchInput = page.locator("input[name='q']");

    await searchInput.fill("python");
    await searchInput.press("Enter");
    await page.waitForLoadState("networkidle");

    const searchResults = page.locator(".Story_title a:first-of-type");

    const resultCount = await searchResults.count();

    for (let i = 0; i < resultCount; i++) {
      const title = await searchResults.nth(i).innerText();

      expect(title.toLowerCase()).toContain("python");
    }
  });
});
