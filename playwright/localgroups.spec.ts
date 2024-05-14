import { test, expect } from "@playwright/test";
import { createNewGroup, createNewUser, loginUser } from "./playwrightUtils";

test("can create and edit events in group", async ({page, context}) => {
  const nonOrganizerUser = await createNewUser();
  const organizerUserA = await createNewUser();
  const organizerUserB = await createNewUser();

  const group = await createNewGroup({
    organizerIds: [organizerUserA._id, organizerUserB._id],
  });

  // Go to the group - ordinary users can't create events
  await loginUser(context, nonOrganizerUser);
  await page.goto(`/groups/${group._id}`);
  await expect(page.getByText("New event")).not.toBeVisible();

  // Login as first group organizer and create event
  await loginUser(context, organizerUserA);
  await page.reload();
  await page.getByText("New event").click();
  await page.waitForURL("/newPost**");
  await page.waitForTimeout(100); // Wait for title to be editable
  const title = "Test event title";
  await page.getByPlaceholder("Event name").fill(title);
  await page.getByLabel("Rich Text Editor, main").fill("Test event body");
  await page.getByText("Submit").click();

  // Submitting the new event navigates to the event page
  await page.waitForURL("/events/**/test-event-title**");
  await expect(page.getByText(title)).toBeVisible();

  // Login as the second organizer, who should also be able to edit the event
  await loginUser(context, organizerUserB);
  await page.reload();
  await page.locator(".PostActionsButton-root").first().click();
  await page.getByText("Edit", {exact: true}).click();
  await page.waitForURL("/editPost**");
  const newBody = "Edited event body";
  await page.getByLabel("Rich Text Editor, main").fill(newBody);
  await page.getByText("Publish changes").click();

  // Submitting the new event navigates to the event page
  await page.waitForURL("/events/**/test-event-title**");
  await expect(page.getByText(newBody)).toBeVisible();
});
