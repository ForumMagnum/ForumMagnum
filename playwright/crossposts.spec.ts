import { test, expect } from "@playwright/test";
import { createCrosspostContexts, setPostContent } from "./playwrightUtils";

test("connect crossposting account and create post", async ({browser}) => {
  const {pages, users} = await createCrosspostContexts(browser);

  // Create a post with a title and body
  await pages[0].goto("/newPost");
  const title = `Test crosspost title ${Math.random()}`;
  const body = `Test crosspost body ${Math.random()}`;
  await setPostContent(pages[0], {title, body});

  // Connect the crossposting account
  await pages[0].getByText("Options").click();
  await pages[0].getByText("Crosspost to").click();
  await pages[0].getByText("enable crossposting").click();

  // Open the authenticate account popup and copy the URL
  const popup = await pages[0].waitForEvent("popup");
  const authenticateUrl = popup.url();
  await popup.close();

  // Copy the popup url to pages[1] since we're already logged in there and
  // then connect the accounts for crossposting
  await pages[1].goto(authenticateUrl);
  await expect(pages[1].getByText(`Logged in as ${users[1].displayName}`)).toBeVisible();
  await pages[1].getByText("Click to connect your account").click();
  await pages[1].waitForTimeout(1000);

  // Check that the first site has been updated with the crossposting user
  await pages[0].dispatchEvent("body", "focus");
  await pages[0].waitForTimeout(1000);
  await expect(pages[0].getByText(users[1].displayName)).toBeVisible();
  await pages[0].waitForTimeout(1000);

  // Create the post
  await pages[0].getByText("Publish").click();

  // Check the post exists on the source site
  await pages[0].waitForURL("/posts/**/**");
  await expect(pages[0].getByText(title, {exact: true})).toBeVisible();
  await expect(pages[0].locator("#postBody").getByText(body)).toBeVisible();
  await expect(pages[0].getByText("Crossposted to")).toBeVisible();

  // Check the post exists on the foreign site
  await pages[1].goto(`/users/${users[1].slug}`);
  await pages[1].getByText(title).click();
  await pages[1].waitForURL("/posts/**/**");
  await expect(pages[1].getByText(title, {exact: true})).toBeVisible();
  await expect(pages[1].locator("#postBody").getByText(body)).toBeVisible();
  await expect(pages[1].getByText("Crossposted from")).toBeVisible();

  // Go to the edit post page
  await pages[0].locator(".PostActionsButton-root").first().click();
  await pages[0].getByText("Edit", {exact: true}).click();
  await pages[0].waitForURL("/editPost**");

  // Edit the post
  const newTitle = `Edited test crosspost title ${Math.random()}`;
  const newBody = `Edited test crosspost body ${Math.random()}`;
  await setPostContent(pages[0], {title: newTitle, body: newBody});
  // There might be some kind of race condition with the title component updating the title value
  // causing failures like https://github.com/ForumMagnum/ForumMagnum/actions/runs/14984250935/job/42095023479?pr=10840
  // but we didn't actually figure out exactly what the problem was or if it was at all related.
  await pages[0].waitForTimeout(1000);
  await pages[0].getByText("Publish changes").click();

  // Check the edits were saved locally
  await pages[0].waitForURL("/posts/**/**");
  await expect(pages[0].getByText(newTitle, {exact: true})).toBeVisible();
  await expect(pages[0].locator("#postBody").getByText(newBody)).toBeVisible();

  // Check the edits propagated to the foreign site
  await pages[1].reload();
  await expect(pages[1].getByText(newTitle, {exact: true})).toBeVisible();
  await expect(pages[1].locator("#postBody").getByText(newBody)).toBeVisible();

  // Move the post to drafts on the local forum
  await pages[0].locator(".PostActionsButton-root").first().click();
  await pages[0].getByText("Move to draft").click();
  await expect(pages[0].getByText("[Draft]")).toBeVisible();

  // Check that the version on the foreign forum is now also a draft
  await pages[1].waitForTimeout(1000);
  await pages[1].reload();
  await pages[1].waitForTimeout(1000);
  await expect(pages[1].getByText("[Draft]")).toBeVisible();
});

test("unlink crossposting account", async ({browser}) => {
  const {pages, users} = await createCrosspostContexts(browser);

  // Create a post with a title and body
  await pages[0].goto("/newPost");
  const title = `Test crosspost title ${Math.random()}`;
  const body = `Test crosspost body ${Math.random()}`;
  await setPostContent(pages[0], {title, body});

  // Connect the crossposting account
  await pages[0].getByText("Options").click();
  await pages[0].getByText("Crosspost to").click();
  await pages[0].getByText("enable crossposting").click();

  // Open the authenticate account popup and copy the URL
  const popup = await pages[0].waitForEvent("popup");
  const authenticateUrl = popup.url();
  await popup.close();

  // Copy the popup url to pages[1] since we're already logged in there and
  // then connect the accounts for crossposting
  await pages[1].goto(authenticateUrl);
  await expect(pages[1].getByText(`Logged in as ${users[1].displayName}`)).toBeVisible();
  await pages[1].getByText("Click to connect your account").click();
  await pages[1].waitForTimeout(1000);

  // Check that the first site has been updated with the crossposting user
  await pages[0].dispatchEvent("body", "focus");
  await pages[0].waitForTimeout(1000);
  await expect(pages[0].getByText(users[1].displayName)).toBeVisible();

  // Click to unlink the account
  await pages[0].getByText("Unlink this account").click();

  // Check the button to re-connect accounts appears
  await expect(pages[0].getByText("enable crossposting")).toBeVisible();
});
