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

  const aboutPostId = "bJ2haLkcGeLtTWaD5";
  const postItems = page.locator(".LWPostsItem-root:has(a[href*=\"/posts/\"])");
  await expect(postItems.first()).toBeVisible({ timeout: 30000 });
  const firstPostHref = await postItems.first().locator('a[href*="/posts/"]').first().getAttribute("href");
  const firstCandidatePostId = getPostIdFromHref(firstPostHref);
  const postItemsCount = await postItems.count();
  const targetPostItem = (firstCandidatePostId === aboutPostId && postItemsCount > 1)
    ? postItems.nth(1)
    : postItems.first();
  await expect(targetPostItem).toBeVisible({ timeout: 30000 });

  const targetPostHref = await targetPostItem.locator('a[href*="/posts/"]').first().getAttribute("href");
  const firstPostId = getPostIdFromHref(targetPostHref);
  expect(firstPostId).toBeTruthy();

  await targetPostItem.locator(".PostsItemComments-commentsIconLarge").click();
  await expect(targetPostItem.locator(".LWPostsItem-newCommentsSection")).toBeVisible();
  const storageStateBeforeLogin = await page.evaluate(() => {
    return {
      state: window.sessionStorage.getItem("frontpageLoginRestoreState_v1"),
      pending: window.sessionStorage.getItem("frontpageLoginRestorePending_v1"),
    };
  });
  expect(storageStateBeforeLogin.state).toContain(firstPostId);

  await page.getByTestId("user-signup-button").click();
  await page.getByPlaceholder("username or email").fill(user.email);
  const passwordInput = page.getByPlaceholder("password");
  await passwordInput.fill(user.password);
  await passwordInput.press("Enter");

  await expect(page.getByTestId("user-signup-button")).not.toBeVisible();

  const samePostItem = page.locator(`.LWPostsItem-root:has(a[href*="/posts/${firstPostId}/"])`).first();
  await expect(samePostItem).toBeVisible();
  await expect(samePostItem.locator(".LWPostsItem-newCommentsSection")).toBeVisible();
});
