import { test, expect } from "@playwright/test";

/*
test("has title", async ({ page }) => {
  await page.goto("https://playwright.dev/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test("get started link", async ({ page }) => {
  await page.goto("https://playwright.dev/");

  // Click the get started link.
  await page.getByRole("link", { name: "Get started" }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole("heading", { name: "Installation" })).toBeVisible();
});
*/

test("account signup", async ({page}) => {
  const email = "test573814830@example.com";
  const password = "hunter2!";
  await page.goto("/");
  await page.getByRole("button", {name: "LOGIN"}).click();
  await page.getByPlaceholder("username or email").fill(email);
  await page.getByPlaceholder("username or email").fill(email);

  // await page.getByTestId("signup-button").click();
  // await page.getByTestId("login-email-input").fill(email);
  // await page.getByTestId("login-password-input").fill(password);
  // await page.getByTestId("signup-submit").click();
});
