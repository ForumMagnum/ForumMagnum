/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {TOGGLE_LINK_COMMAND} from '@lexical/link';
import {HeadingTagType} from '@lexical/rich-text';
import {
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  isModifierMatch,
  KEY_DOWN_COMMAND,
  LexicalEditor,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical';
import {Dispatch, useEffect} from 'react';

import {useToolbarState} from '../../context/ToolbarContext';
import {sanitizeUrl} from '../../utils/url';
import {INSERT_INLINE_COMMAND} from '../CommentPlugin';
import { INSERT_CODE_BLOCK_COMMAND } from '@/components/editor/lexicalPlugins/codeBlock/CodeBlockPlugin';
import { OPEN_MATH_EDITOR_COMMAND } from '@/components/editor/lexicalPlugins/math/MathPlugin';
import { INSERT_FOOTNOTE_COMMAND } from '@/components/editor/lexicalPlugins/footnotes/FootnotesPlugin';
import {
  clearFormatting,
  formatBulletList,
  formatCheckList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
  updateFontSize,
  UpdateFontSizeType,
} from '../ToolbarPlugin/utils';
import {
  isAddComment,
  isCapitalize,
  isClearFormatting,
  isDecreaseFontSize,
  isFormatBulletList,
  isFormatCheckList,
  isFormatCode,
  isFormatHeading,
  isFormatNumberedList,
  isFormatParagraph,
  isFormatQuote,
  isIncreaseFontSize,
  isIndent,
  isInsertCodeBlock,
  isInsertDisplayMath,
  isInsertInlineMath,
  isInsertLink,
  isInsertFootnote,
  isLowercase,
  isOutdent,
  isStrikeThrough,
  isSubscript,
  isSuperscript,
  isUppercase,
} from './shortcuts';

export default function ShortcutsPlugin({
  editor,
  setIsLinkEditMode,
}: {
  editor: LexicalEditor;
  setIsLinkEditMode: Dispatch<boolean>;
}): null {
  const {toolbarState} = useToolbarState();

  useEffect(() => {
    const keyboardShortcutsHandler = (event: KeyboardEvent) => {
      // Short-circuit, a least one modifier must be set
      if (isModifierMatch(event, {})) {
        return false;
      } else if (isFormatParagraph(event)) {
        formatParagraph(editor);
      } else if (isFormatHeading(event)) {
        const {code} = event;
        const headingSize = `h${code[code.length - 1]}` as HeadingTagType;
        formatHeading(editor, toolbarState.blockType, headingSize);
      } else if (isFormatBulletList(event)) {
        formatBulletList(editor, toolbarState.blockType);
      } else if (isFormatNumberedList(event)) {
        formatNumberedList(editor, toolbarState.blockType);
      } else if (isFormatCheckList(event)) {
        formatCheckList(editor, toolbarState.blockType);
      } else if (isFormatCode(event)) {
        formatCode(editor, toolbarState.blockType);
      } else if (isFormatQuote(event)) {
        formatQuote(editor, toolbarState.blockType);
      } else if (isStrikeThrough(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
      } else if (isLowercase(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'lowercase');
      } else if (isUppercase(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'uppercase');
      } else if (isCapitalize(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'capitalize');
      } else if (isIndent(event)) {
        editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
      } else if (isOutdent(event)) {
        editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
      } else if (isSubscript(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
      } else if (isSuperscript(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
      } else if (isInsertCodeBlock(event)) {
        editor.dispatchCommand(INSERT_CODE_BLOCK_COMMAND, undefined);
      } else if (isInsertInlineMath(event)) {
        editor.dispatchCommand(OPEN_MATH_EDITOR_COMMAND, { inline: true });
      } else if (isInsertDisplayMath(event)) {
        editor.dispatchCommand(OPEN_MATH_EDITOR_COMMAND, { inline: false });
      } else if (isIncreaseFontSize(event)) {
        updateFontSize(
          editor,
          UpdateFontSizeType.increment,
          toolbarState.fontSizeInputValue,
        );
      } else if (isDecreaseFontSize(event)) {
        updateFontSize(
          editor,
          UpdateFontSizeType.decrement,
          toolbarState.fontSizeInputValue,
        );
      } else if (isClearFormatting(event)) {
        clearFormatting(editor);
      } else if (isInsertLink(event)) {
        const url = toolbarState.isLink ? null : sanitizeUrl('https://');
        setIsLinkEditMode(!toolbarState.isLink);
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      } else if (isAddComment(event)) {
        editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined);
      } else if (isInsertFootnote(event)) {
        editor.dispatchCommand(INSERT_FOOTNOTE_COMMAND, {});
      } else {
        // No match for any of the event handlers
        return false;
      }
      event.preventDefault();
      return true;
    };

    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      keyboardShortcutsHandler,
      COMMAND_PRIORITY_NORMAL,
    );
  }, [
    editor,
    toolbarState.isLink,
    toolbarState.blockType,
    toolbarState.fontSizeInputValue,
    setIsLinkEditMode,
  ]);

  return null;
}
