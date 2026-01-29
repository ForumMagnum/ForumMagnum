/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $canShowPlaceholderCurry } from '@lexical/text';
import { mergeRegister } from '@lexical/utils';
import { KEY_DOWN_COMMAND, PASTE_COMMAND } from 'lexical';
import { eventFiles } from '@lexical/rich-text';
import {
  BEFOREINPUT_EVENT_COMMAND,
  COMPOSITION_START_EVENT_COMMAND,
  INPUT_EVENT_COMMAND,
} from '@/components/editor/lexicalPlugins/suggestions/Events';

import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LexicalContentEditable', (theme: ThemeType) => ({
  root: {
    border: 0,
    display: 'block',
    position: 'relative',
    outline: 0,
    minHeight: 150,
    height: '100%',
    '& hr': {
      height: 'auto',
    },
  },
  rootComment: {
    minHeight: 'var(--lexical-comment-min-height, 60px)',
  },
  placeholder: {
    fontSize: 15,
    color: theme.palette.grey[550],
    position: 'absolute',
    top: 0,
    left: 0,
    right: 28,
    userSelect: 'none',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    display: 'block',
    pointerEvents: 'none',
  },
  placeholderComment: {
    fontSize: 14,
    top: 'var(--lexical-comment-placeholder-top, 0px)',
    left: 'var(--lexical-comment-placeholder-left, 0px)',
    transform: 'var(--lexical-comment-placeholder-transform, none)',
    whiteSpace: 'normal',
  },
}));

type Props = {
  className?: string;
  placeholderClassName?: string;
  placeholder: string;
  variant?: 'comment';
  isSuggestionMode?: boolean;
};

export default function LexicalContentEditable({
  className,
  placeholder,
  placeholderClassName,
  variant,
  isSuggestionMode = false,
}: Props): JSX.Element {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const [isEditable, setEditable] = useState(editor.isEditable());
  const [canShowPlaceholder, setCanShowPlaceholder] = useState(() => {
    return editor.getEditorState().read($canShowPlaceholderCurry(editor.isComposing()));
  });
  const isSuggestionModeRef = useRef(isSuggestionMode);
  const cleanupRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    isSuggestionModeRef.current = isSuggestionMode;
  }, [isSuggestionMode]);

  const handleRef = useCallback(
    (rootElement: null | HTMLElement) => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      if (rootElement) {
        const handleCompositionStart = (event: CompositionEvent) => {
          editor.dispatchCommand(COMPOSITION_START_EVENT_COMMAND, event);
        };
        const handleKeyDown = (event: KeyboardEvent) => {
          if (isSuggestionModeRef.current) {
            // We don't want to preventDefault keydown as that can stop beforeinput events.
            event.stopImmediatePropagation();
            editor.dispatchCommand(KEY_DOWN_COMMAND, event);
          }
        };
        const handleInput = (event: InputEvent) => {
          if (isSuggestionModeRef.current) {
            event.preventDefault();
            event.stopImmediatePropagation();
            editor.dispatchCommand(INPUT_EVENT_COMMAND, event);
          }
        };
        const handleBeforeInput = (event: InputEvent) => {
          if (isSuggestionModeRef.current) {
            event.preventDefault();
            event.stopImmediatePropagation();
            editor.dispatchCommand(BEFOREINPUT_EVENT_COMMAND, event);
          }
        };
        const handlePaste = (event: ClipboardEvent) => {
          const [, files, hasTextContent] = eventFiles(event);
          if (isSuggestionModeRef.current && files.length > 0 && !hasTextContent) {
            event.preventDefault();
            event.stopImmediatePropagation();
            editor.dispatchCommand(PASTE_COMMAND, event);
          }
        };

        rootElement.addEventListener('compositionstart', handleCompositionStart);
        rootElement.addEventListener('keydown', handleKeyDown);
        rootElement.addEventListener('input', handleInput);
        rootElement.addEventListener('beforeinput', handleBeforeInput);
        rootElement.addEventListener('paste', handlePaste);

        cleanupRef.current = () => {
          rootElement.removeEventListener('compositionstart', handleCompositionStart);
          rootElement.removeEventListener('keydown', handleKeyDown);
          rootElement.removeEventListener('input', handleInput);
          rootElement.removeEventListener('beforeinput', handleBeforeInput);
          rootElement.removeEventListener('paste', handlePaste);
        };
      }

      if (rootElement && rootElement.ownerDocument && rootElement.ownerDocument.defaultView) {
        editor.setRootElement(rootElement);
      } else {
        editor.setRootElement(null);
      }
    },
    [editor],
  );

  useLayoutEffect(() => {
    setEditable(editor.isEditable());
    return editor.registerEditableListener((currentIsEditable) => {
      setEditable(currentIsEditable);
    });
  }, [editor]);

  useLayoutEffect(() => {
    const resetCanShowPlaceholder = () => {
      const nextValue = editor.getEditorState().read($canShowPlaceholderCurry(editor.isComposing()));
      setCanShowPlaceholder(nextValue);
    };
    resetCanShowPlaceholder();
    return mergeRegister(
      editor.registerUpdateListener(() => {
        resetCanShowPlaceholder();
      }),
      editor.registerEditableListener(() => {
        resetCanShowPlaceholder();
      }),
    );
  }, [editor]);

  return (
    <>
      <div
        aria-placeholder={placeholder}
        className={classNames(classes.root, variant === 'comment' && classes.rootComment, className)}
        contentEditable={isEditable}
        ref={handleRef}
        role={isEditable ? 'textbox' : undefined}
        spellCheck
      />
      {canShowPlaceholder && (
        <div
          className={classNames(
            classes.placeholder,
            variant === 'comment' && classes.placeholderComment,
            placeholderClassName,
          )}
        >
          {placeholder}
        </div>
      )}
    </>
  );
}
