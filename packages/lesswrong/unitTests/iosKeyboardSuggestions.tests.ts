import { JSDOM } from "jsdom";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_EDITOR,
  KEY_BACKSPACE_COMMAND,
  type LexicalEditor,
} from "lexical";
import { createHeadlessEditor } from "../../../app/api/agent/editorAgentUtil";
import { registerIOSKeyboardSuggestions } from "@/components/lexical/plugins/IOSKeyboardSuggestionsPlugin";
import { runEditorUpdate } from "./lexicalTestHelpers";

async function createEditorWithSelection(indent = 0): Promise<LexicalEditor> {
  const editor = createHeadlessEditor("IOSKeyboardSuggestionsTest");
  await runEditorUpdate(editor, () => {
    const text = $createTextNode("hello");
    const paragraph = $createParagraphNode().append(text);
    paragraph.setIndent(indent);
    $getRoot().append(paragraph);
    text.selectEnd();
  });
  return editor;
}

function createBackspaceEvent(): KeyboardEvent {
  const dom = new JSDOM();
  return new dom.window.KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: "Backspace",
  });
}

function registerPreventingFallback(editor: LexicalEditor, fallback: jest.Mock): () => void {
  return editor.registerCommand(
    KEY_BACKSPACE_COMMAND,
    (event) => {
      fallback();
      event.preventDefault();
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}

describe("iOS keyboard suggestions", () => {
  it("leaves Backspace native when iOS beforeinput is available", async () => {
    const editor = await createEditorWithSelection();
    const fallback = jest.fn();
    const unregisterFallback = registerPreventingFallback(editor, fallback);
    const unregisterIOSFix = registerIOSKeyboardSuggestions(editor, {
      isIOS: true,
      canUseBeforeInput: true,
    });
    const event = createBackspaceEvent();

    expect(editor.dispatchCommand(KEY_BACKSPACE_COMMAND, event)).toBe(true);
    expect(event.defaultPrevented).toBe(false);
    expect(fallback).not.toHaveBeenCalled();

    unregisterIOSFix();
    unregisterFallback();
  });

  it("preserves the existing Backspace handler off iOS", async () => {
    const editor = await createEditorWithSelection();
    const fallback = jest.fn();
    const unregisterFallback = registerPreventingFallback(editor, fallback);
    const unregisterIOSFix = registerIOSKeyboardSuggestions(editor, {
      isIOS: false,
      canUseBeforeInput: true,
    });
    const event = createBackspaceEvent();

    expect(editor.dispatchCommand(KEY_BACKSPACE_COMMAND, event)).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(fallback).toHaveBeenCalledTimes(1);

    unregisterIOSFix();
    unregisterFallback();
  });

  it("preserves Backspace outdent handling at the start of an indented block", async () => {
    const editor = await createEditorWithSelection(1);
    await runEditorUpdate(editor, () => {
      const firstDescendant = $getRoot().getFirstDescendant();
      if (!firstDescendant) {
        throw new Error("Expected an indented paragraph with text");
      }
      firstDescendant.selectStart();
    });
    const fallback = jest.fn();
    const unregisterFallback = registerPreventingFallback(editor, fallback);
    const unregisterIOSFix = registerIOSKeyboardSuggestions(editor, {
      isIOS: true,
      canUseBeforeInput: true,
    });
    const event = createBackspaceEvent();

    expect(editor.dispatchCommand(KEY_BACKSPACE_COMMAND, event)).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(fallback).toHaveBeenCalledTimes(1);

    unregisterIOSFix();
    unregisterFallback();
  });
});
