import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const useDevPreview = process.env.E2E_USE_DEV_PREVIEW === "1";

async function signInPreview(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Development preview sign-in" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
}

async function assertPageQuality(page: Page, path: string, heading: string | RegExp) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport + 1);
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(violation => ["serious", "critical"].includes(violation.impact ?? ""));
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

test.describe("authenticated brand, accessibility, and interaction gate", () => {
  test.describe.configure({ timeout: 120_000 });
  test.skip(!useDevPreview, "Set E2E_USE_DEV_PREVIEW=1 against a local development server");

  test("all principal portal surfaces pass accessibility and overflow checks", async ({ page }) => {
    await signInPreview(page);
    await assertPageQuality(page, "/", /Welcome,/);
    await assertPageQuality(page, "/teachings", "Wisdom & Insight");
    await assertPageQuality(page, "/courses", "Susan’s Courses");
    await assertPageQuality(page, "/apps", "Susan’s Apps");
    await assertPageQuality(page, "/admin", "Susan’s Studio");
  });

  test("teaching discovery, reading, safety, and scroll restoration work together", async ({ page }) => {
    await signInPreview(page);
    await page.goto("/teachings", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Showing 24 of 287")).toBeVisible();

    await page.getByPlaceholder("Search teachings, themes, or practices").fill("hips and legs");
    const teachingLink = page.getByRole("link", { name: /Hips and Legs: Stability and Flexibility/i }).first();
    await expect(teachingLink).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await teachingLink.click();
    await expect(page).toHaveURL(/\/teachings\/hips-and-legs-stability-and-flexibility$/);
    await expect(page.getByRole("heading", { name: "Hips and Legs: Stability and Flexibility" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByText("Educational and reflective guidance")).toBeVisible();
    await expect(page.getByText("Practice invitation")).toBeVisible();
    await expect(page.getByText("For reflection")).toBeVisible();
  });

  test("library progressive loading expands deterministically", async ({ page }) => {
    await signInPreview(page);
    await page.goto("/teachings", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Show more teachings" }).click();
    await expect(page.getByText("Showing 48 of 287")).toBeVisible();
  });

  test("brand assets are available and sign-out returns to the branded login", async ({ page, request }) => {
    const logo = await request.get("/api/public/brand/susan-drury-logo-160.webp");
    expect(logo.ok()).toBe(true);
    expect(logo.headers()["content-type"]).toContain("image/webp");

    await signInPreview(page);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});
