import { test, expect } from "@playwright/test";
import { createNewUser, logout } from "./playwrightUtils";

const getPostIdFromHref = (postHref: string | null) => {
  const postMatch = postHref?.match(/\/posts\/([^/]+)/);
  if (!postMatch) {
    return null;
  }

  return postMatch[1];
}

test("restores expanded frontpage comments after login reload", async ({page, context}) => {
  const user = await createNewUser();
  await logout(context);

  await page.goto("/");

  const firstPostItem = page.locator(".LWPostsItem-root:has(a[href*=\"/posts/\"])").first();
  await expect(firstPostItem).toBeVisible({ timeout: 30000 });

  const firstPostHref = await firstPostItem.locator('a[href*="/posts/"]').first().getAttribute("href");
  const firstPostId = getPostIdFromHref(firstPostHref);
  expect(firstPostId).toBeTruthy();

  await firstPostItem.locator(".PostsItemComments-commentsIconLarge").click();
  await expect(firstPostItem.locator(".LWPostsItem-newCommentsSection")).toBeVisible();

  await page.getByTestId("user-signup-button").click();
  await page.getByPlaceholder("username or email").fill(user.email);
  await page.getByPlaceholder("password").fill(user.password);
  await page.locator('input[type="submit"][value="Log In"]').click();

  await expect(page.getByTestId("user-signup-button")).not.toBeVisible();

  const samePostItem = page.locator(`.LWPostsItem-root:has(a[href*="/posts/${firstPostId}/"])`).first();
  await expect(samePostItem).toBeVisible();
  await expect(samePostItem.locator(".LWPostsItem-newCommentsSection")).toBeVisible();
});
