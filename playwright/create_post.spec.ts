import { test, expect } from "@playwright/test";
import { loginNewUser } from "./playwrightUtils";

test("create post", async ({page, context}) => {
  await loginNewUser(context);
  await page.goto("/newPost");

  // Create a post with a title and body
  await page.getByPlaceholder("Post title").fill("Test post 123");
  await page.getByLabel("Rich Text Editor, main").fill("Test body 123");
  await page.getByText("Submit").click();

  // Submitting navigates to the post page - check our new post is there
  await page.waitForURL("/posts/**/test-post-123**");
  await expect(page.getByText("Test post 123")).toBeVisible();
  await expect(page.getByText("Test body 123")).toBeVisible();
})
