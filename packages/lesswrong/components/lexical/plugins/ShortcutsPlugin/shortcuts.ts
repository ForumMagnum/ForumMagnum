/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {IS_APPLE} from '@lexical/utils';
import {isModifierMatch} from 'lexical';
import { KeyboardEventModifierMask } from 'node_modules/lexical/LexicalUtils';

//disable eslint sorting rule for quick reference to shortcuts
export const SHORTCUTS = Object.freeze({
  // (Ctrl|⌘) + (Alt|Option) + <key> shortcuts
  NORMAL: IS_APPLE ? '⌘+Opt+0' : 'Ctrl+Alt+0',
  HEADING1: IS_APPLE ? '⌘+Opt+1' : 'Ctrl+Alt+1',
  HEADING2: IS_APPLE ? '⌘+Opt+2' : 'Ctrl+Alt+2',
  HEADING3: IS_APPLE ? '⌘+Opt+3' : 'Ctrl+Alt+3',
  NUMBERED_LIST: IS_APPLE ? '⌘+Shift+7' : 'Ctrl+Shift+7',
  BULLET_LIST: IS_APPLE ? '⌘+Shift+8' : 'Ctrl+Shift+8',
  CHECK_LIST: IS_APPLE ? '⌘+Shift+9' : 'Ctrl+Shift+9',
  CODE_BLOCK: IS_APPLE ? '⌘+Opt+C' : 'Ctrl+Alt+C',
  QUOTE: IS_APPLE ? '⌃+Shift+Q' : 'Ctrl+Shift+Q',
  ADD_COMMENT: IS_APPLE ? '⌘+Opt+M' : 'Ctrl+Alt+M',
  FOOTNOTE: IS_APPLE ? '⌘+Opt+F' : 'Ctrl+Alt+F',

  // (Ctrl|⌘) + Shift + <key> shortcuts
  INCREASE_FONT_SIZE: IS_APPLE ? '⌘+Shift+.' : 'Ctrl+Shift+.',
  DECREASE_FONT_SIZE: IS_APPLE ? '⌘+Shift+,' : 'Ctrl+Shift+,',
  INSERT_CODE_BLOCK: IS_APPLE ? '⌘+Shift+C' : 'Ctrl+Shift+C',
  STRIKETHROUGH: IS_APPLE ? '⌘+Shift+X' : 'Ctrl+Shift+X',
  LOWERCASE: IS_APPLE ? '⌃+Shift+1' : 'Ctrl+Shift+1',
  UPPERCASE: IS_APPLE ? '⌃+Shift+2' : 'Ctrl+Shift+2',
  CAPITALIZE: IS_APPLE ? '⌃+Shift+3' : 'Ctrl+Shift+3',
  CENTER_ALIGN: IS_APPLE ? '⌘+Shift+E' : 'Ctrl+Shift+E',
  JUSTIFY_ALIGN: IS_APPLE ? '⌘+Shift+J' : 'Ctrl+Shift+J',
  LEFT_ALIGN: IS_APPLE ? '⌘+Shift+L' : 'Ctrl+Shift+L',
  RIGHT_ALIGN: IS_APPLE ? '⌘+Shift+R' : 'Ctrl+Shift+R',

  // (Ctrl|⌘) + <key> shortcuts
  SUBSCRIPT: IS_APPLE ? '⌘+,' : 'Ctrl+,',
  SUPERSCRIPT: IS_APPLE ? '⌘+.' : 'Ctrl+.',
  INDENT: IS_APPLE ? '⌘+]' : 'Ctrl+]',
  OUTDENT: IS_APPLE ? '⌘+[' : 'Ctrl+[',
  CLEAR_FORMATTING: IS_APPLE ? '⌘+\\' : 'Ctrl+\\',
  REDO: IS_APPLE ? '⌘+Shift+Z' : 'Ctrl+Y',
  UNDO: IS_APPLE ? '⌘+Z' : 'Ctrl+Z',
  BOLD: IS_APPLE ? '⌘+B' : 'Ctrl+B',
  ITALIC: IS_APPLE ? '⌘+I' : 'Ctrl+I',
  UNDERLINE: IS_APPLE ? '⌘+U' : 'Ctrl+U',
  INSERT_LINK: IS_APPLE ? '⌘+K' : 'Ctrl+K',
  INSERT_INLINE_MATH: IS_APPLE ? '⌘+4' : 'Ctrl+4',
  INSERT_DISPLAY_MATH: IS_APPLE ? '⌘+M' : 'Ctrl+M',
});

