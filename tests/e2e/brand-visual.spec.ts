import { expect, test, type Page } from "@playwright/test";

const useDevPreview = process.env.E2E_USE_DEV_PREVIEW === "1";

async function signInPreview(page: Page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Development preview sign-in" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function stablePage(page: Page, path: string, heading: RegExp | string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test.describe("authenticated Susan Drury brand comparison", () => {
  test.skip(!useDevPreview, "Set E2E_USE_DEV_PREVIEW=1 against a local development server");

  test("captures every principal portal surface at the configured viewport", async ({ page }, testInfo) => {
    await signInPreview(page);
    await expect(page).toHaveScreenshot(`dashboard-${testInfo.project.name}.png`, { fullPage: false });

    await stablePage(page, "/teachings", "Wisdom & Insight");
    await expect(page.getByText(/Showing 24 of 287/)).toBeVisible();
    await expect(page).toHaveScreenshot(`teachings-${testInfo.project.name}.png`, { fullPage: false });

    const firstTeaching = page.locator('a[href^="/teachings/"]').first();
    await firstTeaching.click();
    await expect(page.locator("article")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`teaching-detail-${testInfo.project.name}.png`, { fullPage: false });

    await stablePage(page, "/courses", "Susan’s Courses");
    await expect(page).toHaveScreenshot(`courses-${testInfo.project.name}.png`, { fullPage: false });

    await stablePage(page, "/apps", "Susan’s Apps");
    await expect(page).toHaveScreenshot(`apps-${testInfo.project.name}.png`, { fullPage: false });

    await stablePage(page, "/admin", "Susan’s Studio");
    await expect(page).toHaveScreenshot(`admin-${testInfo.project.name}.png`, { fullPage: false });
  });
});
