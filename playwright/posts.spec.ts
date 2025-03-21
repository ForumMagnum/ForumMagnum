import { test, expect } from "@playwright/test";
import { createNewPost, loginNewUser, logout, setPostContent, uniqueId } from "./playwrightUtils";

test("create and edit post", async ({page, context}) => {
  await loginNewUser(context);
  await page.goto("/newPost");

  // Create a post with a title and body
  const n = uniqueId.get();
  const title = `Test post ${n}`;
  const body = `Test body ${n}`;
  await setPostContent(page, {title, body});
  await page.getByText("Publish").click();

  // Submitting navigates to the post page - check our new post is there
  await page.waitForURL(`/posts/**/test-post-${n}**`);
  await expect(page.getByText(title)).toBeVisible();
  await expect(page.getByText(body)).toBeVisible();

  // Click the edit button
  await page.locator(".PostActionsButton-root").first().click();
  await page.getByText("Edit", {exact: true}).click();
  await page.waitForURL("/editPost**");

  // Edit the post
  const newTitle = "Edited test post";
  const newBody = "Edited test body";
  await setPostContent(page, {title: newTitle, body: newBody});
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
    await setPostContent(page, {title: `Test post ${i}`, body: `Test body ${i}`});
    await page.getByText("Publish").click();
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
  await page.locator(".VoteArrowIconHollow-up").click();
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

test("cannot create posts with duplicate title", async ({page, context}) => {
  await loginNewUser(context);

  // Create a post with a title and body
  await page.goto("/newPost");
  const n = uniqueId.get();
  const title = `Test post ${n}`;
  const body = `Test body ${n}`;
  await setPostContent(page, {title, body});
  await page.getByText("Publish").click();

  // Submitting navigates to the post page - check our new post is there
  // This will have a slug derived from the initial title, rather than the one we just set.
  await page.waitForURL(`/posts/**/test-post-${n}**`);
  await expect(page.getByText(title)).toBeVisible();
  await expect(page.getByText(body)).toBeVisible();

  // Create another post with the same title
  await page.goto("/newPost");
  await setPostContent(page, {title, body});
  await page.getByText("Publish").click();

  // We should get an error
  const error = page.getByText("You recently published another post titled").first();
  await expect(error).toBeVisible();
});
