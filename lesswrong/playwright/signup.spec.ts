import { test, expect } from "@playwright/test";
import { createNewUserDetails } from "./playwrightUtils";

test("account signup", async ({page}) => {
  const {username, email, password} = createNewUserDetails();

  // Go to home page
  await page.goto("/");

  // Click the signup button and submit email and password
  await page.getByTestId("user-signup-button").click();
  await page.getByTestId("login-email-input").fill(email);
  await page.getByTestId("login-password-input").fill(password);
  await page.getByTestId("login-submit").click();

  // Enter username in the modal and skip through the rest of onboarding
  await page.getByPlaceholder("Spaces and special characters allowed").fill(username);
  await page.getByTestId("onboarding-continue-user").click();
  await page.getByText("Skip for now").click();
  await expect(page.getByText("What do you do?")).toBeVisible();
  await page.getByText("Skip for now").click();
  await page.getByText("Go to the forum").click();

  // Check the user menu is visible, which means our username was set corrently
  await expect(page.getByTestId("onboarding-flow")).not.toBeVisible();
  await expect(page.getByTestId("users-menu")).toBeVisible();
});
