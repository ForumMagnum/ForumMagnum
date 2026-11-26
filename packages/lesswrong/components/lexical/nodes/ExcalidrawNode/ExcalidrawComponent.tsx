// Vendored from: https://github.com/facebook/lexical/commit/2e0f8fa65f7c9a389603008671d120bbd1f71d7a
"use client";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// LessWrong modifications from upstream:
//  * Displays the SVG stored on the node (see ExcalidrawImage), so displaying a
//    diagram doesn't require loading Excalidraw.
//  * The modal for editing the diagram is owned by ExcalidrawPlugin, and
//    opened with EDIT_EXCALIDRAW_COMMAND.
//  * Uses our (percent-based) ImageResizer, and JSS styles instead of the
//    playground's global CSS.
//  * A diagram without scene data (eg one that was imported from sanitized
//    HTML) is displayed but can't be opened for editing.
//  * There's a button for adding and removing a caption.

import type {NodeKey} from 'lexical';
import type {JSX} from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useLexicalEditable} from '@lexical/react/useLexicalEditable';
import {useLexicalNodeSelection} from '@lexical/react/useLexicalNodeSelection';
import {mergeRegister} from '@lexical/utils';
import {
  $getNodeByKey,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  isDOMNode,
} from 'lexical';
import * as React from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';
import classNames from 'classnames';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { EXCALIDRAW_DARK_MODE_FILTER } from '@/lib/lexical/excalidrawDiagrams';
import ImageResizer from '../../ui/ImageResizer';
import { ChatSquareQuoteIcon } from '../../icons/ChatSquareQuoteIcon';
import { PencilFillIcon } from '../../icons/PencilFillIcon';
import {
  EDIT_EXCALIDRAW_COMMAND,
  TOGGLE_EXCALIDRAW_CAPTION_COMMAND,
} from '../../plugins/ExcalidrawPlugin/commands';
import {$isExcalidrawNode} from '.';
import ExcalidrawImage from './ExcalidrawImage';

