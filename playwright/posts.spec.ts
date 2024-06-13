import { test, expect } from "@playwright/test";
import { createNewPost, loginNewUser, logout } from "./playwrightUtils";

test("create and edit post", async ({page, context}) => {
  await loginNewUser(context);
  await page.goto("/newPost");

  // Create a post with a title and body
  const title = "Test post 123";
  const body = "Test body 123";
  await page.getByPlaceholder("Post title").fill(title);
  await page.getByLabel("Rich Text Editor. Editing area: main").fill(body);
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
  await page.getByPlaceholder("Post title").fill(newTitle);

  // Clear and fill the editor in two separate steps, because Playwright's .fill() fails in Firefox (but not other browsers) if these are one step
  await page.getByLabel("Rich Text Editor. Editing area: main").fill("");
  await page.getByLabel("Rich Text Editor. Editing area: main").fill(newBody);

  await page.getByText("Publish changes").click();

  // Submitting navigates to the post page - check it has our edits
  await page.waitForURL("/posts/**/edited-test-post**");
  
  //title has .first() because the title is both a title element and in a flash message
  await expect(page.getByText(newTitle).first()).toBeVisible();
  await expect(page.getByText(newBody)).toBeVisible();
});

test("can create 5 posts per day, but not 6", async ({page, context}) => {
  await loginNewUser(context);

  // Create five posts with a single user
  for (let i = 0; i < 5; i++) {
    await page.goto("/newPost");
    await page.getByPlaceholder("Post title").fill(`Test post ${i}`);
    await page.getByLabel("Rich Text Editor. Editing area: main").fill(`Test body ${i}`);
    await page.getByText("Submit").click();
    await page.waitForURL("/posts/**");
  }

  // After creating five posts the post rate limit should be triggered
  await page.goto("/newPost");
  await expect(page.getByText("Users cannot post more than 5 posts a day")).toBeVisible();
});

test("voting on a post gives karma", async ({page, context}) => {
  // Create and visit a new post
  await loginNewUser(context);
  const post = await createNewPost();

  // The post author should have no karma
  const authorPage = `/users/${post.author.slug}`;
  await page.goto(authorPage);
  await expect(page.getByText("0 karma")).toBeVisible();

  // Post should start with 1 karma from the author
  await page.goto(post.postPageUrl);
  const karma = page.locator(".PostsVoteDefault-voteScore");
  await expect(karma).toContainText("0");

  // Click the upvote button and give time for the page to update
  await page.locator(".VoteArrowIcon-up").click();
  await page.waitForTimeout(1000);

  // Post should now have 2 karma
  await expect(karma).toContainText("1");

  // The post author should now have the karma
  await page.goto(authorPage);
  await expect(page.getByText("1 karma")).toBeVisible();
});

test("admins can move posts to draft", async ({page, context}) => {
  // Create and visit a new post
  const post = await createNewPost();
  await page.goto(post.postPageUrl);

  // The post is visible
  await expect(page.getByText(post.title)).toBeVisible();

  // An admin can move the post to draft
  await loginNewUser(context, {isAdmin: true});
  await page.reload();
  await page.locator(".PostActionsButton-root").first().click();
  await page.getByText("Move to draft").click();
  await expect(page.getByText("[Draft]")).toBeVisible();

  // Non-admins now can't view the post
  await logout(context);
  await page.reload();
  await expect(page.getByText("you don't have access")).toBeVisible();
  await expect(page.getByText(post.title)).not.toBeVisible();
});
