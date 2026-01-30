import { test, expect, type Locator, type Page } from "@playwright/test";
import { createNewPost, loginNewUser } from "./playwrightUtils";

test.describe.configure({ retries: 0 });

type SuggestionMark = {
  id: string | null;
  isInsert: boolean;
  isDelete: boolean;
  text: string;
};

type SuggestionMarkSummary = {
  insertIds: Set<string>;
  deleteIds: Set<string>;
  insertText: string;
  deleteText: string;
};

const selectAllShortcut = process.platform === "darwin" ? "Meta+A" : "Control+A";

const getLexicalEditor = (page: Page) =>
  page.locator('[contenteditable="true"][data-lexical-editor], .LexicalContentEditable-root').first();

const getSuggestionMarks = async (page: Page, scope?: Locator): Promise<SuggestionMark[]> => {
  const scopeHandle = scope ? await scope.elementHandle() : null;
  return page.evaluate((root) => {
    const container = root ?? document;
    const elements = Array.from(container.querySelectorAll<HTMLElement>("[data-suggestion-id]"));
    return elements.map((elem) => ({
      id: elem.dataset.suggestionId ?? null,
      isInsert: elem.classList.contains("lexical-suggestion-insert"),
      isDelete: elem.classList.contains("lexical-suggestion-delete"),
      text: elem.textContent ?? "",
    }));
  }, scopeHandle);
};

const summarizeMarks = (marks: SuggestionMark[]): SuggestionMarkSummary => {
  const insertIds = new Set<string>();
  const deleteIds = new Set<string>();
  let insertText = "";
  let deleteText = "";
  for (const mark of marks) {
    if (!mark.id) continue;
    if (mark.isInsert) {
      insertIds.add(mark.id);
      insertText += mark.text;
    }
    if (mark.isDelete) {
      deleteIds.add(mark.id);
      deleteText += mark.text;
    }
  }
  return { insertIds, deleteIds, insertText, deleteText };
};

const setSuggestMode = async (page: Page, enabled: boolean) => {
  const toggle = page.getByRole("button", { name: /Suggesting|Editing/ });
  await expect(toggle).toBeVisible();
  const text = await toggle.textContent();
  const isSuggesting = text?.includes("Suggesting") ?? false;
  if (enabled !== isSuggesting) {
    await toggle.click();
  }
  await expect(toggle).toContainText(enabled ? "Suggesting" : "Editing");
};

const switchToLexical = async (page: Page) => {
  const editorTypeSelect = page.getByRole("button", {
    name: /Docs|Markdown|HTML|Lexical/i,
  }).first();
  await editorTypeSelect.scrollIntoViewIfNeeded();
  await expect(editorTypeSelect).toBeVisible();
  await editorTypeSelect.click();
  await page.getByRole('button', { name: 'Lexical [Experimental]' }).click();
  await expect(getLexicalEditor(page)).toBeVisible();
};

const openLexicalNewPost = async (page: Page) => {
  await page.goto("/");
  const post = await createNewPost();
  await page.goto(`/editPost?postId=${post._id}`);
  await switchToLexical(page);
  return getLexicalEditor(page);
};

const clearEditorContents = async (page: Page, editor: Locator) => {
  await setSuggestMode(page, false);
  await editor.click();
  await page.keyboard.press(selectAllShortcut);
  await page.keyboard.press("Backspace");
  await expect.poll(async () => {
    const polled = await getSuggestionMarks(page, editor);
    return polled.length;
  }, { timeout: 2000 }).toBe(0);
  await expect.poll(async () => {
    const editorHandle = await editor.elementHandle();
    return page.evaluate((root) => root?.textContent ?? "", editorHandle);
  }, { timeout: 2000 }).toBe("");
};

