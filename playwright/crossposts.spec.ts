import { test, expect } from "@playwright/test";
import { createCrosspostContexts } from "./playwrightUtils";

test("connect crossposting account and create post", async ({browser}) => {
  const {pages, users} = await createCrosspostContexts(browser);

  // Create a post with a title and body
  await pages[0].goto("/newPost");
  const title = "Test crosspost title";
  const body = "Test crosspost body";
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
});
