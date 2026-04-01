import { test, expect } from "@playwright/test";
import { createNewPost, loginNewUser, loginUser } from "./playwrightUtils";

test("admins can ban users and remove their content", async ({page, context}) => {
  const post = await createNewPost();

  // Non-admin user should be able to see post and it's author
  await page.goto("/");
  const nonAdmin = await loginNewUser(context);
  await page.goto(post.postPageUrl);
  await expect(page.getByText(post.title).first()).toBeVisible();
  const authorPage = `/users/${post.author.slug}`;
  await page.goto(authorPage);
  await expect(page.getByText(post.author.displayName).first()).toBeVisible();

  // Admin can ban the user
  await loginNewUser(context, {isAdmin: true});
  await page.goto(`/users/${post.author.slug}/edit`);
  await page.getByRole("navigation").getByText("Admin").click();
  await page.getByText("Delete all user content").click();
  const banFieldContainer = await page.getByText("Ban user until").locator("..");
  await banFieldContainer.locator(".DatePicker-wrapper input").click(); // Select ban date
  await banFieldContainer.locator(".react-datepicker__navigation--next").click(); // Jump to next month
  await banFieldContainer.locator(".react-datepicker__day--001:not(.react-datepicker__day--outside-month)").click(); // Select 1st
  await page.getByText("Save Changes").click();
  await page.waitForURL(authorPage);
  await page.waitForTimeout(1000); // Wait for backend async callbacks to run

  // Non-admin user now can't view the author or the post
  await loginUser(context, nonAdmin);
  await page.reload();
  await expect(page.getByText(post.title)).toBeNull();
  //await expect(page.getByText("404 not found")).toBeVisible();
  await page.goto(post.postPageUrl);
  await expect(page.getByText("404 Not Found")).toBeVisible();

  // The banned user should see a logged out version of the forum
  await loginUser(context, post.author);
  await page.goto("/");
  await expect(page.getByTestId("user-signup-button")).toBeVisible();
});
