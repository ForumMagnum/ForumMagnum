import { getAutocompleteShortcut } from "../components/editor/lexicalPlugins/autocomplete/LLMAutocompletePlugin";

interface FakeKeyboardEventInit {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

function makeEvent(init: FakeKeyboardEventInit): KeyboardEvent {
  return {
    key: init.key,
    ctrlKey: init.ctrlKey ?? false,
    metaKey: init.metaKey ?? false,
    shiftKey: init.shiftKey ?? false,
    altKey: init.altKey ?? false,
  } as KeyboardEvent;
}

describe("getAutocompleteShortcut", () => {
  test("does not intercept Ctrl+Y, preserving the standard redo shortcut", () => {
    const event = makeEvent({ key: "y", ctrlKey: true });

    expect(getAutocompleteShortcut(event)).toBe(null);
  });

  test("does not intercept Ctrl+Shift+Y", () => {
    const event = makeEvent({ key: "Y", ctrlKey: true, shiftKey: true });

    expect(getAutocompleteShortcut(event)).toBe(null);
  });

  test("matches Ctrl+Alt+Y for default autocomplete", () => {
    const event = makeEvent({ key: "y", ctrlKey: true, altKey: true });

    expect(getAutocompleteShortcut(event)).toBe("default");
  });

  test("matches Ctrl+Alt+Shift+Y for 405b autocomplete", () => {
    const event = makeEvent({ key: "Y", ctrlKey: true, altKey: true, shiftKey: true });

    expect(getAutocompleteShortcut(event)).toBe("405b");
  });

  test("does not match when Meta is also pressed", () => {
    const event = makeEvent({ key: "y", ctrlKey: true, altKey: true, metaKey: true });

    expect(getAutocompleteShortcut(event)).toBe(null);
  });
});