test("suggested edits: core behaviors", async ({ page, context }) => {
  await loginNewUser(context, { isAdmin: true, hideSunshineSidebar: true });
  const editor = await openLexicalNewPost(page);

  // Multi-character insert is a single suggestion.
  await setSuggestMode(page, true);
  await editor.click();
  await page.keyboard.type("hello");
  await expect.poll(async () => {
    const polled = await getSuggestionMarks(page, editor);
    return polled.filter((mark) => mark.isInsert).length;
  }, { timeout: 2000 }).toBeGreaterThan(0);
  const insertMarks = await getSuggestionMarks(page, editor);
  const { insertIds, deleteIds, insertText } = summarizeMarks(insertMarks);
  expect(insertIds.size).toBe(1);
  expect(deleteIds.size).toBe(0);
  expect(insertText).toBe("hello");
  await clearEditorContents(page, editor);

  // Backspace on selection creates delete mark.
  await setSuggestMode(page, true);
  await editor.click();
  await page.keyboard.type("hello");
  await page.keyboard.press("Shift+ArrowLeft");
  await page.keyboard.press("Shift+ArrowLeft");
  await page.keyboard.press("Shift+ArrowLeft");
  await page.keyboard.press("Shift+ArrowLeft");
  await page.keyboard.press("Shift+ArrowLeft");
  await page.keyboard.press("Backspace");
  await expect.poll(async () => {
    const polled = await getSuggestionMarks(page, editor);
    return polled.filter((mark) => mark.isDelete).length;
  }, { timeout: 2000 }).toBeGreaterThan(0);
  const deleteMarks = await getSuggestionMarks(page, editor);
  const { insertIds: deleteInsertIds, deleteIds: deleteDeleteIds, deleteText } =
    summarizeMarks(deleteMarks);
  expect(deleteDeleteIds.size).toBe(1);
  expect(deleteText).toBe("hello");
  expect(deleteInsertIds.size).toBe(0);
  await clearEditorContents(page, editor);

  // Replace creates insert + delete with same id.
  // await setSuggestMode(page, true);
  // await editor.click();
  // await page.keyboard.type("hello world");
  // for (let i = 0; i < 5; i += 1) {
  //   await page.keyboard.press("Shift+ArrowLeft");
  // }
  // await page.keyboard.type("planet");
  // await expect.poll(async () => {
  //   const polled = await getSuggestionMarks(page, editor);
  //   const insertIds = new Set(polled.filter((mark) => mark.isInsert).map((mark) => mark.id));
  //   const deleteIds = new Set(polled.filter((mark) => mark.isDelete).map((mark) => mark.id));
  //   return insertIds.size > 0 && deleteIds.size > 0;
  // }, { timeout: 2000 }).toBe(true);
  // const replaceMarks = await getSuggestionMarks(page, editor);
  // const { insertIds: replaceInsertIds, deleteIds: replaceDeleteIds, insertText: replaceInsertText, deleteText: replaceDeleteText } =
  //   summarizeMarks(replaceMarks);
  // expect(replaceInsertIds.size).toBe(1);
  // expect(replaceDeleteIds.size).toBe(1);
  // expect(replaceInsertIds).toEqual(replaceDeleteIds);
  // expect(replaceInsertText).toBe("planet");
  // expect(replaceDeleteText).toBe("world");
  // await clearEditorContents(page, editor);

  // Backspace at insert edge creates delete suggestion.
  await setSuggestMode(page, false);
  await editor.click();
  await page.keyboard.type("X");
  await setSuggestMode(page, true);
  await editor.click();
  await page.keyboard.type("abc");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Backspace");
  await expect.poll(async () => {
    const polled = await getSuggestionMarks(page, editor);
    return polled.filter((mark) => mark.isDelete).length;
  }, { timeout: 2000 }).toBeGreaterThan(0);
  const edgeMarks = await getSuggestionMarks(page, editor);
  const { insertIds: edgeInsertIds, deleteIds: edgeDeleteIds, deleteText: edgeDeleteText } =
    summarizeMarks(edgeMarks);
  expect(edgeInsertIds.size).toBe(1);
  expect(edgeDeleteIds.size).toBe(1);
  expect(edgeDeleteText).toBe("X");
  await clearEditorContents(page, editor);

  // Delete inside insert shrinks without delete mark.
  await setSuggestMode(page, true);
  await editor.click();
  await page.keyboard.type("abc");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Backspace");
  await expect.poll(async () => {
    const polled = await getSuggestionMarks(page, editor);
    return polled.filter((mark) => mark.isInsert).length;
  }, { timeout: 2000 }).toBeGreaterThan(0);
  const shrinkMarks = await getSuggestionMarks(page, editor);
  const { insertIds: shrinkInsertIds, deleteIds: shrinkDeleteIds, insertText: shrinkInsertText } =
    summarizeMarks(shrinkMarks);
  expect(shrinkDeleteIds.size).toBe(0);
  expect(shrinkInsertIds.size).toBe(1);
  expect(shrinkInsertText).toBe("ac");
  await clearEditorContents(page, editor);

  // Thread quote updates after edit.
  await setSuggestMode(page, true);
  await editor.click();
  await page.keyboard.type("hello");
  await page.getByTitle("Show Comments").click();
  await expect(page.getByRole("heading", { name: "Comments" })).toBeVisible();
  const threadQuote = page.locator("blockquote span");
  await expect(threadQuote).toHaveText("hello");

  await editor.click();
  await page.keyboard.type(" world");
  await expect(threadQuote).toHaveText("hello world");
});
