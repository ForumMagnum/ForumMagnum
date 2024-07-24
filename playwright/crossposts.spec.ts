import { test, expect } from "@playwright/test";
import { createCrosspostContexts } from "./playwrightUtils";

test("connect crossposting account and create post", async ({browser}) => {
  const {pages, users} = await createCrosspostContexts(browser);

  // Create a post with a title and body
  await pages[0].goto("/newPost");
  const title = `Test crosspost title ${Math.random()}`;
  const body = `Test crosspost body ${Math.random()}`;
  await pages[0].getByPlaceholder("Post title").fill(title);
  await pages[0].getByLabel("Rich Text Editor. Editing area: main").fill(body);

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
  await pages[0].getByText("Submit").click();

  // Check the post exists on the source site
  await pages[0].waitForURL("/posts/**/**");
  await expect(pages[0].getByText(title)).toBeVisible();
  await expect(pages[0].getByText(body)).toBeVisible();
  await expect(pages[0].getByText("Crossposted to")).toBeVisible();

  // Check the post exists on the foreign site
  await pages[1].goto(`/users/${users[1].slug}`);
  await pages[1].getByText(title).click();
  await pages[1].waitForURL("/posts/**/**");
  await expect(pages[1].getByText(title)).toBeVisible();
  await expect(pages[1].getByText(body)).toBeVisible();
  await expect(pages[1].getByText("Crossposted from")).toBeVisible();

  // Go to the edit post page
  await pages[0].locator(".PostActionsButton-root").first().click();
  await pages[0].getByText("Edit", {exact: true}).click();
  await pages[0].waitForURL("/editPost**");

  // Edit the post
  const newTitle = `Edited test crosspost title ${Math.random()}`;
  const newBody = `Edited test crosspost body ${Math.random()}`;
  await pages[0].getByPlaceholder("Post title").fill(newTitle);

  // Clear and fill the editor in two separate steps, because Playwright's .fill()
  // fails in Firefox (but not other browsers) if these are one step
  await pages[0].getByLabel("Rich Text Editor. Editing area: main").fill("");
  await pages[0].getByLabel("Rich Text Editor. Editing area: main").fill(newBody);

  await pages[0].getByText("Publish changes").click();

  // Check the edits were saved locally
  await pages[0].waitForURL("/posts/**/**");
  await expect(pages[0].getByText(newTitle)).toBeVisible();
  await expect(pages[0].getByText(newBody)).toBeVisible();

  // Check the edits propagated to the foreign site
  await pages[1].reload();
  await expect(pages[1].getByText(newTitle)).toBeVisible();
  await expect(pages[1].getByText(newBody)).toBeVisible();
});
