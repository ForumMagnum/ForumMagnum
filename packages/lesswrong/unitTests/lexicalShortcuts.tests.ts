// Tests for packages/lesswrong/components/lexical/plugins/ShortcutsPlugin/shortcuts.ts
//
// These tests exercise both QWERTY and US-Dvorak layouts. The `event.code`
// values below correspond to the *physical* QWERTY position of the key the
// user pressed (which is what browsers actually report regardless of the
// active layout), and `event.key` is the character the active layout produces
// at that physical position.
//
// Note on IS_APPLE: in the jest test environment `navigator` is not defined,
// so Lexical's `IS_APPLE` flag is false. That means the `CONTROL_OR_META`
// constant in shortcuts.ts resolves to `{ctrlKey: true, metaKey: false}` —
// i.e. the wrapper functions like `isInsertLink` look for Ctrl, not Cmd.

import {
  isExactShortcutMatch,
  isSuperscript,
  isSubscript,
  isIndent,
  isOutdent,
  isFormatNumberedList,
  isInsertLink,
  isFormatHeading,
  getFormatHeadingLevel,
} from "../components/lexical/plugins/ShortcutsPlugin/shortcuts";

interface FakeKeyboardEventInit {
  key: string;
  code: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

function makeEvent(init: FakeKeyboardEventInit): KeyboardEvent {
  return {
    key: init.key,
    code: init.code,
    ctrlKey: init.ctrlKey ?? false,
    metaKey: init.metaKey ?? false,
    shiftKey: init.shiftKey ?? false,
    altKey: init.altKey ?? false,
  } as KeyboardEvent;
}

// --- Layout simulators ----------------------------------------------------
// Each helper produces the (key, code) pair the browser would report for a
// given conceptual keypress on the named layout. The user interacts with
// shortcuts in terms of the layout they see on their keys ("press Ctrl+V"),
// so the helpers are parameterized by the character/digit the user means to
// press.

// US Dvorak: maps the *layout character* (what's printed on the Dvorak key)
// to the QWERTY-physical event.code that the browser reports when that key
// is pressed.
const DVORAK_LETTER_TO_CODE: Record<string, string> = {
  // Top alpha row: Dvorak ',.pyfgcrl' sit at QWERTY 'qwertyuiop'.
  ",": "KeyW", ".": "KeyE", p: "KeyR", y: "KeyT", f: "KeyY",
  g: "KeyU", c: "KeyI", r: "KeyO", l: "KeyP",
  // Home row: Dvorak 'aoeuidhtns' sit at QWERTY 'asdfghjkl;'.
  a: "KeyA", o: "KeyS", e: "KeyD", u: "KeyF", i: "KeyG",
  d: "KeyH", h: "KeyJ", t: "KeyK", n: "KeyL", s: "Semicolon",
  // Bottom row: Dvorak ';qjkxbmwvz' sit at QWERTY 'zxcvbnm,./'.
  ";": "KeyZ", q: "KeyX", j: "KeyC", k: "KeyV", x: "KeyB",
  b: "KeyN", m: "KeyM", w: "Comma", v: "Period", z: "Slash",
  // Punctuation that's also relevant.
  "'": "KeyQ", "/": "BracketLeft", "=": "BracketRight",
  "[": "Minus", "]": "Equal", "-": "Quote",
};

// --- isExactShortcutMatch on QWERTY ---------------------------------------

describe("isExactShortcutMatch — QWERTY layout", () => {
  test("matches plain letter shortcut (Ctrl+B → bold)", () => {
    const event = makeEvent({ key: "b", code: "KeyB", ctrlKey: true });
    expect(isExactShortcutMatch(event, "b", { ctrlKey: true })).toBe(true);
  });

  test("matches uppercased letter via shift (Cmd+Shift+L)", () => {
    const event = makeEvent({
      key: "L", code: "KeyL", metaKey: true, shiftKey: true,
    });
    expect(
      isExactShortcutMatch(event, "l", { metaKey: true, shiftKey: true }),
    ).toBe(true);
  });

  test("matches digit shortcut (Ctrl+4 → inline math)", () => {
    const event = makeEvent({ key: "4", code: "Digit4", ctrlKey: true });
    expect(isExactShortcutMatch(event, "4", { ctrlKey: true })).toBe(true);
  });

  test("matches digit through shift transform (Cmd+Shift+7 → '&')", () => {
    // On US-QWERTY, Shift+7 produces '&'. The shortcut is spelled in terms
    // of '7', so the match has to look through the shift transform.
    const event = makeEvent({
      key: "&", code: "Digit7", metaKey: true, shiftKey: true,
    });
    expect(
      isExactShortcutMatch(event, "7", { metaKey: true, shiftKey: true }),
    ).toBe(true);
  });

  test("matches punctuation through shift transform (Ctrl+Shift+. → '>')", () => {
    const event = makeEvent({
      key: ">", code: "Period", ctrlKey: true, shiftKey: true,
    });
    expect(
      isExactShortcutMatch(event, ".", { ctrlKey: true, shiftKey: true }),
    ).toBe(true);
  });

  test("matches plain punctuation (Ctrl+. → superscript)", () => {
    const event = makeEvent({ key: ".", code: "Period", ctrlKey: true });
    expect(isExactShortcutMatch(event, ".", { ctrlKey: true })).toBe(true);
  });

  test("matches non-ASCII produced char by falling back to event.code (Cmd+Opt+1 → '¡')", () => {
    // On macOS US-QWERTY, Cmd+Opt+1 produces the non-ASCII '¡'. The
    // shortcut should still fire by looking at event.code.
    const event = makeEvent({
      key: "¡", code: "Digit1", metaKey: true, altKey: true,
    });
    expect(
      isExactShortcutMatch(event, "1", { metaKey: true, altKey: true }),
    ).toBe(true);
  });

  test("does not match when modifiers differ", () => {
    const event = makeEvent({ key: "b", code: "KeyB", ctrlKey: true });
    // Expects shift but only ctrl is held.
    expect(
      isExactShortcutMatch(event, "b", { ctrlKey: true, shiftKey: true }),
    ).toBe(false);
  });

  test("Ctrl+V on QWERTY does not match Ctrl+. (sanity check)", () => {
    const event = makeEvent({ key: "v", code: "KeyV", ctrlKey: true });
    expect(isExactShortcutMatch(event, ".", { ctrlKey: true })).toBe(false);
  });
});

// --- isExactShortcutMatch on Dvorak ---------------------------------------

describe("isExactShortcutMatch — US Dvorak layout", () => {
  test("Ctrl+V (paste) on Dvorak does not match the Ctrl+. superscript shortcut (regression: 2026-04-23)", () => {
    // On Dvorak, the V key sits at QWERTY's Period position. Before the
    // fix, isExactShortcutMatch would fall through to `event.code === 'Period'`
    // and report a false match for the punctuation-keyed superscript shortcut,
    // which prevented the browser's native paste from running.
    const event = makeEvent({
      key: "v",
      code: DVORAK_LETTER_TO_CODE.v, // 'Period'
      ctrlKey: true,
    });
    expect(isExactShortcutMatch(event, ".", { ctrlKey: true })).toBe(false);
    expect(isSuperscript(event)).toBe(false);
  });

  test("Ctrl+W on Dvorak does not match the Ctrl+, subscript shortcut", () => {
    // Dvorak's W key is at QWERTY's Comma position.
    const event = makeEvent({
      key: "w",
      code: DVORAK_LETTER_TO_CODE.w, // 'Comma'
      ctrlKey: true,
    });
    expect(isExactShortcutMatch(event, ",", { ctrlKey: true })).toBe(false);
    expect(isSubscript(event)).toBe(false);
  });

  test("Ctrl+= on Dvorak does not match the Ctrl+] indent shortcut", () => {
    // Dvorak '=' is at QWERTY ']' position.
    const event = makeEvent({
      key: "=",
      code: DVORAK_LETTER_TO_CODE["="], // 'BracketRight'
      ctrlKey: true,
    });
    expect(isExactShortcutMatch(event, "]", { ctrlKey: true })).toBe(false);
    expect(isIndent(event)).toBe(false);
  });

  test("Ctrl+/ on Dvorak does not match the Ctrl+[ outdent shortcut", () => {
    // Dvorak '/' is at QWERTY '[' position.
    const event = makeEvent({
      key: "/",
      code: DVORAK_LETTER_TO_CODE["/"], // 'BracketLeft'
      ctrlKey: true,
    });
    expect(isExactShortcutMatch(event, "[", { ctrlKey: true })).toBe(false);
    expect(isOutdent(event)).toBe(false);
  });

  test("Dvorak shortcuts follow the layout, not the physical position (Ctrl+. on Dvorak fires superscript)", () => {
    // The user pressed what is labeled '.' on their Dvorak keyboard. That is
    // physically at QWERTY's 'e' position. The shortcut should still fire.
    const event = makeEvent({
      key: ".",
      code: DVORAK_LETTER_TO_CODE["."], // 'KeyE'
      ctrlKey: true,
    });
    expect(isExactShortcutMatch(event, ".", { ctrlKey: true })).toBe(true);
    expect(isSuperscript(event)).toBe(true);
  });

  test("Ctrl+Shift+L on Dvorak fires (the L key on Dvorak is at QWERTY's 'p' position)", () => {
    // Confirms layout-following behavior for letter shortcuts: the user
    // presses what they see as Shift+L on their Dvorak keyboard, and we
    // honor it.
    const event = makeEvent({
      key: "L",
      code: DVORAK_LETTER_TO_CODE.l, // 'KeyP'
      ctrlKey: true,
      shiftKey: true,
    });
    expect(
      isExactShortcutMatch(event, "l", { ctrlKey: true, shiftKey: true }),
    ).toBe(true);
  });

  test("Ctrl+Shift+7 on Dvorak (digit row identical to QWERTY) still matches", () => {
    // Standard US Dvorak shares the digit row layout with QWERTY, so this
    // keypress is identical in both layouts.
    const event = makeEvent({
      key: "&",
      code: "Digit7",
      ctrlKey: true,
      shiftKey: true,
    });
    expect(isFormatNumberedList(event)).toBe(true);
  });

  test("Ctrl+B on Dvorak (the B key sits at QWERTY's 'n' position) still matches the layout-letter shortcut", () => {
    // Dvorak B is at QWERTY N. event.key is 'b', event.code is 'KeyN'.
    const event = makeEvent({
      key: "b",
      code: DVORAK_LETTER_TO_CODE.b, // 'KeyN'
      ctrlKey: true,
    });
    expect(isExactShortcutMatch(event, "b", { ctrlKey: true })).toBe(true);
  });

  test("Ctrl+K on QWERTY (the K key) fires isInsertLink", () => {
    const event = makeEvent({ key: "k", code: "KeyK", ctrlKey: true });
    expect(isInsertLink(event)).toBe(true);
  });

  test("Ctrl+V on Dvorak does not fire isInsertLink", () => {
    // Just paranoia — even though K and V map to different physical keys,
    // make sure no Dvorak basic-letter keypress accidentally fires a Ctrl+K
    // handler.
    const event = makeEvent({
      key: "v", code: DVORAK_LETTER_TO_CODE.v, ctrlKey: true,
    });
    expect(isInsertLink(event)).toBe(false);
  });
});

// --- Wrapper-function regression: heading shortcut ------------------------

describe("getFormatHeadingLevel", () => {
  // CONTROL_OR_META in the test environment is {ctrlKey: true, metaKey: false}
  // because navigator isn't defined and IS_APPLE is false.

  test("Ctrl+Alt+1 on QWERTY → heading 1", () => {
    const event = makeEvent({
      key: "1", code: "Digit1", ctrlKey: true, altKey: true,
    });
    expect(getFormatHeadingLevel(event)).toBe("1");
    expect(isFormatHeading(event)).toBe(true);
  });

  test("Ctrl+Alt+2 on QWERTY → heading 2", () => {
    const event = makeEvent({
      key: "2", code: "Digit2", ctrlKey: true, altKey: true,
    });
    expect(getFormatHeadingLevel(event)).toBe("2");
  });

  test("Ctrl+V on Dvorak does not get classified as a heading shortcut", () => {
    const event = makeEvent({
      key: "v", code: DVORAK_LETTER_TO_CODE.v, ctrlKey: true, altKey: true,
    });
    expect(getFormatHeadingLevel(event)).toBe(null);
  });
});
