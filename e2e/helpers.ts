import type { Browser, Page } from "@playwright/test";

/** Opens a fresh browser session signed in as `name` (via the test-only sign-in). */
export async function signedInPage(browser: Browser, name: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/connexion");
  await page.getByLabel("Nom de test").fill(name);
  await page.getByRole("button", { name: "Connexion de test" }).click();
  await page.waitForURL("/");
  return page;
}

/** Accepts the browser confirm() dialog on the next click. */
export function acceptNextDialog(page: Page) {
  page.once("dialog", (dialog) => dialog.accept());
}
