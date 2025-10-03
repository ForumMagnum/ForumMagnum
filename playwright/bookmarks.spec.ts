import { test, expect } from "@playwright/test";
import { createNewPost, loginNewUser } from "./playwrightUtils";

test("bookmark a post and view it on bookmarks page", async ({ page, context }) => {
  await loginNewUser(context);

  const post = await createNewPost();
  await page.goto(post.postPageUrl);

  await page.locator(".PostActionsButton-root").first().click();
  await page.getByText("Save", {exact: true}).click();

  await page.goto("/bookmarks");

  // Assert that the post appears
  await expect(page.getByText(post.title)).toBeVisible();
});
