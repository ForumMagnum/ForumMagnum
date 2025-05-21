import { test, expect } from "@playwright/test";
import { createNewPost, loginNewUser, logout } from "./playwrightUtils";

test("create and edit comment", async ({page, context}) => {
  // Create and visit a new post
  await loginNewUser(context);
  const post = await createNewPost();
  await page.goto(post.postPageUrl);

  // There should be no comments on this post yet
  const noCommentsPlaceholder = page.getByText("No comments on this post yet.");
  await expect(noCommentsPlaceholder).toBeVisible();

  // Create a new comment
  const contents = "Test comment 123"
  await page.getByRole("textbox").fill(contents);
  await page.getByRole("button", {name: "Comment"}).click();

  // Check that the comment is displayed
  const commentItem = page.locator(".CommentsItem-root");
  await expect(commentItem).toBeVisible();
  await expect(commentItem.getByText(contents)).toBeVisible();

  // The `no comments` message should no longer be dispayed
  await expect(noCommentsPlaceholder).not.toBeVisible();

  // Switch the comment to edit mode
  await commentItem.locator(".CommentsItemMeta-menu").click();
  await page.getByText("Edit", {exact: true}).click();

  // Enter and save the new comment contents
  const newContents = "Edited comment body 123";
  // Clear and fill the editor in two separate steps, because Playwright's .fill() fails in Firefox (but not other browsers) if these are one step
  await commentItem.getByRole("textbox").fill("");
  await commentItem.getByRole("textbox").fill(newContents);
  await commentItem.getByRole("button", {name: "Save"}).click();

  // Check that the new comment is displayed
  await expect(commentItem.getByText(newContents)).toBeVisible();
});

test("create draft comment", async ({ page, context }) => {
  // Create and visit a new post
  await loginNewUser(context);
  const post = await createNewPost();
  await page.goto(post.postPageUrl);

  const noCommentsPlaceholder = page.getByText("No comments on this post yet.");
  await expect(noCommentsPlaceholder).toBeVisible();

  // Create a new draft comment
  const contents = "Test draft comment 456";
  await page.getByRole("textbox").fill(contents);
  await page.locator(".CommentsSubmitDropdown-button").click();
  await page.getByText("Save as draft").click();

  // Check that the draft comment's content is visible to the logged in user
  await expect(page.getByText(contents)).toBeVisible();
  await expect(page.getByText("[Draft]", { exact: true })).toBeVisible();

  // The main comment section should still say "No comments on this post yet."
  await expect(noCommentsPlaceholder).toBeVisible();

  // Log out
  await logout(context);
  await page.reload();

  // The draft comment contents should not be visible to an anonymous user
  await expect(page.getByText(contents)).not.toBeVisible();

  await expect(noCommentsPlaceholder).toBeVisible();
});
