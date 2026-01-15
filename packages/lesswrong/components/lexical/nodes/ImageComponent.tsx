/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {LexicalCommand, LexicalEditor, NodeKey} from 'lexical';
import React, { type JSX } from 'react';

import {useCollaborationContext} from '@lexical/react/LexicalCollaborationContext';
import {CollaborationPlugin} from '@lexical/react/LexicalCollaborationPlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {HashtagPlugin} from '@lexical/react/LexicalHashtagPlugin';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {LexicalNestedComposer} from '@lexical/react/LexicalNestedComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {useLexicalEditable} from '@lexical/react/useLexicalEditable';
import {useLexicalNodeSelection} from '@lexical/react/useLexicalNodeSelection';
import {mergeRegister} from '@lexical/utils';
import {
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  BLUR_COMMAND,
  CLICK_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGSTART_COMMAND,
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
import {createWebsocketProvider} from '../collaboration';
import {useSettings} from '../context/SettingsContext';
import {useSharedHistoryContext} from '../context/SharedHistoryContext';
import brokenImage from '../images/image-broken.svg';
import useModal from '../hooks/useModal';
import EmojisPlugin from '../plugins/EmojisPlugin';
import KeywordsPlugin from '../plugins/KeywordsPlugin';
import LinkPlugin from '../plugins/LinkPlugin';
import MentionsPlugin from '../plugins/MentionsPlugin';
import TreeViewPlugin from '../plugins/TreeViewPlugin';
import ContentEditable from '../ui/ContentEditable';
import ImageResizer from '../ui/ImageResizer';
import Button from '../ui/Button';
import TextInput from '../ui/TextInput';
import {DialogActions} from '../ui/Dialog';
import { ChatLeftTextIcon } from '../icons/ChatLeftTextIcon';
import { ChatSquareQuoteIcon } from '../icons/ChatSquareQuoteIcon';
import { FileEarmarkTextIcon } from '../icons/FileEarmarkTextIcon';
import {$isCaptionEditorEmpty, $isImageNode} from './ImageNode';
import { INSERT_INLINE_COMMENT_AT_COMMAND } from '../plugins/CommentPlugin';

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
  toolbar: {
    position: 'absolute',
    top: -40,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 6,
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
  contentEditable: {
    minHeight: 20,
    border: 0,
    resize: 'none',
    cursor: 'text',
    caretColor: theme.palette.grey[1000],
    display: 'block',
    position: 'relative',
    outline: 0,
    padding: 10,
    userSelect: 'text',
    fontSize: 12,
    width: '100%',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    boxSizing: 'border-box',
    textAlign: 'center',
  },
  placeholder: {
    fontSize: 12,
    color: theme.palette.grey[500],
    overflow: 'hidden',
    position: 'absolute',
    textOverflow: 'ellipsis',
    top: 10,
    left: 10,
    userSelect: 'none',
    whiteSpace: 'nowrap',
    display: 'inline-block',
    pointerEvents: 'none',
    textAlign: 'center',
    width: 'calc(100% - 20px)',
  },
  resizing: {
    touchAction: 'none',
  },
  captionContainer: {
    display: 'block',
    position: 'relative',
    padding: 0,
    marginTop: 8,
    borderTop: `1px solid ${theme.palette.grey[0]}`,
    backgroundColor: theme.palette.inverseGreyAlpha(0.9),
    minWidth: 100,
    color: theme.palette.grey[1000],
    boxSizing: 'border-box',
    maxWidth: '100%',
    wordWrap: 'break-word',
    '& .tree-view-output': {
      margin: 0,
      borderRadius: 0,
    },
  },
}));

type ImageStatus =
  | {error: true}
  | {error: false; width: number; height: number};

const imageCache = new Map<string, Promise<ImageStatus> | ImageStatus>();

export const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> =
  createCommand('RIGHT_CLICK_IMAGE_COMMAND');

