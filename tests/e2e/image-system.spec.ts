import { expect, test, type Page } from "@playwright/test";

const useDevPreview = process.env.E2E_USE_DEV_PREVIEW === "1";

async function signInPreview(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Development preview sign-in" }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function expectVisibleBunnyImageLoaded(page: Page) {
  const images = page.locator('img[data-bunny-source*="membership-susan.b-cdn.net"]');
  await expect.poll(() => images.count()).toBeGreaterThan(0);
  const first = images.first();
  await first.scrollIntoViewIfNeeded();
  await expect.poll(() => first.evaluate(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0), { timeout: 30_000 }).toBe(true);
}

async function expectNoOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test.describe("membership Bunny image system", () => {
  test.describe.configure({ timeout: 120_000 });
  test.skip(!useDevPreview, "Set E2E_USE_DEV_PREVIEW=1 against a local development server");

  test("every principal surface loads responsive membership Bunny imagery", async ({ page }) => {
    await signInPreview(page);
    for (const route of ["/", "/teachings", "/courses", "/apps"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expectVisibleBunnyImageLoaded(page);
      await expectNoOverflow(page);
    }
  });

  test("portal focal-point imagery retains explicit responsive object positioning", async ({ page }) => {
    await signInPreview(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const portalImages = page.locator('img[data-bunny-source*="membership-susan.b-cdn.net/portal/v2/"]');
    await expect.poll(() => portalImages.count()).toBeGreaterThanOrEqual(4);
    const positioned = await portalImages.evaluateAll(nodes =>
      nodes.map(node => ({
        src: (node as HTMLImageElement).dataset.bunnySource || (node as HTMLImageElement).src,
        objectPosition: getComputedStyle(node).objectPosition,
      }))
    );
    expect(positioned.length).toBeGreaterThanOrEqual(4);
    expect(positioned.every(item => /^\d+(\.\d+)?% \d+(\.\d+)?%$/.test(item.objectPosition))).toBe(true);
    expect(positioned.filter(item => item.objectPosition !== "50% 50%").length).toBeGreaterThanOrEqual(2);
  });

  test("all 287 teaching cards use unique, delivered WebP images", async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "Full 287-image network gate runs once on desktop");
    test.setTimeout(180_000);
    await signInPreview(page);
    await page.goto("/teachings", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Showing 24 of 287")).toBeVisible();

    while (await page.getByRole("button", { name: "Show more teachings" }).isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Show more teachings" }).click();
    }
    await expect(page.getByText("Showing 287 of 287")).toBeVisible();

    const teachingImages = page.locator('a[href^="/teachings/"] img[data-bunny-source*="membership-susan.b-cdn.net/teachings/v2/"]');
    await expect(teachingImages).toHaveCount(287);
    const records = await teachingImages.evaluateAll(nodes => nodes.map(node => {
      const image = node as HTMLImageElement;
      return {
        src: image.dataset.bunnySource || image.src,
        type: (image.dataset.bunnySource || image.src).endsWith(".webp"),
        alt: image.alt,
      };
    }));
    expect(new Set(records.map(record => record.src)).size).toBe(287);
    expect(records.every(record => record.type && record.alt.startsWith("Illustration for "))).toBe(true);

    for (const index of [0, 143, 286]) {
      const response = await request.get(records[index].src);
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-type"]).toContain("image/webp");
    }
  });

  test("teaching detail hero loads its topic-specific WebP without overflow", async ({ page }) => {
    await signInPreview(page);
    await page.goto("/teachings/hips-and-legs-stability-and-flexibility", { waitUntil: "domcontentloaded" });
    const hero = page.locator('header img[data-bunny-source*="membership-susan.b-cdn.net/teachings/v2/"]');
    await expect(hero).toHaveCount(1);
    await expect(hero).toHaveAttribute("alt", /Illustration for Hips and Legs/i);
    await expect.poll(() => hero.evaluate(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0), { timeout: 30_000 }).toBe(true);
    await expectNoOverflow(page);
  });
});
