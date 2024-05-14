import { test, expect } from "@playwright/test";
import { createNewPost, loginNewUser } from "./playwrightUtils";

test("create comment", async ({page, context}) => {
  // Create and visit a new post
  await loginNewUser(context);
  const post = await createNewPost();
  await page.goto(post.postPageUrl);

  // There should be no comments on this post yet
  const noCommentsPlaceholder = page.getByText("No comments on this post yet.");
  await expect(noCommentsPlaceholder).toBeVisible();

  // Add a comment and check that it is displayed
  const contents = "Test comment 123"
  await page.getByRole("textbox").fill(contents);
  await page.getByRole("button", {name: "Comment"}).click();
  await expect(page.locator(".CommentBody-root")).toBeVisible();

  // The `no comments` message should no longer be dispayed
  await expect(noCommentsPlaceholder).not.toBeVisible();
})
