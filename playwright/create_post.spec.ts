import { test, expect } from "@playwright/test";
import { loginNewUser } from "./playwrightUtils";

test("create and edit post", async ({page, context}) => {
  await loginNewUser(context);
  await page.goto("/newPost");

  // Create a post with a title and body
  const title = "Test post 123";
  const body = "Test body 123";
  await page.waitForTimeout(100);
  await page.getByPlaceholder("Post title").fill(title);
  await page.getByLabel("Rich Text Editor, main").fill(body);
  await page.getByText("Submit").click();

  // Submitting navigates to the post page - check our new post is there
  await page.waitForURL("/posts/**/test-post-123**");
  await expect(page.getByText(title)).toBeVisible();
  await expect(page.getByText(body)).toBeVisible();

  // Click the edit button
  await page.locator(".PostActionsButton-root").first().click();
  await page.getByText("Edit", {exact: true}).click();
  await page.waitForURL("/editPost**");

  // Edit the post
  const newTitle = "Edited test post";
  const newBody = "Edited test body";
  await page.waitForTimeout(100);
  await page.getByPlaceholder("Post title").fill(newTitle);
  await page.getByLabel("Rich Text Editor, main").fill(newBody);
  await page.getByText("Publish changes").click();

  // Submitting navigates to the post page - check it has our edits
  await page.waitForURL("/posts/**/edited-test-post**");
  await expect(page.getByText(newTitle)).toBeVisible();
  await expect(page.getByText(newBody)).toBeVisible();
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
