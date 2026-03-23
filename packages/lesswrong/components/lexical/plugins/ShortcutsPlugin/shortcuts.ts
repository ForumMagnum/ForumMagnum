/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {IS_APPLE} from '@lexical/utils';
import {isModifierMatch} from 'lexical';

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
  '"': '\'',
  '<': ',',
  '>': '.',
  '?': '/',
};

export function getShortcutKey(event: KeyboardEvent): string {
  const {key} = event;
  if (key.length !== 1) {
    return key;
  }

  const normalizedKey = SHIFTED_KEY_ALIASES[key] ?? key;
  return normalizedKey.toLowerCase();
}

export function isFormatParagraph(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === '0' &&
    isModifierMatch(event, {...CONTROL_OR_META, altKey: true})
  );
}

export function isFormatHeading(event: KeyboardEvent): boolean {
  const keyNumber = getShortcutKey(event);

  return (
    ['1', '2', '3'].includes(keyNumber) &&
    isModifierMatch(event, {...CONTROL_OR_META, altKey: true})
  );
}

export function isFormatNumberedList(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === '7' &&
    isModifierMatch(event, {...CONTROL_OR_META, shiftKey: true})
  );
}

export function isFormatBulletList(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === '8' &&
    isModifierMatch(event, {...CONTROL_OR_META, shiftKey: true})
  );
}

export function isFormatCheckList(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === '9' &&
    isModifierMatch(event, {...CONTROL_OR_META, shiftKey: true})
  );
}

export function isFormatCode(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === 'c' &&
    isModifierMatch(event, {...CONTROL_OR_META, altKey: true})
  );
}

export function isFormatQuote(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === 'q' &&
    isModifierMatch(event, {
      ctrlKey: true,
      shiftKey: true,
    })
  );
}

export function isLowercase(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === '1' &&
    isModifierMatch(event, {ctrlKey: true, shiftKey: true})
  );
}

export function isUppercase(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === '2' &&
    isModifierMatch(event, {ctrlKey: true, shiftKey: true})
  );
}

export function isCapitalize(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === '3' &&
    isModifierMatch(event, {ctrlKey: true, shiftKey: true})
  );
}

export function isUnderline(event: KeyboardEvent): boolean {
  return getShortcutKey(event) === 'u' && isModifierMatch(event, CONTROL_OR_META);
}

export function isStrikeThrough(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === 'x' &&
    isModifierMatch(event, {...CONTROL_OR_META, shiftKey: true})
  );
}

export function isIndent(event: KeyboardEvent): boolean {
  return getShortcutKey(event) === ']' && isModifierMatch(event, CONTROL_OR_META);
}

export function isOutdent(event: KeyboardEvent): boolean {
  return getShortcutKey(event) === '[' && isModifierMatch(event, CONTROL_OR_META);
}

export function isCenterAlign(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === 'e' &&
    isModifierMatch(event, {...CONTROL_OR_META, shiftKey: true})
  );
}

export function isLeftAlign(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === 'l' &&
    isModifierMatch(event, {...CONTROL_OR_META, shiftKey: true})
  );
}

export function isRightAlign(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === 'r' &&
    isModifierMatch(event, {...CONTROL_OR_META, shiftKey: true})
  );
}

export function isJustifyAlign(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === 'j' &&
    isModifierMatch(event, {...CONTROL_OR_META, shiftKey: true})
  );
}

export function isSubscript(event: KeyboardEvent): boolean {
  return getShortcutKey(event) === ',' && isModifierMatch(event, CONTROL_OR_META);
}

export function isSuperscript(event: KeyboardEvent): boolean {
  return getShortcutKey(event) === '.' && isModifierMatch(event, CONTROL_OR_META);
}

export function isInsertCodeBlock(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === 'c' &&
    isModifierMatch(event, {...CONTROL_OR_META, shiftKey: true})
  );
}

export function isInsertInlineMath(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === '4' &&
    isModifierMatch(event, CONTROL_OR_META)
  );
}

export function isInsertDisplayMath(event: KeyboardEvent): boolean {
  return getShortcutKey(event) === 'm' && isModifierMatch(event, CONTROL_OR_META);
}

export function isIncreaseFontSize(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === '.' &&
    isModifierMatch(event, {...CONTROL_OR_META, shiftKey: true})
  );
}

export function isDecreaseFontSize(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === ',' &&
    isModifierMatch(event, {...CONTROL_OR_META, shiftKey: true})
  );
}

export function isClearFormatting(event: KeyboardEvent): boolean {
  return getShortcutKey(event) === '\\' && isModifierMatch(event, CONTROL_OR_META);
}

export function isInsertLink(event: KeyboardEvent): boolean {
  return getShortcutKey(event) === 'k' && isModifierMatch(event, CONTROL_OR_META);
}

export function isAddComment(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === 'm' &&
    isModifierMatch(event, {...CONTROL_OR_META, altKey: true})
  );
}

export function isInsertFootnote(event: KeyboardEvent): boolean {
  return (
    getShortcutKey(event) === 'f' &&
    isModifierMatch(event, {...CONTROL_OR_META, altKey: true})
  );
}
