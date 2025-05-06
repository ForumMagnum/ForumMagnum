import { test, expect } from "@playwright/test";
import { createNewPost, loginNewUser, loginUser } from "./playwrightUtils";

test("admins can ban users and remove their content", async ({page, context}) => {
  const post = await createNewPost();

  // Non-admin user should be able to see post and it's author
  const nonAdmin = await loginNewUser(context);
  await page.goto(post.postPageUrl);
  await expect(page.getByText(post.title)).toBeVisible();
  const authorPage = `/users/${post.author.slug}`;
  await page.goto(authorPage);
  await expect(page.getByText(post.author.displayName).first()).toBeVisible();

  // Admin can ban the user
  await loginNewUser(context, {isAdmin: true});
  await page.goto(`/users/${post.author.slug}/edit`);
  await page.locator(".form-section-ban-and-purge-user").click();
  await page.getByText("Delete all user content").click();
  await page.locator(".form-section-ban-and-purge-user .DatePicker-input").click(); // Select ban date
  await page.locator(".form-section-ban-and-purge-user .rdtNext").click(); // Jump to next month
  await page.locator(".form-section-ban-and-purge-user .rdtDay.rdtNew[data-value=\"1\"]").click(); // Select 1st
  await page.getByText("Submit").click();
  await page.waitForURL(authorPage);
  await page.waitForTimeout(1000); // Wait for backend async callbacks to run

  // Non-admin user now can't view the author or the post
  await loginUser(context, nonAdmin);
  await page.reload();
  await expect(page.getByText("404 not found")).toBeVisible();
  await page.goto(post.postPageUrl);
  await expect(page.getByText("you don't have access to this page")).toBeVisible();

  // The banned user should see a logged out version of the forum
  await loginUser(context, post.author);
  await page.goto("/");
  await expect(page.getByTestId("user-signup-button")).toBeVisible();
});
