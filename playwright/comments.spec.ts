import { test, expect } from "@playwright/test";
import { createNewPost, loginNewUser } from "./playwrightUtils";

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

// TODO add a test for draft comments