const CONTROL_OR_META = {ctrlKey: !IS_APPLE, metaKey: IS_APPLE};

const PUNCT_TO_CODE: Record<string, string> = {
  ',': 'Comma',
  '.': 'Period',
  '/': 'Slash',
  ';': 'Semicolon',
  "'": 'Quote',
  '[': 'BracketLeft',
  ']': 'BracketRight',
  '\\': 'Backslash',
  '`': 'Backquote',
  '-': 'Minus',
  '=': 'Equal',
};

function expectedKeyToCode(expectedKey: string): string | null {
  if (/^[a-z]$/i.test(expectedKey)) return 'Key' + expectedKey.toUpperCase();
  if (/^[0-9]$/.test(expectedKey)) return 'Digit' + expectedKey;
  return PUNCT_TO_CODE[expectedKey] ?? null;
}

// Inverse of the OS's shift transform on US-style layouts. We use this to
// recover the unshifted character so that shortcuts spelled "Cmd+Shift+7" can
// match an event whose `event.key` is `&`, etc.
const SHIFTED_KEY_ALIASES: Record<string, string> = {
  '~': '`',
  '!': '1',
  '@': '2',
  '#': '3',
  '$': '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  '_': '-',
  '+': '=',
  '{': '[',
  '}': ']',
  '|': '\\',
  ':': ';',
  '"': "'",
  '<': ',',
  '>': '.',
  '?': '/',
};

/**
 * Originally vendored from Lexical v0.41.0, then fixed locally. The upstream
 * version had two bugs: it constructed the expected `event.code` as
 * `'Key' + expectedKey.toUpperCase()`, which is only correct for letters
 * (digits use `Digit*`, punctuation uses `Comma`/`Period`/`BracketLeft`/...);
 * and it bailed out whenever `event.key` was any ASCII character, which breaks
 * shortcuts where Shift/Option transforms the produced char (e.g. Cmd+Shift+7
 * yields `&`, Cmd+Opt+1 on macOS yields `¡`).
 *
 * The Dvorak guard below must apply to all single-char ASCII produced keys,
 * not just letters: e.g. on US Dvorak the V key sits at QWERTY's Period
 * position, so falling through to `event.code` for the punctuation shortcut
 * `Ctrl+.` (isSuperscript) would cause `Ctrl+V` to swallow paste.
 */
export function isExactShortcutMatch(
  event: KeyboardEvent,
  expectedKey: string,
  mask: KeyboardEventModifierMask,
): boolean {
  if (!isModifierMatch(event, mask)) {
    return false;
  }

  if (expectedKey.length > 1) {
    // Named keys (Enter, Tab, ArrowUp, ...) can only be matched via event.key.
    return event.key.toLowerCase() === expectedKey.toLowerCase();
  }

  // Normalize the produced character by inverting the Shift transform (so
  // `&` → `7`, `>` → `.`, `M` → `m`). After normalization, shifted shortcuts
  // are matched against their unshifted expected key.
  const normalizedEventKey =
    event.key.length === 1
      ? (SHIFTED_KEY_ALIASES[event.key] ?? event.key).toLowerCase()
      : event.key;

  if (normalizedEventKey === expectedKey.toLowerCase()) {
    return true;
  }

  // The produced character is a printable ASCII character that does not match
  // the shortcut. This is the Dvorak case: the user pressed a key that their
  // layout maps to a different printable character (e.g. Ctrl+V on Dvorak
  // produces `v` at QWERTY's Period position). Don't fall through to
  // event.code — that would cause Ctrl+V on Dvorak to fire isSuperscript and
  // swallow paste.
  if (event.key.length === 1 && event.key.charCodeAt(0) <= 127) {
    return false;
  }

  // The produced character is non-ASCII (macOS Option-modified key, non-Latin
  // layout, ...). Fall back to physical position so the shortcut still fires.
  const expectedCode = expectedKeyToCode(expectedKey);
  return expectedCode !== null && event.code === expectedCode;
}

