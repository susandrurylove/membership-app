import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const memberEmail = process.env.E2E_MEMBER_EMAIL;
const memberPassword = process.env.E2E_MEMBER_PASSWORD;

async function waitForStableLogin(page: Page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function signIn(page: Page) {
  if (!memberEmail || !memberPassword) throw new Error("E2E credentials are not configured");
  await waitForStableLogin(page);
  await page.getByLabel("Email address").fill(memberEmail);
  await page.getByLabel("Password").fill(memberPassword);
  await page.getByRole("button", { name: /enter the portal/i }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();
}

test.describe("public and login quality gate", () => {
  test("QA-LOGIN-VALIDATION-003 renders an operable, correctly labelled login form", async ({ page }) => {
    await waitForStableLogin(page);
    await expect(page.getByLabel("Email address")).toHaveAttribute("type", "email");
    await expect(page.getByLabel("Password")).toHaveAttribute("type", "password");
    await expect(page.getByLabel("Password")).toHaveAttribute("minlength", "12");
    await expect(page.getByRole("button", { name: /enter the portal/i })).toBeEnabled();
  });

  test("QA-LOGIN-VALIDATION-004 rejects invalid credentials with the generic safe message", async ({ page }) => {
    await waitForStableLogin(page);
    await page.getByLabel("Email address").fill("missing@example.com");
    await page.getByLabel("Password").fill("Wrong-Password-123");
    await page.getByRole("button", { name: /enter the portal/i }).click();
    await expect(page.getByText("The email or password was not recognized.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("QA-RESPONSIVE-LAYOUT-001 has no horizontal overflow at the configured viewport", async ({ page }) => {
    await waitForStableLogin(page);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport + 1);
  });

  test("QA-ACCESSIBILITY-001 has no serious or critical automated accessibility violations", async ({ page }) => {
    await waitForStableLogin(page);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(violation => ["serious", "critical"].includes(violation.impact ?? ""));
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test("QA-PERFORMANCE-RELIABILITY-001 reaches an interactive login page within five seconds", async ({ page }) => {
    const startedAt = Date.now();
    await waitForStableLogin(page);
    expect(Date.now() - startedAt).toBeLessThan(5_000);
  });

  test("QA-VISUAL-BRAND-001 matches the reviewed login composition", async ({ page }, testInfo) => {
    await waitForStableLogin(page);
    await expect(page).toHaveScreenshot(`login-${testInfo.project.name}.png`, { fullPage: true });
  });

  test("QA-MEMBER-AUTHORIZATION-002 redirects signed-out protected navigation to login", async ({ page }) => {
    await page.goto("/teachings", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("authenticated member smoke gate", () => {
  test.skip(!memberEmail || !memberPassword, "Set E2E_MEMBER_EMAIL and E2E_MEMBER_PASSWORD to run authenticated checks");

  test("QA-LOGIN-CREDENTIALS-007 signs in, resolves identity, navigates protected areas, and signs out", async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole("link", { name: "Teachings", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Courses", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /^(Susan’s Apps|Apps)$/ })).toBeVisible();

    await page.getByRole("link", { name: "Teachings", exact: true }).click();
    await expect(page).toHaveURL(/\/teachings$/);
    await page.getByRole("link", { name: /Susan Drury|Member sanctuary/i }).first().click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("QA-ACCESSIBILITY-002 keeps the authenticated dashboard free of serious or critical violations", async ({ page }) => {
    await signIn(page);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(violation => ["serious", "critical"].includes(violation.impact ?? ""));
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    await page.getByRole("button", { name: "Sign out" }).click();
  });
});
