import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const useDevPreview = process.env.E2E_USE_DEV_PREVIEW === "1";

async function signInPreview(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Development preview sign-in" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function capture(page: Page, testName: string) {
  const directory = path.join(process.cwd(), "qa", "daily-music-screenshots");
  fs.mkdirSync(directory, { recursive: true });
  await page.screenshot({ path: path.join(directory, `${testName}.png`), fullPage: false });
}

test.describe("Daily Teaching and Healing Music", () => {
  test.skip(!useDevPreview, "Set E2E_USE_DEV_PREVIEW=1 against a local development server");

  test("keeps the dashboard promotion and reminder preference clear and responsive", async ({ page }, testInfo) => {
    await signInPreview(page);
    const dialog = page.getByRole("dialog", { name: "How often would you like a teaching?" });
    if (await dialog.isVisible()) await dialog.getByRole("button", { name: /^Daily / }).click();
    await expect(page.getByText("Today’s Daily Teaching", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Read today’s teaching" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Susan’s Healing Music/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await capture(page, `dashboard-${testInfo.project.name}`);
  });

  test("opens a concise sourced Daily Teaching with its topic image", async ({ page }, testInfo) => {
    await signInPreview(page);
    if (await page.getByRole("dialog").isVisible()) await page.getByRole("button", { name: "Not now" }).click();
    await page.getByRole("link", { name: "Read today’s teaching" }).click();
    await expect(page).toHaveURL(/\/daily-teachings\//);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator('main img[src*="b-cdn.net/"]')).toHaveCount(1);
    await expect(page.getByText("A moment to reflect")).toBeVisible();
    await expect(page.getByText("Today’s practice")).toBeVisible();
    await expect(page.getByText("Source", { exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await capture(page, `daily-teaching-${testInfo.project.name}`);
  });

  test("offers all 23 songs in one accessible player without mobile overflow", async ({ page }, testInfo) => {
    await signInPreview(page);
    await page.goto("/music", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Susan’s Healing Music" })).toBeVisible();
    await expect(page.getByText("23 tracks")).toBeVisible();
    await expect(page.locator('audio source[src^="https://susan-website-pull.b-cdn.net/healing-music/v1/mp3/"]')).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Listen" })).toHaveCount(22);
    await page.getByRole("button", { name: "Listen" }).first().click();
    await expect(page.getByRole("heading", { name: "Beautiful Instrument" }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(accessibility.violations.filter(item => ["serious", "critical"].includes(item.impact ?? ""))).toEqual([]);
    await capture(page, `music-${testInfo.project.name}`);
  });
});