export function getFormatHeadingLevel(
  event: KeyboardEvent,
): '1' | '2' | '3' | null {
  if (isExactShortcutMatch(event, '1', {...CONTROL_OR_META, altKey: true})) {
    return '1';
  }
  if (isExactShortcutMatch(event, '2', {...CONTROL_OR_META, altKey: true})) {
    return '2';
  }
  if (isExactShortcutMatch(event, '3', {...CONTROL_OR_META, altKey: true})) {
    return '3';
  }
  return null;
}

export function isFormatParagraph(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, '0', {...CONTROL_OR_META, altKey: true});
}

export function isFormatHeading(event: KeyboardEvent): boolean {
  return getFormatHeadingLevel(event) !== null;
}

export function isFormatNumberedList(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, '7', {...CONTROL_OR_META, shiftKey: true});
}

export function isFormatBulletList(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, '8', {...CONTROL_OR_META, shiftKey: true});
}

export function isFormatCheckList(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, '9', {...CONTROL_OR_META, shiftKey: true});
}

export function isFormatCode(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, 'c', {...CONTROL_OR_META, altKey: true});
}

export function isFormatQuote(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, 'q', {
    ctrlKey: true,
    shiftKey: true,
  });
}

export function isLowercase(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, '1', {ctrlKey: true, shiftKey: true});
}

export function isUppercase(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, '2', {ctrlKey: true, shiftKey: true});
}

export function isCapitalize(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, '3', {ctrlKey: true, shiftKey: true});
}

export function isUnderline(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, 'u', CONTROL_OR_META);
}

export function isStrikeThrough(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, 'x', {...CONTROL_OR_META, shiftKey: true});
}

export function isIndent(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, ']', CONTROL_OR_META);
}

export function isOutdent(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, '[', CONTROL_OR_META);
}

export function isCenterAlign(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, 'e', {...CONTROL_OR_META, shiftKey: true});
}

export function isLeftAlign(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, 'l', {...CONTROL_OR_META, shiftKey: true});
}

export function isRightAlign(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, 'r', {...CONTROL_OR_META, shiftKey: true});
}

export function isJustifyAlign(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, 'j', {...CONTROL_OR_META, shiftKey: true});
}

export function isSubscript(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, ',', CONTROL_OR_META);
}

export function isSuperscript(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, '.', CONTROL_OR_META);
}

export function isInsertCodeBlock(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, 'c', {...CONTROL_OR_META, shiftKey: true});
}

export function isInsertInlineMath(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, '4', CONTROL_OR_META);
}

export function isInsertDisplayMath(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, 'm', CONTROL_OR_META);
}

export function isIncreaseFontSize(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, '.', {...CONTROL_OR_META, shiftKey: true});
}

export function isDecreaseFontSize(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, ',', {...CONTROL_OR_META, shiftKey: true});
}

export function isClearFormatting(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, '\\', CONTROL_OR_META);
}

export function isInsertLink(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, 'k', CONTROL_OR_META);
}

export function isAddComment(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, 'm', {...CONTROL_OR_META, altKey: true});
}

export function isInsertFootnote(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, 'f', {...CONTROL_OR_META, altKey: true});
}