function DisableCaptionOnBlur({
  setShowCaption,
}: {
  setShowCaption: (show: boolean) => void;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() =>
    editor.registerCommand(
      BLUR_COMMAND,
      () => {
        if ($isCaptionEditorEmpty()) {
          setShowCaption(false);
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
  );
  return null;
}

function useSuspenseImage(src: string): ImageStatus {
  let cached = imageCache.get(src);
  if (cached && 'error' in cached && typeof cached.error === 'boolean') {
    return cached;
  } else if (!cached) {
    cached = new Promise<ImageStatus>((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () =>
        resolve({
          error: false,
          height: img.naturalHeight,
          width: img.naturalWidth,
        });
      img.onerror = () => resolve({error: true});
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
  height,
  maxWidth,
  widthPercent,
  onError,
}: {
  altText: string;
  className: string | null;
  height: 'inherit' | number;
  imageRef: {current: null | HTMLImageElement};
  maxWidth: number;
  src: string;
  srcSet?: string | null;
  width: 'inherit' | number;
  widthPercent?: number | null;
  onError: () => void;
}): JSX.Element {
  const isSVGImage = isSVG(src);
  const status = useSuspenseImage(src);

  useEffect(() => {
    if (status.error) {
      onError();
    }
  }, [status.error, onError]);

  if (status.error) {
    return <BrokenImage />;
  }

  // Calculate final dimensions with proper scaling
  const calculateDimensions = () => {
    if (!isSVGImage) {
      return {
        height,
        maxWidth,
        width,
      };
    }

    // Use natural dimensions if available, otherwise fallback to defaults
    const naturalWidth = status.width;
    const naturalHeight = status.height;

    let finalWidth = naturalWidth;
    let finalHeight = naturalHeight;

    // Scale down if width exceeds maxWidth while maintaining aspect ratio
    if (finalWidth > maxWidth) {
      const scale = maxWidth / finalWidth;
      finalWidth = maxWidth;
      finalHeight = Math.round(finalHeight * scale);
    }

    // Scale down if height exceeds maxHeight while maintaining aspect ratio
    const maxHeight = 500;
    if (finalHeight > maxHeight) {
      const scale = maxHeight / finalHeight;
      finalHeight = maxHeight;
      finalWidth = Math.round(finalWidth * scale);
    }

    return {
      height: finalHeight,
      maxWidth,
      width: finalWidth,
    };
  };

  const imageStyle: React.CSSProperties = calculateDimensions();
  if (widthPercent !== undefined && widthPercent !== null) {
    imageStyle.width = `${widthPercent}%`;
    imageStyle.height = 'auto';
    imageStyle.maxWidth = '100%';
  }

  return (
    <img
      className={className || undefined}
      src={src}
      srcSet={srcSet ?? undefined}
      alt={altText}
      ref={imageRef}
      style={imageStyle}
      onError={onError}
      draggable="false"
    />
  );
}

function BrokenImage(): JSX.Element {
  return (
    <img
      src={brokenImage}
      style={{
        height: 200,
        opacity: 0.2,
        width: 200,
      }}
      draggable="false"
      alt="Broken image"
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
  nodeKey,
  width,
  height,
  maxWidth,
  widthPercent,
  srcSet,
  resizable,
  showCaption,
  caption,
  captionsEnabled,
}: {
  altText: string;
  caption: LexicalEditor;
  height: 'inherit' | number;
  maxWidth: number;
  nodeKey: NodeKey;
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
    useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const {isCollabActive} = useCollaborationContext();
  const [editor] = useLexicalComposerContext();
  const activeEditorRef = useRef<LexicalEditor | null>(null);
  const [isLoadError, setIsLoadError] = useState<boolean>(false);
  const isEditable = useLexicalEditable();
  const [modal, showModal] = useModal();
  const isInNodeSelection = useMemo(
    () =>
      isSelected &&
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        return $isNodeSelection(selection) && selection.has(nodeKey);
      }),
    [editor, isSelected, nodeKey],
  );

  const $onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection();
      if (
        $isNodeSelection(latestSelection) &&
        latestSelection.has(nodeKey) &&
        latestSelection.getNodes().length === 1
      ) {
        if (showCaption) {
          // Move focus into nested editor
          $setSelection(null);
          event.preventDefault();
          caption.focus();
          return true;
        }
      }
      return false;
    },
    [caption, nodeKey, showCaption],
  );

  const $onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (activeEditorRef.current === caption) {
        $setSelection(null);
        editor.update(() => {
          setSelected(true);
          const parentRootElement = editor.getRootElement();
          if (parentRootElement !== null) {
            parentRootElement.focus();
          }
        });
        return true;
      }
      return false;
    },
    [caption, editor, setSelected],
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

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW,
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
  }, [editor]);
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
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setShowCaption(show);
        if (show) {
          node.__caption.update(() => {
            if (!$getSelection()) {
              $getRoot().selectEnd();
            }
          });
        }
      }
    });
    if (show && editor.isEditable()) {
      setTimeout(() => {
        caption.focus();
      }, 0);
    }
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
      if ($isImageNode(node)) {
        node.setWidthAndHeight(nextWidth, nextHeight);
      }
    });
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const {historyState} = useSharedHistoryContext();
  const {
    settings: {showNestedEditorTreeView},
  } = useSettings();

  const draggable = isInNodeSelection && !isResizing;
  const isFocused = (isSelected || isResizing) && isEditable;
  const showToolbar = isFocused && !isResizing && isEditable;
  const isCaptionButtonActive = showCaption && captionsEnabled;

  const openAltTextModal = () => {
    showModal('Image Alt Text', (onClose) => (
      <ImageAltTextDialog
        initialValue={altText}
        onConfirm={(nextAltText) => {
          editor.update(() => {
            const node = $getNodeByKey(nodeKey);
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
      <>
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
            draggable={draggable}
            className={classNames(
              classes.imageWrapper,
              { [classes.resizing]: isResizing },
            )}>
            {isLoadError ? (
              <BrokenImage />
            ) : (
              <LazyImage
                className={
                  isFocused
                    ? `focused ${isInNodeSelection ? 'draggable' : ''}`
                    : null
                }
                src={src}
                srcSet={srcSet ?? undefined}
                altText={altText}
                imageRef={imageRef}
                width={width}
                height={height}
                maxWidth={maxWidth}
                widthPercent={widthPercent ?? undefined}
                onError={() => setIsLoadError(true)}
              />
            )}
          </div>
        </div>

        {showCaption && (
          <div className={classNames(classes.captionContainer, 'image-caption-container')}>
            <LexicalNestedComposer initialEditor={caption}>
              <DisableCaptionOnBlur setShowCaption={setShowCaption} />
              <MentionsPlugin />
              <LinkPlugin />
              <EmojisPlugin />
              <HashtagPlugin />
              <KeywordsPlugin />
              {isCollabActive ? (
                <CollaborationPlugin
                  id={`caption-${nodeKey}`}
                  providerFactory={createWebsocketProvider}
                  shouldBootstrap={true}
                />
              ) : (
                <HistoryPlugin externalHistoryState={historyState} />
              )}
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    placeholder="Enter image caption"
                    placeholderClassName={classes.placeholder}
                    className={classes.contentEditable}
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              {showNestedEditorTreeView === true ? <TreeViewPlugin /> : null}
            </LexicalNestedComposer>
          </div>
        )}
        {resizable && isInNodeSelection && isFocused && (
          <ImageResizer
            editor={editor}
            imageRef={imageRef}
            maxWidth={maxWidth}
            onResizeStart={onResizeStart}
            onResizeEnd={onResizeEnd}
          />
        )}
      </>
    </Suspense>
  );
}
