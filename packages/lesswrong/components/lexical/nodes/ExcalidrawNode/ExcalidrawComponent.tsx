/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {ExcalidrawInitialElements} from '../../ui/ExcalidrawModal';
// @ts-ignore - @excalidraw/excalidraw types not installed yet
import type {AppState, BinaryFiles} from '@excalidraw/excalidraw/types';
import type {NodeKey} from 'lexical';
import React, { type JSX } from 'react';

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
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {defineStyles, useStyles} from '@/components/hooks/useStyles';
import classNames from 'classnames';
import ExcalidrawModal from '../../ui/ExcalidrawModal';
import ImageResizer from '../../ui/ImageResizer';
import {$isExcalidrawNode} from '.';
import ExcalidrawImage from './ExcalidrawImage';
import {PencilFillIcon} from '../../icons/PencilFillIcon';

const styles = defineStyles('LexicalExcalidrawComponent', (theme: ThemeType) => ({
  excalidrawButton: {
    border: 0,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
  },
  selected: {
    outline: `2px solid ${theme.palette.primary.main}`,
    userSelect: 'none',
  },
  imageEditButton: {
    border: `1px solid ${theme.palette.greyAlpha(0.3)}`,
    borderRadius: 5,
    backgroundSize: 16,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    width: 35,
    height: 35,
    verticalAlign: '-0.25em',
    position: 'absolute',
    right: 4,
    top: 4,
    cursor: 'pointer',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      backgroundColor: theme.palette.lexicalEditor.editButtonHover,
    },
  },
}));

export default function ExcalidrawComponent({
  nodeKey,
  data,
  width,
  height,
}: {
  data: string;
  nodeKey: NodeKey;
  width: 'inherit' | number;
  height: 'inherit' | number;
}): JSX.Element {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [isModalOpen, setModalOpen] = useState<boolean>(
    data === '[]' && editor.isEditable(),
  );
  const imageContainerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const captionButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);

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
            if (event.detail > 1) {
              setModalOpen(true);
            }
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [clearSelection, editor, isSelected, isResizing, setSelected, isEditable]);

  const deleteNode = useCallback(() => {
    setModalOpen(false);
    return editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  const setData = (
    els: ExcalidrawInitialElements,
    aps: Partial<AppState>,
    fls: BinaryFiles,
  ) => {
    return editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isExcalidrawNode(node)) {
        if ((els && els.length > 0) || Object.keys(fls).length > 0) {
          node.setData(
            JSON.stringify({
              appState: aps,
              elements: els,
              files: fls,
            }),
          );
        } else {
          node.remove();
        }
      }
    });
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const onResizeEnd = (
    nextWidth: 'inherit' | number,
    nextHeight: 'inherit' | number,
  ) => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false);
    }, 200);

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);

      if ($isExcalidrawNode(node)) {
        node.setWidth(nextWidth);
        node.setHeight(nextHeight);
      }
    });
  };

  const openModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const {
    elements = [],
    files = {},
    appState = {},
  } = useMemo(() => JSON.parse(data), [data]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    if (elements.length === 0) {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node) {
          node.remove();
        }
      });
    }
  }, [editor, nodeKey, elements.length]);

  return (
    <>
      {isEditable && isModalOpen && (
        <ExcalidrawModal
          initialElements={elements}
          initialFiles={files}
          initialAppState={appState}
          isShown={isModalOpen}
          onDelete={deleteNode}
          onClose={closeModal}
          onSave={(els, aps, fls) => {
            setData(els, aps, fls);
            setModalOpen(false);
          }}
          closeOnClickOutside={false}
        />
      )}
      {elements.length > 0 && (
        <button
          ref={buttonRef}
          className={classNames(classes.excalidrawButton, isSelected && classes.selected)}>
          <ExcalidrawImage
            imageContainerRef={imageContainerRef}
            className="image"
            elements={elements}
            files={files}
            appState={appState}
            width={width}
            height={height}
          />
          {isSelected && isEditable && (
            <div
              className={classes.imageEditButton}
              role="button"
              tabIndex={0}
              onMouseDown={(event) => event.preventDefault()}
              onClick={openModal}>
              <PencilFillIcon />
            </div>
          )}
          {(isSelected || isResizing) && isEditable && (
            <ImageResizer
              buttonRef={captionButtonRef}
              showCaption={true}
              setShowCaption={() => null}
              imageRef={imageContainerRef}
              editor={editor}
              onResizeStart={onResizeStart}
              onResizeEnd={onResizeEnd}
              captionsEnabled={true}
            />
          )}
        </button>
      )}
    </>
  );
}
