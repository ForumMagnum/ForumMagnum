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
import { PencilFillIcon } from '../../icons/PencilFillIcon';
import { EDIT_EXCALIDRAW_COMMAND } from '../../plugins/ExcalidrawPlugin/commands';
import {$isExcalidrawNode} from '.';
import ExcalidrawImage from './ExcalidrawImage';

const styles = defineStyles('LexicalExcalidrawComponent', (theme: ThemeType) => ({
  // This is the element that ImageResizer resizes (it looks for a <figure>)
  figure: {
    position: 'relative',
    width: 'fit-content',
    maxWidth: '100%',
    margin: '1em auto',
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
  editButton: {
    position: 'absolute',
    right: 4,
    top: 4,
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
}));

export default function ExcalidrawComponent({
  nodeKey,
  data,
  svg,
  widthPercent,
}: {
  data: string;
  nodeKey: NodeKey;
  svg: string;
  widthPercent: number | null;
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

  return (
    <figure
      className={classes.figure}
      style={widthPercent !== null ? {width: `${widthPercent}%`} : undefined}>
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
      {isSelected && isEditable && hasSceneData && (
        <div
          className={classes.editButton}
          role="button"
          aria-label="Edit diagram"
          tabIndex={0}
          onMouseDown={event => event.preventDefault()}
          onClick={openModal}>
          <PencilFillIcon />
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
    </figure>
  );
}
