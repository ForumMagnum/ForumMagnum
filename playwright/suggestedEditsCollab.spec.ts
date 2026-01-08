import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { createNewPost, enableAnonymousCollaborativeEditing } from "./playwrightUtils";

function setClientIdCookie(context: BrowserContext, clientId: string) {
  return context.addCookies([{
    name: "clientId",
    value: clientId,
    domain: "localhost",
    path: "/",
  }]);
}

async function waitForServerReady(context: BrowserContext, timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await context.request.get("/api/health", { timeout: 10_000 });
      if (res.ok()) return;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Timed out waiting for app server /api/health");
}

async function waitForCollabSynced(page: Page, timeoutMs: number) {
  await page.waitForFunction(
    () => {
      const events = (window as any).__fmE2E?.events as any[] | undefined;
      if (!events) return false;
      return events.some((e) => e.type === "collab.provider.synced" && typeof e.data?.documentName === "string" && !e.data.documentName.includes("/comments"));
    },
    null,
    { timeout: timeoutMs },
  );
}

test("collab suggested replacement: reject -> undo/redo does not corrupt text (no helloello)", async ({ page, context }) => {
  test.setTimeout(90_000);
  const useCollabV2 = process.env.PLAYWRIGHT_COLLAB_V2 === "1";

  // Logged-out user, but still has a clientId (used for HocuspocusAuth token generation).
  await context.clearCookies();
  await setClientIdCookie(context, `playwright-client-${Date.now()}`);

  await waitForServerReady(context, 30_000);

  const post = await createNewPost();
  const { linkSharingKey } = await enableAnonymousCollaborativeEditing({ postId: post._id, accessLevel: "edit" });

  // Sanity check: the link-sharing GraphQL query should succeed for logged-out users with the key.
  const res = await context.request.post("/graphql", {
    timeout: 60_000,
    data: {
      query: `
        query {
          getLinkSharedPost(postId: "${post._id}", linkSharingKey: "${linkSharingKey}") {
            _id
          }
        }
      `,
    },
  });
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.errors).toBeFalsy();
  expect(json.data?.getLinkSharedPost?._id).toBe(post._id);

  // Sanity check: Hocuspocus auth should succeed for logged-out users with the key.
  const authRes = await context.request.post("/graphql", {
    timeout: 60_000,
    data: {
      query: `
        query {
          HocuspocusAuth(postId: "${post._id}", linkSharingKey: "${linkSharingKey}") {
            token
            wsUrl
            documentName
          }
        }
      `,
    },
  });
  expect(authRes.ok()).toBeTruthy();
  const authJson = await authRes.json();
  expect(authJson.errors).toBeFalsy();
  expect(authJson.data?.HocuspocusAuth?.documentName).toBe(`post-${post._id}`);

  const collabV2Param = useCollabV2 ? "&useCollabV2=true" : "";
  await page.goto(`/collaborateOnPost?postId=${post._id}&key=${linkSharingKey}${collabV2Param}`);

  // Wait for collaboration to actually connect/sync so we're exercising the same mode as "real" usage.
  await waitForCollabSynced(page, 30_000);

  // Wait for Lexical contenteditable + suggested-edits toggle to be ready
  await expect(page.getByRole("button", { name: "Editing" })).toBeVisible({ timeout: 15_000 });
  const editor = page.locator('.LexicalEditor-editorContainer .LexicalContentEditable-root[contenteditable="true"]').first();
  await expect(editor).toBeVisible({ timeout: 15_000 });
  await editor.click({ position: { x: 10, y: 10 } });

  // Type hello
  await editor.type("hello");
  await expect(editor).toContainText("hello", { timeout: 15_000 });
  // Important: Yjs UndoManager coalesces transactions within a capture window.
  // Add a small delay between human-distinct operations so Playwright doesn't accidentally
  // merge "type hello" + "suggest replacement" + "reject" into a single undo item.
  await page.waitForTimeout(700);

  // Switch to suggesting mode before making the replacement suggestion
  await page.getByRole("button", { name: "Editing" }).click();
  await expect(page.getByRole("button", { name: "Suggesting" })).toBeVisible();
  await page.waitForTimeout(300);

  // Select "ell" via keyboard (keeps Lexical selection state in sync) and replace with "X"
  await editor.click({ position: { x: 10, y: 10 } });
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight"); // caret after "h"
  await page.keyboard.down("Shift");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.up("Shift");
  await page.keyboard.type("X");
  // While the replacement suggestion is visible, the text content includes both the deleted
  // and inserted text ("ell" + "X"), like "hellXo".
  await expect(editor).toContainText("hellXo");
  await expect(editor).not.toContainText("helloello");
  await page.waitForTimeout(700);

  // Open the comments panel (where suggestion threads live) and reject via the real UI
  const showCommentsButton = page.locator('button[title="Show Comments"], button[title="Hide Comments"]').first();
  await expect(showCommentsButton).toBeVisible({ timeout: 15_000 });
  // Ensure it's open
  const title = await showCommentsButton.getAttribute("title");
  if (title === "Show Comments") {
    await showCommentsButton.click();
  }
  await expect(page.getByRole("heading", { name: "Comments" })).toBeVisible({ timeout: 15_000 });
  const rejectButton = page.getByRole("button", { name: "Reject" }).first();
  await expect(rejectButton).toBeVisible();
  await rejectButton.click();
  await expect(editor).toContainText("hello", { timeout: 15_000 });
  await expect(editor).not.toContainText("helloello");
  await page.waitForTimeout(700);

  // Undo should bring back the replacement
  await page.keyboard.press("Meta+Z");
  await expect(editor).toContainText("hellXo");
  await expect(editor).not.toContainText("helloello");

  // Redo should restore original after rejection again
  await page.keyboard.press("Meta+Shift+Z");
  await expect(editor).toContainText("hello");
  await expect(editor).not.toContainText("helloello");
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === "passed") return;
  try {
    const events = await page.evaluate(() => (window as any).__fmE2E?.events ?? null);
    // eslint-disable-next-line no-console
    console.log("[fmE2E.events]", JSON.stringify(events, null, 2));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log("[fmE2E.events] unavailable", e);
  }
});


