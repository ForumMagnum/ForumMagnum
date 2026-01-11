import { test, expect, Page } from "@playwright/test";
import {
  createNewPost,
  enableAnonymousCollaborativeEditing,
  uniqueId,
} from "./playwrightUtils";

/**
 * Tests for the Suggested Edits feature in the Lexical collaborative editor.
 *
 * These tests require the Hocuspocus server to be running.
 * Run with: PLAYWRIGHT_HOCUSPOCUS=1 yarn playwright-test
 */

// Helper to get the Lexical editor content editable element
const getLexicalEditor = (page: Page) => {
  // Scope to the main Lexical editor on the page (avoid other contenteditables like comment UIs).
  return page.locator('.editor-shell [contenteditable="true"]').first();
};

// Helper to get the mode toggle buttons
const getModeToggle = (page: Page) => {
  return {
    container: page.locator('.SuggestEditsModeToggle-container'),
    editingButton: page.getByRole('button', { name: /Editing/i }),
    suggestingButton: page.getByRole('button', { name: /Suggesting/i }),
  };
};

test.describe("Suggested Edits", () => {
  test.skip(
    !process.env.PLAYWRIGHT_HOCUSPOCUS,
    "Suggested edits tests require PLAYWRIGHT_HOCUSPOCUS=1"
  );

  test("can switch between editing and suggesting modes with edit access", async ({ page, context }) => {
    // Create a post
    const post = await createNewPost();

    // Enable anonymous collaborative editing with "edit" access
    const { linkSharingKey } = await enableAnonymousCollaborativeEditing({
      postId: post._id,
      accessLevel: "edit",
    });

    // Open the collaborative editing URL
    await page.goto(`/collaborateOnPost?postId=${post._id}&key=${linkSharingKey}`);

    // Wait for the editor to load
    const editor = getLexicalEditor(page);
    await expect(editor).toBeVisible({ timeout: 10000 });

    // Wait for the mode toggle
    const toggle = getModeToggle(page);
    await expect(toggle.container).toBeVisible({ timeout: 5000 });

    // Initially should be in editing mode (for edit access)
    await expect(toggle.editingButton).toHaveAttribute('aria-pressed', 'true');

    // Type some text in editing mode
    await editor.click();
    const editingText = `hello-${uniqueId.get()}`;
    await page.keyboard.type(editingText, { delay: 100 });

    // Switch to suggesting mode
    await toggle.suggestingButton.click();
    await expect(toggle.suggestingButton).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle.editingButton).toHaveAttribute('aria-pressed', 'false');

    // Replace the "ell" in "hello" with "X"
    await editor.click();
    // Use keyboard-driven selection so Lexical updates its internal selection state.
    // Start of line, move 1 char right (after 'h'), then select 3 chars ('ell').
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');

    const domSelectedText = await page.evaluate(() => window.getSelection()?.toString() ?? '');
    expect(domSelectedText).toEqual('ell');

    await page.keyboard.type('X', { delay: 50 });

    // Verify the expected suggestion nodes exist for a replacement:
    // - deletion wrapper containing "ell" (non-editable)
    // - insertion wrapper containing "X"
    // - both share the same data-suggestion-id
    const deletion = editor.locator('.suggestion-deletion', { hasText: 'ell' });
    const insertion = editor.locator('.suggestion-insertion', { hasText: 'X' });

    await expect(insertion).toHaveCount(1, { timeout: 10000 });
    await expect(deletion).toHaveCount(1, { timeout: 10000 });
    await expect(deletion.first()).toHaveAttribute('contenteditable', 'false');

    const deletionSuggestionId = await deletion.first().getAttribute('data-suggestion-id');
    const insertionSuggestionId = await insertion.first().getAttribute('data-suggestion-id');
    expect(deletionSuggestionId).toBeTruthy();
    expect(insertionSuggestionId).toBeTruthy();
    expect(deletionSuggestionId).toEqual(insertionSuggestionId);
  });
});
