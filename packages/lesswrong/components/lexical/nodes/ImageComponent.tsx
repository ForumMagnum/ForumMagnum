/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {LexicalCommand, NodeKey} from 'lexical';
import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useLexicalEditable} from '@lexical/react/useLexicalEditable';
import {useLexicalNodeSelection} from '@lexical/react/useLexicalNodeSelection';
import {mergeRegister} from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import { useMessages } from '@/components/common/withMessages';
import useModal from '../hooks/useModal';
import ImageResizer from '../ui/ImageResizer';
import Button from '../ui/Button';
import TextInput from '../ui/TextInput';
import {DialogActions} from '../ui/Dialog';
import { ChatLeftTextIcon } from '../icons/ChatLeftTextIcon';
import { ChatSquareQuoteIcon } from '../icons/ChatSquareQuoteIcon';
import { FileEarmarkTextIcon } from '../icons/FileEarmarkTextIcon';
import {$isImageNode} from './ImageNode';
import { INSERT_INLINE_COMMENT_AT_COMMAND } from '../plugins/CommentPlugin';
import { SET_IMAGE_CAPTION_VISIBILITY_COMMAND } from '../plugins/ImagesPlugin/commands';

const styles = defineStyles('LexicalImageComponent', (theme: ThemeType) => ({
  imageContainer: {
    position: 'relative',
    display: 'block',
    width: '100%',
    textAlign: 'center',
  },
  imageWrapper: {
    display: 'inline-block',
    position: 'relative',
  },
  imageElement: {
    height: 'auto',
    maxWidth: '100%',
    minWidth: '100%',
  },
  imageWrapperFocused: {
    boxShadow: `0 0 0 1px ${theme.palette.lexicalEditor.focusRing}`,
  },
  toolbar: {
    position: 'absolute',
    top: -40,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 6,
    flexWrap: 'nowrap',
    whiteSpace: 'nowrap',
    width: 'max-content',
    backgroundColor: theme.palette.grey[0],
    padding: '4px 6px',
    borderRadius: 8,
    boxShadow: `0px 5px 10px ${theme.palette.greyAlpha(0.3)}`,
    zIndex: 5,
    userSelect: 'none',
  },
  toolbarButton: {
    border: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    borderRadius: 6,
    padding: '4px 6px',
    cursor: 'pointer',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    color: theme.palette.grey[700],
    '&:hover:not([disabled])': {
      backgroundColor: theme.palette.grey[200],
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
  toolbarButtonActive: {
    backgroundColor: theme.palette.grey[200],
  },
  toolbarIcon: {
    width: 16,
    height: 16,
  },
  resizing: {
    touchAction: 'none',
  },
}));

type ImageStatus =
  | {error: true}
  | {error: false; width: number; height: number};

const imageCache = new Map<string, Promise<ImageStatus> | ImageStatus>();

export const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> =
  createCommand('RIGHT_CLICK_IMAGE_COMMAND');

function useSuspenseImage(src: string): ImageStatus {
  let cached = imageCache.get(src);
  if (cached && 'error' in cached && typeof cached.error === 'boolean') {
    return cached;
  } else if (!cached) {
    cached = new Promise<ImageStatus>((resolve) => {
      const img = new Image();
      img.onload = () =>
        resolve({
          error: false,
          height: img.naturalHeight,
          width: img.naturalWidth,
        });
      img.onerror = () => resolve({error: true});
      img.src = src;
    }).then((rval) => {
      imageCache.set(src, rval);
      return rval;
    });
    imageCache.set(src, cached);
    throw cached;
  }
  throw cached;
}

function isSVG(src: string): boolean {
  return src.toLowerCase().endsWith('.svg');
}

function LazyImage({
  altText,
  className,
  imageRef,
  src,
  srcSet,
  width,
  maxWidth,
  onError,
}: {
  altText: string;
  className: string | null;
  imageRef: {current: null | HTMLImageElement};
  maxWidth: number;
  src: string;
  srcSet?: string | null;
  width: 'inherit' | number;
  onError: () => void;
}): JSX.Element | null {
  const isSVGImage = isSVG(src);
  const status = useSuspenseImage(src);

  useEffect(() => {
    if (status.error) {
      onError();
    }
  }, [status.error, onError]);

  if (status.error) {
    return null;
  }

  const widthAttribute =
    typeof width === 'number'
      ? width
      : isSVGImage
        ? Math.min(status.width, maxWidth)
        : undefined;

  return (
    <img
      className={className || undefined}
      src={src}
      srcSet={srcSet ?? undefined}
      alt={altText}
      ref={imageRef}
      width={widthAttribute}
      onError={onError}
      draggable="false"
    />
  );
}

function noop() {}

function ImageAltTextDialog({
  initialValue,
  onConfirm,
}: {
  initialValue: string;
  onConfirm: (altText: string) => void;
}) {
  const [altText, setAltText] = useState(initialValue);
  const isDisabled = altText.trim().length === 0;

  return (
    <>
      <TextInput
        label="Alt Text"
        placeholder="Describe the image"
        onChange={setAltText}
        value={altText}
      />
      <DialogActions>
        <Button
          disabled={isDisabled}
          onClick={() => {
            onConfirm(altText.trim());
          }}>
          Save
        </Button>
      </DialogActions>
    </>
  );
}

export default function ImageComponent({
  src,
  altText,
  imageNodeKey,
  width,
  height,
  maxWidth,
  widthPercent,
  srcSet,
  resizable,
  showCaption,
  captionsEnabled,
}: {
  altText: string;
  height: 'inherit' | number;
  maxWidth: number;
  imageNodeKey: NodeKey;
  resizable: boolean;
  showCaption: boolean;
  src: string;
  srcSet?: string | null;
  width: 'inherit' | number;
  widthPercent?: number | null;
  captionsEnabled: boolean;
}): JSX.Element {
  const classes = useStyles(styles);
  const imageRef = useRef<null | HTMLImageElement>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(imageNodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [isLoadError, setIsLoadError] = useState<boolean>(false);
  const isEditable = useLexicalEditable();
  const { flash } = useMessages();
  const [modal, showModal] = useModal();

  useEffect(() => {
    if (isLoadError) {
      flash({ messageString: 'Failed to load image', type: 'error' });
      editor.update(() => {
        const node = $getNodeByKey(imageNodeKey);
        if ($isImageNode(node)) {
          node.remove();
        }
      });
    }
  }, [isLoadError, editor, imageNodeKey, flash]);

  const isInNodeSelection = useMemo(
    () =>
      isSelected &&
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        return $isNodeSelection(selection) && selection.has(imageNodeKey);
      }),
    [editor, isSelected, imageNodeKey],
  );

  const $onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection();
      if (
        $isNodeSelection(latestSelection) &&
        latestSelection.has(imageNodeKey) &&
        latestSelection.getNodes().length === 1
      ) {
        if (showCaption) {
          event.preventDefault();
          editor.update(() => {
            const node = $getNodeByKey(imageNodeKey);
            if ($isImageNode(node)) {
              const captionNode = node.getCaptionNode();
              if (captionNode) {
                captionNode.selectEnd();
              }
            }
          });
          return true;
        }
      }
      return false;
    },
    [editor, imageNodeKey, showCaption],
  );

  const $onEscape = useCallback(
    (event: KeyboardEvent) => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const node = $getNodeByKey(imageNodeKey);
        if ($isImageNode(node)) {
          const captionNode = node.getCaptionNode();
          const anchorNode = selection.anchor.getNode();
          if (captionNode && captionNode.isParentOf(anchorNode)) {
            editor.update(() => {
              $setSelection(null);
              setSelected(true);
              const parentRootElement = editor.getRootElement();
              if (parentRootElement !== null) {
                parentRootElement.focus();
              }
            });
            event.preventDefault();
            return true;
          }
        }
      }
      return false;
    },
    [editor, imageNodeKey, setSelected],
  );

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload;

      if (isResizing) {
        return true;
      }
      if (event.target === imageRef.current) {
        if (event.shiftKey) {
          setSelected(!isSelected);
        } else {
          clearSelection();
          setSelected(true);
        }
        return true;
      }

      return false;
    },
    [isResizing, isSelected, setSelected, clearSelection],
  );

  const onRightClick = useCallback(
    (event: MouseEvent): void => {
      editor.getEditorState().read(() => {
        const latestSelection = $getSelection();
        const domElement = event.target as HTMLElement;
        if (
          domElement.tagName === 'IMG' &&
          $isRangeSelection(latestSelection) &&
          latestSelection.getNodes().length === 1
        ) {
          editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event);
        }
      });
    },
    [editor],
  );

  const maybeHideEmptyCaption = useCallback(() => {
    editor.getEditorState().read(() => {
      const node = $getNodeByKey(imageNodeKey);
      if (!$isImageNode(node)) {
        return;
      }
      const captionNode = node.getCaptionNode();
      if (!captionNode || !captionNode.isEmpty()) {
        return;
      }
      const selection = $getSelection();
      const isSelectionInCaption =
        $isRangeSelection(selection) &&
        captionNode.isParentOf(selection.anchor.getNode());
      if (!isSelectionInCaption) {
        editor.update(() => {
          const writableNode = $getNodeByKey(imageNodeKey);
          if ($isImageNode(writableNode)) {
            writableNode.setShowCaption(false);
          }
        });
      }
    });
  }, [editor, imageNodeKey]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          maybeHideEmptyCaption();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event) => {
          const selection = $getSelection();
          const node = $getNodeByKey(imageNodeKey);
          if (!$isImageNode(node)) {
            return false;
          }
          if ($isRangeSelection(selection) && !selection.isCollapsed()) {
            const selectedNodes = selection.getNodes();
            if (selectedNodes.some((selected) => $isImageNode(selected))) {
              event.preventDefault();
              node.remove();
              return true;
            }
            const captionNode = node.getCaptionNode();
            if (
              captionNode &&
              captionNode.isParentOf(selection.anchor.getNode()) &&
              captionNode.isParentOf(selection.focus.getNode())
            ) {
              const captionText = captionNode.getTextContent();
              if (selection.getTextContent() === captionText) {
                event.preventDefault();
                node.remove();
                return true;
              }
            }
            return false;
          }
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }
          const captionNode = node.getCaptionNode();
          if (!captionNode) {
            return false;
          }
          const anchorNode = selection.anchor.getNode();
          if (!captionNode.isParentOf(anchorNode)) {
            return false;
          }
          const isAtStart =
            selection.anchor.offset === 0 &&
            ($isTextNode(anchorNode)
              ? anchorNode.getPreviousSibling() === null
              : anchorNode.getPreviousSibling() === null);
          if (!isAtStart) {
            return false;
          }
          event.preventDefault();
          node.remove();
          return true;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || selection.isCollapsed()) {
            return false;
          }
          const node = $getNodeByKey(imageNodeKey);
          if (!$isImageNode(node)) {
            return false;
          }
          const selectedNodes = selection.getNodes();
          if (selectedNodes.some((selected) => $isImageNode(selected))) {
            event.preventDefault();
            node.remove();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            // TODO This is just a temporary workaround for FF to behave like other browsers.
            // Ideally, this handles drag & drop too (and all browsers).
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, imageNodeKey, maybeHideEmptyCaption]);
  useEffect(() => {
    let rootCleanup = noop;
    return mergeRegister(
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<MouseEvent>(
        RIGHT_CLICK_IMAGE_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        $onEscape,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerRootListener((rootElement) => {
        rootCleanup();
        rootCleanup = noop;
        if (rootElement) {
          rootElement.addEventListener('contextmenu', onRightClick);
          rootCleanup = () =>
            rootElement.removeEventListener('contextmenu', onRightClick);
        }
      }),
      () => rootCleanup(),
    );
  }, [editor, $onEnter, $onEscape, onClick, onRightClick]);

  const setShowCaption = (show: boolean) => {
    editor.dispatchCommand(SET_IMAGE_CAPTION_VISIBILITY_COMMAND, {
      nodeKey: imageNodeKey,
      showCaption: show,
    });
    if (show) {
      editor.update(() => {
        const node = $getNodeByKey(imageNodeKey);
        if ($isImageNode(node)) {
          const captionNode = node.getCaptionNode();
          captionNode?.selectEnd();
        }
      });
    }
    if (show && editor.isEditable()) {
      editor.getRootElement()?.focus();
    }
  };


  const onResizeEnd = () => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false);
    }, 200);
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const draggable = isInNodeSelection && !isResizing;
  const isFocused = (isSelected || isResizing) && isEditable;
  const showToolbar = isFocused && !isResizing && isEditable;
  const isCaptionButtonActive = showCaption && captionsEnabled;

  useEffect(() => {
    const imageElement = imageRef.current;
    if (!imageElement) {
      return;
    }
    const figureElement = imageElement.closest('figure');
    if (!figureElement) {
      return;
    }
    if (widthPercent !== undefined && widthPercent !== null) {
      figureElement.style.width = `${widthPercent}%`;
    } else {
      figureElement.style.removeProperty('width');
    }
  }, [widthPercent]);

  const openAltTextModal = () => {
    showModal('Image Alt Text', (onClose) => (
      <ImageAltTextDialog
        initialValue={altText}
        onConfirm={(nextAltText) => {
          editor.update(() => {
            const node = $getNodeByKey(imageNodeKey);
            if ($isImageNode(node)) {
              node.setAltText(nextAltText);
            }
          });
          onClose();
        }}
      />
    ));
  };

  const openCommentInput = () => {
    const imageElement = imageRef.current;
    if (!imageElement) {
      return;
    }
    const rect = imageElement.getBoundingClientRect();
    editor.dispatchCommand(INSERT_INLINE_COMMENT_AT_COMMAND, {rect});
  };
  return (
    <Suspense fallback={null}>
      {modal}
      <div className={classes.imageContainer}>
        {showToolbar && (
          <div className={classes.toolbar}>
            <button
              type="button"
              className={classes.toolbarButton}
              onClick={openAltTextModal}
              title="Edit image alt text">
              <FileEarmarkTextIcon className={classes.toolbarIcon} />
              Alt
            </button>
            <button
              type="button"
              className={classes.toolbarButton}
              onClick={openCommentInput}
              title="Add comment">
              <ChatLeftTextIcon className={classes.toolbarIcon} />
              Comment
            </button>
            <button
              type="button"
              className={classNames(
                classes.toolbarButton,
                { [classes.toolbarButtonActive]: isCaptionButtonActive },
              )}
              onClick={() => setShowCaption(!showCaption)}
              disabled={!captionsEnabled}
              title={showCaption ? 'Hide caption' : 'Show caption'}>
              <ChatSquareQuoteIcon className={classes.toolbarIcon} />
              Caption
            </button>
          </div>
        )}
        <div
          key="image-wrapper"
          draggable={draggable}
          className={classNames(
            classes.imageWrapper,
            {
              [classes.resizing]: isResizing,
              [classes.imageWrapperFocused]: isFocused,
            },
          )}>
          {!isLoadError && (
            <LazyImage
              className={classNames(
                classes.imageElement,
                isFocused
                  ? `focused ${isInNodeSelection ? 'draggable' : ''}`
                  : null,
              )}
              src={src}
              srcSet={srcSet ?? undefined}
              altText={altText}
              imageRef={imageRef}
              width={width}
              maxWidth={maxWidth}
              onError={() => setIsLoadError(true)}
            />
          )}
          {resizable && isInNodeSelection && isFocused && (
            <ImageResizer
              editor={editor}
              imageRef={imageRef}
              nodeKey={imageNodeKey}
              onResizeStart={onResizeStart}
              onResizeEnd={onResizeEnd}
            />
          )}
        </div>
      </div>
    </Suspense>
  );
}
