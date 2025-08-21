import { test, expect } from "@playwright/test";
import { loginNewUser } from "./playwrightUtils";

test("can send and receive messages", async ({browser}) => {
  // Create two separate browser windows and login a different user in each
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  const userA = await loginNewUser(contextA);
  const userB = await loginNewUser(contextB);

  // User A clicks the "message" button on user B's profile
  await pageA.goto(`/users/${userB.slug}`);
  await pageA.getByText("Message").click();
  await pageA.waitForURL("/inbox/**");

  // User A sends a message to user B, and can see the message themself
  const messagesA = pageA.getByTestId("conversation-messages");
  const messageBoxA = pageA.getByRole("textbox")
  const message1 = `Test message 1`;
  await messageBoxA.fill(message1);
  await pageA.locator("#new-message-submit").click();
  await expect(messageBoxA.getByText(message1)).not.toBeVisible();
  await expect(messagesA.getByText(message1)).toBeVisible();

  // User B navigates to the conversation in their inbox
  await pageB.goto("/inbox");
  await expect(pageB.getByText(userA.displayName).first()).toBeVisible();
  await pageB.locator(".ConversationItem-root").click();

  // User B can see the message that user A sent
  const messagesB = pageB.getByTestId("conversation-messages");
  await expect(messagesB.getByText(message1)).toBeVisible();

  // User B sends a reply to user A
  const messageBoxB = pageB.getByRole("textbox")
  const message2 = `Test message 2`;
  await messageBoxB.fill(message2);
  await pageB.locator("#new-message-submit").click();
  await expect(messageBoxB.getByText(message2)).not.toBeVisible();
  await expect(messagesB.getByText(message1)).toBeVisible();
  await expect(messagesB.getByText(message2)).toBeVisible();

  // User A can see the reply from user B
  await expect(messagesB.getByText(message1)).toBeVisible();
  await expect(messagesB.getByText(message2)).toBeVisible();
});