const styles = defineStyles('LexicalExcalidrawComponent', (theme: ThemeType) => ({
  diagram: {
    position: 'relative',
    width: 'fit-content',
    maxWidth: '100%',
    margin: '0 auto',
  },
  resizedDiagram: {
    width: '100%',
  },
  button: {
    display: 'block',
    width: '100%',
    border: 0,
    padding: 0,
    backgroundColor: 'transparent',
    cursor: 'default',
  },
  selected: {
    outline: `2px solid ${theme.palette.lexicalEditor.focusRing}`,
    userSelect: 'none',
  },
  image: {
    '& svg': {
      display: 'block',
      maxWidth: '100%',
      height: 'auto',
      ...(theme.dark && {
        filter: EXCALIDRAW_DARK_MODE_FILTER,
      }),
    },
  },
  resizedImage: {
    '& svg': {
      width: '100%',
    },
  },
  overlayButtons: {
    position: 'absolute',
    right: 4,
    top: 4,
    display: 'flex',
    gap: 4,
  },
  overlayButton: {
    width: 35,
    height: 35,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${theme.palette.greyAlpha(0.3)}`,
    borderRadius: 5,
    backgroundColor: theme.palette.panelBackground.default,
    color: theme.palette.grey[800],
    cursor: 'pointer',
    userSelect: 'none',
    '&:hover': {
      backgroundColor: theme.palette.lexicalEditor.editButtonHover,
    },
  },
  activeOverlayButton: {
    borderColor: theme.palette.lexicalEditor.focusRing,
    color: theme.palette.lexicalEditor.focusRing,
  },
}));

export default function ExcalidrawComponent({
  nodeKey,
  data,
  svg,
  widthPercent,
  hasCaption,
}: {
  data: string;
  nodeKey: NodeKey;
  svg: string;
  widthPercent: number | null;
  hasCaption: boolean;
}): JSX.Element | null {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  // Diagrams imported without their scene data can't be edited
  const hasSceneData = data !== '[]';

  const openModal = useCallback(() => {
    editor.dispatchCommand(EDIT_EXCALIDRAW_COMMAND, nodeKey);
  }, [editor, nodeKey]);

  const toggleCaption = (event: React.MouseEvent) => {
    // Adding or removing a caption replaces the DOM that this is rendered
    // into (see ExcalidrawNode.createDOM). If the click then reached the
    // editor's own click handling, it would be a click on an element that's
    // no longer in the editor, which deselects the diagram.
    event.stopPropagation();
    editor.dispatchCommand(TOGGLE_EXCALIDRAW_CAPTION_COMMAND, nodeKey);
  };

  // Adding or removing a caption replaces the DOM that this is rendered into
  // (see ExcalidrawNode.createDOM). A selected diagram normally has the
  // keyboard focus, from having been clicked on; that focus is lost along
  // with the old DOM, and without it keyboard input doesn't reach the editor.
  useEffect(() => {
    if (isSelected && document.activeElement === document.body) {
      buttonRef.current?.focus({preventScroll: true});
    }
  }, [isSelected]);

  // The width goes on the <figure> that this is inside of (see
  // ExcalidrawNode.createDOM), which is also what ImageResizer resizes.
  useEffect(() => {
    const figureElement = imageContainerRef.current?.closest('figure');
    if (!figureElement) {
      return;
    }
    if (widthPercent !== null) {
      figureElement.style.width = `${widthPercent}%`;
    } else {
      figureElement.style.removeProperty('width');
    }
  }, [widthPercent]);

  useEffect(() => {
    if (!isEditable) {
      if (isSelected) {
        clearSelection();
      }
      return;
    }
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          const buttonElem = buttonRef.current;
          const eventTarget = event.target;

          if (isResizing) {
            return true;
          }

          if (
            buttonElem !== null &&
            isDOMNode(eventTarget) &&
            buttonElem.contains(eventTarget)
          ) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(!isSelected);
            if (event.detail > 1 && hasSceneData) {
              openModal();
            }
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [clearSelection, editor, isSelected, isResizing, setSelected, isEditable, hasSceneData, openModal]);

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const onResizeEnd = (nextWidthPercent: number | null) => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false);
    }, 200);

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);

      if ($isExcalidrawNode(node)) {
        node.setWidthPercent(nextWidthPercent);
      }
    });
  };

  if (svg === '') {
    return null;
  }

  const captionButtonLabel = hasCaption ? 'Remove caption' : 'Add caption';

  return (
    <div
      className={classNames(
        classes.diagram,
        widthPercent !== null && classes.resizedDiagram,
      )}>
      {/* type="button", so that clicking it doesn't submit a form that the
          editor is inside of */}
      <button
        ref={buttonRef}
        type="button"
        className={classNames(classes.button, isSelected && classes.selected)}>
        <ExcalidrawImage
          imageContainerRef={imageContainerRef}
          className={classNames(
            classes.image,
            widthPercent !== null && classes.resizedImage,
          )}
          svg={svg}
        />
      </button>
      {isSelected && isEditable && (
        <div className={classes.overlayButtons}>
          <div
            className={classNames(
              classes.overlayButton,
              hasCaption && classes.activeOverlayButton,
            )}
            role="button"
            aria-label={captionButtonLabel}
            aria-pressed={hasCaption}
            title={captionButtonLabel}
            tabIndex={0}
            onMouseDown={event => event.preventDefault()}
            onClick={toggleCaption}>
            <ChatSquareQuoteIcon />
          </div>
          {hasSceneData && (
            <div
              className={classes.overlayButton}
              role="button"
              aria-label="Edit diagram"
              title="Edit diagram"
              tabIndex={0}
              onMouseDown={event => event.preventDefault()}
              onClick={openModal}>
              <PencilFillIcon />
            </div>
          )}
        </div>
      )}
      {(isSelected || isResizing) && isEditable && (
        <ImageResizer
          nodeKey={nodeKey}
          imageRef={imageContainerRef}
          editor={editor}
          onResizeStart={onResizeStart}
          onResizeEnd={onResizeEnd}
        />
      )}
    </div>
  );
}
