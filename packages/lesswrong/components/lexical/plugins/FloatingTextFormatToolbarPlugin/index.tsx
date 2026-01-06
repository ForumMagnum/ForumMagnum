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
    padding: 8,
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
    marginTop: 2,
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
    padding: 8,
    verticalAlign: 'middle',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    width: 70,
    fontSize: 14,
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
    '@media (max-width: 1024px)': {
      display: 'none',
    },
  },
}));

function TextFormatFloatingToolbar({
  editor,
  anchorElem,
  isLink,
  isBold,
  isItalic,
  isUnderline,
  isUppercase,
  isLowercase,
  isCapitalize,
  isCode,
  isStrikethrough,
  isSubscript,
  isSuperscript,
  setIsLinkEditMode,
}: {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
  isBold: boolean;
  isCode: boolean;
  isItalic: boolean;
  isLink: boolean;
  isUppercase: boolean;
  isLowercase: boolean;
  isCapitalize: boolean;
  isStrikethrough: boolean;
  isSubscript: boolean;
  isSuperscript: boolean;
  isUnderline: boolean;
  setIsLinkEditMode: Dispatch<boolean>;
}): JSX.Element {
  const classes = useStyles(styles);
  const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);

  const insertLink = useCallback(() => {
    if (!isLink) {
      setIsLinkEditMode(true);
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    } else {
      setIsLinkEditMode(false);
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink, setIsLinkEditMode]);

  const insertComment = () => {
    editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined);
  };

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

  return (
    <div ref={popupCharStylesEditorRef} className={classes.popup}>
      {editor.isEditable() && (
        <>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
            }}
            className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isBold })}
            title="Bold"
            aria-label="Format text as bold">
            <i className={classNames(classes.format, 'bold')} />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
            }}
            className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isItalic })}
            title="Italic"
            aria-label="Format text as italics">
            <i className={classNames(classes.format, 'italic')} />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
            }}
            className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isUnderline })}
            title="Underline"
            aria-label="Format text to underlined">
            <i className={classNames(classes.format, 'underline')} />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
            }}
            className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isStrikethrough })}
            title="Strikethrough"
            aria-label="Format text with a strikethrough">
            <i className={classNames(classes.format, 'strikethrough')} />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
            }}
            className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isSubscript })}
            title="Subscript"
            aria-label="Format Subscript">
            <i className={classNames(classes.format, 'subscript')} />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
            }}
            className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isSuperscript })}
            title="Superscript"
            aria-label="Format Superscript">
            <i className={classNames(classes.format, 'superscript')} />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'uppercase');
            }}
            className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isUppercase })}
            title="Uppercase"
            aria-label="Format text to uppercase">
            <i className={classNames(classes.format, 'uppercase')} />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'lowercase');
            }}
            className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isLowercase })}
            title="Lowercase"
            aria-label="Format text to lowercase">
            <i className={classNames(classes.format, 'lowercase')} />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'capitalize');
            }}
            className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isCapitalize })}
            title="Capitalize"
            aria-label="Format text to capitalize">
            <i className={classNames(classes.format, 'capitalize')} />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
            }}
            className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isCode })}
            title="Insert code block"
            aria-label="Insert code block">
            <i className={classNames(classes.format, 'code')} />
          </button>
          <button
            type="button"
            onClick={insertLink}
            className={classNames(classes.popupItem, classes.spaced, { [classes.active]: isLink })}
            title="Insert link"
            aria-label="Insert link">
            <i className={classNames(classes.format, 'link')} />
          </button>
        </>
      )}
      <button
        type="button"
        onClick={insertComment}
        className={classNames(classes.popupItem, classes.spaced, classes.insertComment)}
        title="Insert comment"
        aria-label="Insert comment">
        <i className={classNames(classes.format, 'add-comment')} />
      </button>
    </div>
  );
}

function useFloatingTextFormatToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  setIsLinkEditMode: Dispatch<boolean>,
): JSX.Element | null {
  const [isText, setIsText] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isUppercase, setIsUppercase] = useState(false);
  const [isLowercase, setIsLowercase] = useState(false);
  const [isCapitalize, setIsCapitalize] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);

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
      setIsUnderline(selection.hasFormat('underline'));
      setIsUppercase(selection.hasFormat('uppercase'));
      setIsLowercase(selection.hasFormat('lowercase'));
      setIsCapitalize(selection.hasFormat('capitalize'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsCode(selection.hasFormat('code'));

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
      isUppercase={isUppercase}
      isLowercase={isLowercase}
      isCapitalize={isCapitalize}
      isStrikethrough={isStrikethrough}
      isSubscript={isSubscript}
      isSuperscript={isSuperscript}
      isUnderline={isUnderline}
      isCode={isCode}
      setIsLinkEditMode={setIsLinkEditMode}
    />,
    anchorElem,
  );
}

export default function FloatingTextFormatToolbarPlugin({
  anchorElem = document.body,
  setIsLinkEditMode,
}: {
  anchorElem?: HTMLElement;
  setIsLinkEditMode: Dispatch<boolean>;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  return useFloatingTextFormatToolbar(editor, anchorElem, setIsLinkEditMode);
}
