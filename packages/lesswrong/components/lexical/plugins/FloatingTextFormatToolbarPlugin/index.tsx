/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';

import {$isCodeHighlightNode} from '@lexical/code';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import {$isLinkNode, TOGGLE_LINK_COMMAND} from '@lexical/link';

import { TypeBoldIcon } from '../../icons/TypeBoldIcon';
import { TypeItalicIcon } from '../../icons/TypeItalicIcon';
import { TypeStrikethroughIcon } from '../../icons/TypeStrikethroughIcon';
import { CodeIcon } from '../../icons/CodeIcon';
import { LinkIcon } from '../../icons/LinkIcon';
import { ChatLeftTextIcon } from '../../icons/ChatLeftTextIcon';
import { ChatSquareQuoteIcon } from '../../icons/ChatSquareQuoteIcon';
import { ListOlIcon } from '../../icons/ListOlIcon';
import { ListUlIcon } from '../../icons/ListUlIcon';
import { CaretRightFillIcon } from '../../icons/CaretRightFillIcon';
import { CkFootnoteIcon } from '../../icons/CkFootnoteIcon';
import { CkMathIcon } from '../../icons/CkMathIcon';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {mergeRegister} from '@lexical/utils';
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  getDOMSelection,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import {Dispatch, useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

import {getDOMRangeRect} from '../../utils/getDOMRangeRect';
import {getSelectedNode} from '../../utils/getSelectedNode';
import {setFloatingElemPosition} from '../../utils/setFloatingElemPosition';
import {INSERT_INLINE_COMMAND} from '../CommentPlugin';
import { useToolbarState } from '../../context/ToolbarContext';
import {
  formatBulletList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
} from '../ToolbarPlugin/utils';
import { OPEN_MATH_EDITOR_COMMAND } from '@/components/editor/lexicalPlugins/math/MathPlugin';
import { INSERT_FOOTNOTE_COMMAND } from '@/components/editor/lexicalPlugins/footnotes/FootnotesPlugin';
import { INSERT_COLLAPSIBLE_SECTION_COMMAND } from '@/components/editor/lexicalPlugins/collapsibleSections/CollapsibleSectionsPlugin';
import { SHORTCUTS } from '../ShortcutsPlugin/shortcuts';

const styles = defineStyles('LexicalFloatingTextFormatToolbar', (theme: ThemeType) => ({
  popup: {
    display: 'flex',
    background: theme.palette.grey[0],
    padding: 4,
    verticalAlign: 'middle',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    opacity: 0,
    boxShadow: `0px 5px 10px ${theme.palette.greyAlpha(0.3)}`,
    borderRadius: 8,
    transition: 'opacity 0.5s',
    height: 35,
    willChange: 'transform',
  },
  popupItem: {
    border: 0,
    display: 'flex',
    background: 'none',
    borderRadius: 10,
    padding: 5,
    cursor: 'pointer',
    verticalAlign: 'middle',
    '&:disabled': {
      cursor: 'not-allowed',
    },
    '&:hover:not([disabled])': {
      backgroundColor: theme.palette.grey[200],
    },
  },
  spaced: {
    marginRight: 2,
  },
  format: {
    backgroundSize: 'contain',
    height: 18,
    width: 18,
    verticalAlign: '-0.25em',
    display: 'flex',
    opacity: 0.6,
  },
  formatDisabled: {
    opacity: 0.2,
  },
  active: {
    backgroundColor: theme.palette.greyAlpha(0.03),
    '& $format': {
      opacity: 1,
    },
  },
  selectPopupItem: {
    border: 0,
    display: 'flex',
    background: 'none',
    borderRadius: 10,
    padding: 5,
    verticalAlign: 'middle',
    width: 100,
    fontSize: 12,
    color: theme.palette.grey[600],
    textOverflow: 'ellipsis',
  },
  codeLanguage: {
    textTransform: 'capitalize',
    width: 130,
  },
  text: {
    display: 'flex',
    lineHeight: '20px',
    verticalAlign: 'middle',
    fontSize: 14,
    color: theme.palette.grey[600],
    textOverflow: 'ellipsis',
    width: 70,
    overflow: 'hidden',
    height: 20,
    textAlign: 'left',
  },
  icon: {
    display: 'flex',
    width: 20,
    height: 20,
    userSelect: 'none',
    marginRight: 8,
    lineHeight: '16px',
    backgroundSize: 'contain',
  },
  chevronDown: {
    marginTop: 3,
    width: 16,
    height: 16,
    display: 'flex',
    userSelect: 'none',
  },
  chevronDownInside: {
    width: 16,
    height: 16,
    display: 'flex',
    marginLeft: -25,
    marginTop: 11,
    marginRight: 10,
    pointerEvents: 'none',
  },
  divider: {
    width: 1,
    backgroundColor: theme.palette.grey[200],
    margin: '0 4px',
  },
  insertComment: {
    marginTop: 2,
  },
  insertCommentText: {
    color: theme.palette.grey[600],
    fontSize: 12,
    marginLeft: 4,
  },
  shortcut: {
    color: theme.palette.grey[400],
    fontSize: 12,
    marginLeft: 4,
  },
}));

type FloatingToolbarVariant = 'post' | 'comment';
type HeadingOption = 'paragraph' | 'h1' | 'h2' | 'h3';

function TextFormatFloatingToolbar({
  editor,
  anchorElem,
  isLink,
  isBold,
  isItalic,
  isStrikethrough,
  setIsLinkEditMode,
  blockType,
  variant,
  showInlineCommentButton,
}: {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
  isBold: boolean;
  isItalic: boolean;
  isLink: boolean;
  isStrikethrough: boolean;
  setIsLinkEditMode: Dispatch<boolean>;
  blockType: string;
  variant: FloatingToolbarVariant;
  showInlineCommentButton: boolean;
}): JSX.Element {
  const classes = useStyles(styles);
  const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);

  const insertLink = useCallback(() => {
    if (!isLink) {
      setIsLinkEditMode(true);
    } else {
      setIsLinkEditMode(false);
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink, setIsLinkEditMode]);

  const insertComment = () => {
    editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined);
  };

  const headingValue: HeadingOption = ['paragraph', 'h1', 'h2', 'h3'].includes(blockType)
    ? (blockType as HeadingOption)
    : 'paragraph';

  const handleHeadingChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextValue = event.target.value as HeadingOption;
      if (nextValue === 'paragraph') {
        formatParagraph(editor);
        return;
      }
      formatHeading(editor, blockType, nextValue);
    },
    [editor, blockType],
  );

  function mouseMoveListener(e: MouseEvent) {
    if (
      popupCharStylesEditorRef?.current &&
      (e.buttons === 1 || e.buttons === 3)
    ) {
      if (popupCharStylesEditorRef.current.style.pointerEvents !== 'none') {
        const x = e.clientX;
        const y = e.clientY;
        const elementUnderMouse = document.elementFromPoint(x, y);

        if (!popupCharStylesEditorRef.current.contains(elementUnderMouse)) {
          // Mouse is not over the target element => not a normal click, but probably a drag
          popupCharStylesEditorRef.current.style.pointerEvents = 'none';
        }
      }
    }
  }
  function mouseUpListener(e: MouseEvent) {
    if (popupCharStylesEditorRef?.current) {
      if (popupCharStylesEditorRef.current.style.pointerEvents !== 'auto') {
        popupCharStylesEditorRef.current.style.pointerEvents = 'auto';
      }
    }
  }

  useEffect(() => {
    if (popupCharStylesEditorRef?.current) {
      document.addEventListener('mousemove', mouseMoveListener);
      document.addEventListener('mouseup', mouseUpListener);

      return () => {
        document.removeEventListener('mousemove', mouseMoveListener);
        document.removeEventListener('mouseup', mouseUpListener);
      };
    }
  }, [popupCharStylesEditorRef]);

  const $updateTextFormatFloatingToolbar = useCallback(() => {
    const selection = $getSelection();

    const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
    const nativeSelection = getDOMSelection(editor._window);

    if (popupCharStylesEditorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      nativeSelection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const rangeRect = getDOMRangeRect(nativeSelection, rootElement);

      setFloatingElemPosition(
        rangeRect,
        popupCharStylesEditorElem,
        anchorElem,
        isLink,
      );
    }
  }, [editor, anchorElem, isLink]);

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement;

    const update = () => {
      editor.getEditorState().read(() => {
        $updateTextFormatFloatingToolbar();
      });
    };

    window.addEventListener('resize', update);
    if (scrollerElem) {
      scrollerElem.addEventListener('scroll', update);
    }

    return () => {
      window.removeEventListener('resize', update);
      if (scrollerElem) {
        scrollerElem.removeEventListener('scroll', update);
      }
    };
  }, [editor, $updateTextFormatFloatingToolbar, anchorElem]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      $updateTextFormatFloatingToolbar();
    });
    return mergeRegister(
      editor.registerUpdateListener(({editorState}) => {
        editorState.read(() => {
          $updateTextFormatFloatingToolbar();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateTextFormatFloatingToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, $updateTextFormatFloatingToolbar]);

  const boldButton = (
    <button
      type="button"
      onClick={() => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
      }}
      className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isBold })}
      title="Bold"
      aria-label="Format text as bold">
      <TypeBoldIcon className={classes.format} />
    </button>
  );

  const italicButton = (
    <button
      type="button"
      onClick={() => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
      }}
      className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isItalic })}
      title="Italic"
      aria-label="Format text as italics">
      <TypeItalicIcon className={classes.format} />
    </button>
  );

  const strikethroughButton = (
    <button
      type="button"
      onClick={() => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
      }}
      className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isStrikethrough })}
      title="Strikethrough"
      aria-label="Format text with a strikethrough">
      <TypeStrikethroughIcon className={classes.format} />
    </button>
  );

  const linkButton = (
    <button
      type="button"
      onClick={insertLink}
      className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isLink })}
      title="Insert link"
      aria-label="Insert link">
      <LinkIcon className={classes.format} />
    </button>
  );

  const quoteButton = (
    <button
      type="button"
      onClick={() => {
        formatQuote(editor, blockType);
      }}
      className={classNames(classes.popupItem, classes.spaced, { [classes.active]: blockType === 'quote' })}
      title="Block quote"
      aria-label="Format selection as block quote">
      <ChatSquareQuoteIcon className={classes.format} />
    </button>
  );

  const bulletListButton = (
    <button
      type="button"
      onClick={() => {
        formatBulletList(editor, blockType);
      }}
      className={classNames(classes.popupItem, classes.spaced, { [classes.active]: blockType === 'bullet' })}
      title="Bulleted list"
      aria-label="Format selection as bulleted list">
      <ListUlIcon className={classes.format} />
    </button>
  );

  const numberedListButton = (
    <button
      type="button"
      onClick={() => {
        formatNumberedList(editor, blockType);
      }}
      className={classNames(classes.popupItem, classes.spaced, { [classes.active]: blockType === 'number' })}
      title="Numbered list"
      aria-label="Format selection as numbered list">
      <ListOlIcon className={classes.format} />
    </button>
  );

  const codeButton = (
    <button
      type="button"
      onClick={() => {
        formatCode(editor, blockType);
      }}
      className={classNames(classes.popupItem, classes.spaced, { [classes.active]: blockType === 'code' })}
      title="Code block"
      aria-label="Format selection as code block">
      <CodeIcon className={classes.format} />
    </button>
  );

  const mathButton = (
    <button
      type="button"
      onClick={() => {
        editor.dispatchCommand(OPEN_MATH_EDITOR_COMMAND, { inline: true });
      }}
      className={classNames(classes.popupItem, classes.spaced)}
      title="Insert equation"
      aria-label="Insert equation">
      <CkMathIcon className={classes.format} />
    </button>
  );

  const footnoteButton = (
    <button
      type="button"
      onClick={() => {
        editor.dispatchCommand(INSERT_FOOTNOTE_COMMAND, {});
      }}
      className={classNames(classes.popupItem, classes.spaced)}
      title="Insert footnote"
      aria-label="Insert footnote">
      <CkFootnoteIcon className={classes.format} />
    </button>
  );

  const commentButton = (
    <button
      type="button"
      onClick={insertComment}
      className={classNames(classes.popupItem, classes.spaced, classes.insertComment)}
      title="Insert comment"
      aria-label="Insert comment">
      <ChatLeftTextIcon className={classes.format} />
      <span className={classes.insertCommentText}>Comment</span>
      <span className={classes.shortcut}>{SHORTCUTS.ADD_COMMENT}</span>
    </button>
  );

  const headingSelect = (
    <select
      value={headingValue}
      onChange={handleHeadingChange}
      className={classNames(classes.selectPopupItem, classes.spaced)}
      aria-label="Block style">
      <option value="paragraph">Paragraph</option>
      <option value="h1">Heading 1</option>
      <option value="h2">Heading 2</option>
      <option value="h3">Heading 3</option>
    </select>
  );

  const collapsibleSectionButton = (
    <button
      type="button"
      onClick={() => {
        editor.dispatchCommand(INSERT_COLLAPSIBLE_SECTION_COMMAND, undefined);
      }}
      className={classNames(classes.popupItem, classes.spaced)}
      title="Insert collapsible section"
      aria-label="Insert collapsible section">
      <CaretRightFillIcon className={classes.format} />
    </button>
  );

  const groups: Array<JSX.Element[]> = [
    ...(showInlineCommentButton ? [[commentButton]] : []),
    [headingSelect],
    [boldButton, italicButton, strikethroughButton],
    [linkButton],
    [quoteButton, bulletListButton, numberedListButton],
    ...(variant === 'post' ? [[codeButton]] : []),
    [mathButton, footnoteButton, ...(variant === 'comment' ? [collapsibleSectionButton] : [])],
  ];

  const visibleGroups = groups.filter((group) => group.length > 0);

  return (
    <div ref={popupCharStylesEditorRef} className={classes.popup}>
      {editor.isEditable() && visibleGroups.map((group, index) => (
        <React.Fragment key={`group-${index}`}>
          {index > 0 && <span className={classes.divider} />}
          {group}
        </React.Fragment>
      ))}
    </div>
  );
}

function useFloatingTextFormatToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  setIsLinkEditMode: Dispatch<boolean>,
  variant: FloatingToolbarVariant,
  showInlineCommentButton: boolean,
): JSX.Element | null {
  const [isText, setIsText] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const { toolbarState } = useToolbarState();

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not to pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return;
      }
      const selection = $getSelection();
      const nativeSelection = getDOMSelection(editor._window);
      const rootElement = editor.getRootElement();

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) ||
          rootElement === null ||
          !rootElement.contains(nativeSelection.anchorNode))
      ) {
        setIsText(false);
        return;
      }

      if (!$isRangeSelection(selection)) {
        return;
      }

      const node = getSelectedNode(selection);

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));

      // Update links
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      if (
        !$isCodeHighlightNode(selection.anchor.getNode()) &&
        selection.getTextContent() !== ''
      ) {
        setIsText($isTextNode(node) || $isParagraphNode(node));
      } else {
        setIsText(false);
      }

      const rawTextContent = selection.getTextContent().replace(/\n/g, '');
      if (!selection.isCollapsed() && rawTextContent === '') {
        setIsText(false);
        return;
      }
    });
  }, [editor]);

  useEffect(() => {
    document.addEventListener('selectionchange', updatePopup);
    return () => {
      document.removeEventListener('selectionchange', updatePopup);
    };
  }, [updatePopup]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePopup();
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false);
        }
      }),
    );
  }, [editor, updatePopup]);

  if (!isText) {
    return null;
  }

  return createPortal(
    <TextFormatFloatingToolbar
      editor={editor}
      anchorElem={anchorElem}
      isLink={isLink}
      isBold={isBold}
      isItalic={isItalic}
      isStrikethrough={isStrikethrough}
      blockType={toolbarState.blockType}
      setIsLinkEditMode={setIsLinkEditMode}
      variant={variant}
      showInlineCommentButton={showInlineCommentButton}
    />,
    anchorElem,
  );
}

export default function FloatingTextFormatToolbarPlugin({
  anchorElem = document.body,
  setIsLinkEditMode,
  variant = 'post',
  showInlineCommentButton = false,
}: {
  anchorElem?: HTMLElement;
  setIsLinkEditMode: Dispatch<boolean>;
  variant?: FloatingToolbarVariant;
  showInlineCommentButton?: boolean;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  return useFloatingTextFormatToolbar(
    editor,
    anchorElem,
    setIsLinkEditMode,
    variant,
    showInlineCommentButton
  );
}
