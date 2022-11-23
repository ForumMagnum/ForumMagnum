import { test, expect } from "@playwright/test";
import { dropAndSeedDatabase } from "./helpers/dropAndSeedDatabase";
import { loginAs } from "./helpers/loginAs";
import testUserUnsetUsername from "./fixtures/users/testUserUnsetUsername";

test.beforeEach(dropAndSeedDatabase);
// test.afterEach();

test("Prompts users to set their display name after signup", async ({ context, page }) => {
  // const newDisplayname = 'New User 123123';
  // const newUsername = 'new-user-123123';

  loginAs(context, testUserUnsetUsername);
  await page.goto("http://localhost:3000");
  // cy.contains('Please choose a username').should('exist');
  // cy.get('input[type="text"]').type(newDisplayname);
  // cy.get('.NewUserCompleteProfile-submitButtonSection > button').click();
  // cy.contains(`a[href="/users/${newUsername}"]`, newDisplayname).should('exist');

  /*
  await page.goto("https://playwright.dev/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);

  // create a locator
  const getStarted = page.getByRole("link", { name: "Get started" });

  // Expect an attribute "to be strictly equal" to the value.
  await expect(getStarted).toHaveAttribute("href", "/docs/intro");

  // Click the get started link.
  await getStarted.click();

  // Expects the URL to contain intro.
  await expect(page).toHaveURL(/.*intro/);
  */
});
