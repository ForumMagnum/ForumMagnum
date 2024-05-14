import { test, expect } from "@playwright/test";
import { loginNewUser } from "./playwrightUtils";

test("create and edit post", async ({page, context}) => {
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
});

test("can create 5 posts per day, but not 6", async ({page, context}) => {
  await loginNewUser(context);

  // Create five posts with a single user
  for (let i = 0; i < 5; i++) {
    await page.goto("/newPost");
    await page.getByPlaceholder("Post title").fill(`Test post ${i}`);
    await page.getByLabel("Rich Text Editor, main").fill(`Test body ${i}`);
    await page.getByText("Submit").click();
    await page.waitForURL("/posts/**");
  }

  // After creating five posts the post rate limit should be triggered
  await page.goto("/newPost");
  await expect(page.getByText("Users cannot post more than 5 posts a day")).toBeVisible();
});
