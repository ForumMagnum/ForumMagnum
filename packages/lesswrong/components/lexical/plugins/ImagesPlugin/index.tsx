/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';

import {
  $isAutoLinkNode,
  $isLinkNode,
  LinkNode,
  TOGGLE_LINK_COMMAND,
} from '@lexical/link';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  $findMatchingParent,
  $wrapNodeInElement,
  mergeRegister,
} from '@lexical/utils';
import {$generateHtmlFromNodes, $generateNodesFromDOM} from '@lexical/html';
import {
  $createParagraphNode,
  $createRangeSelection,
  $getEditor,
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isParagraphNode,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  getDOMSelectionFromTarget,
  isHTMLElement,
  LexicalNode,
  LexicalCommand,
  LexicalEditor,
  NodeKey,
  ParagraphNode,
  TextNode,
} from 'lexical';
import {useEffect, useRef, useState} from 'react';


import {
  $createImageNode,
  $createImageCaptionNode,
  $createImageRenderNode,
  $isImageCaptionNode,
  $isImageNode,
  $isImageRenderNode,
  ImageCaptionNode,
  ImageNode,
  ImagePayload,
} from '../../nodes/ImageNode';
import Button from '../../ui/Button';
import {DialogActions, DialogButtonsList} from '../../ui/Dialog';
import FileInput from '../../ui/FileInput';
import TextInput from '../../ui/TextInput';
import {
  uploadToCloudinary,
  ImageUploadError,
} from '../../utils/cloudinaryUpload';

export type InsertImagePayload = Readonly<ImagePayload>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> = createCommand('INSERT_IMAGE_COMMAND');

function findCaptionAncestor(node: LexicalNode | null): ImageCaptionNode | null {
  let current: LexicalNode | null = node;
  while (current) {
    if ($isImageCaptionNode(current)) {
      return current;
    }
    current = current.getParent();
  }
  return null;
}

function updateCaptionEmptyAttribute(
  editor: LexicalEditor,
  captionNode: ImageCaptionNode,
): void {
  const element = editor.getElementByKey(captionNode.getKey());
  if (element) {
    element.setAttribute('data-empty', captionNode.isEmpty() ? 'true' : 'false');
  }
}

function updateCaptionEmptyFromMutations(
  editor: LexicalEditor,
  mutations: Map<NodeKey, 'created' | 'updated' | 'destroyed'>,
): void {
  editor.getEditorState().read(() => {
    for (const [nodeKey, mutation] of mutations) {
      if (mutation === 'destroyed') {
        continue;
      }
      const node = $getNodeByKey(nodeKey);
      if (node) {
        const captionNode = findCaptionAncestor(node);
        if (captionNode) {
          updateCaptionEmptyAttribute(editor, captionNode);
        }
      }
    }
  });
}

export function InsertImageUriDialogBody({
  onClick,
}: {
  onClick: (payload: InsertImagePayload) => void;
}) {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');

  const isDisabled = src === '';

  return (
    <>
      <TextInput
        label="Image URL"
        placeholder="i.e. https://source.unsplash.com/random"
        onChange={setSrc}
        value={src}
        data-test-id="image-modal-url-input"
      />
      <TextInput
        label="Alt Text"
        placeholder="Random unsplash image"
        onChange={setAltText}
        value={altText}
        data-test-id="image-modal-alt-text-input"
      />
      <DialogActions>
        <Button
          data-test-id="image-modal-confirm-btn"
          disabled={isDisabled}
          onClick={() => onClick({altText, src})}>
          Confirm
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertImageUploadedDialogBody({
  onClick,
  onError,
}: {
  onClick: (payload: InsertImagePayload) => void;
  onError?: (error: Error) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [altText, setAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isDisabled = !selectedFile || isUploading;

  const handleFileSelect = (files: FileList | null) => {
    setUploadError(null);
    if (files && files[0]) {
      setSelectedFile(files[0]);
      if (!altText) {
        setAltText(files[0].name);
      }
    }
  };

  const handleConfirm = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    abortControllerRef.current = new AbortController();

    try {
      const result = await uploadToCloudinary(selectedFile, {
        signal: abortControllerRef.current.signal,
      });

      onClick({
        altText,
        src: result.secure_url,
        width: result.width,
        height: result.height,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      const errorMessage = error instanceof ImageUploadError && error.isUserFacing
        ? error.message
        : 'Failed to upload image. Please try again.';
      
      setUploadError(errorMessage);
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <>
      <FileInput
        label="Image Upload"
        onChange={handleFileSelect}
        accept="image/*"
        data-test-id="image-modal-file-upload"
      />
      <TextInput
        label="Alt Text"
        placeholder="Descriptive alternative text"
        onChange={setAltText}
        value={altText}
        data-test-id="image-modal-alt-text-input"
      />
      {uploadError && (
        <div style={{color: 'red', marginTop: '8px', fontSize: '14px'}}>
          {uploadError}
        </div>
      )}
      <DialogActions>
        <Button
          data-test-id="image-modal-file-upload-btn"
          disabled={isDisabled}
          onClick={handleConfirm}>
          {isUploading ? 'Uploading...' : 'Confirm'}
        </Button>
      </DialogActions>
    </>
  );
}

export function InsertImageDialog({
  activeEditor,
  onClose,
  onError,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
  onError?: (error: Error) => void;
}): JSX.Element {
  const [mode, setMode] = useState<null | 'url' | 'file'>(null);
  const hasModifier = useRef(false);

  useEffect(() => {
    hasModifier.current = false;
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey;
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [activeEditor]);

  const onClick = (payload: InsertImagePayload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    onClose();
  };

  return (
    <>
      {!mode && (
        <DialogButtonsList>
          <Button
            data-test-id="image-modal-option-url"
            onClick={() => setMode('url')}>
            URL
          </Button>
          <Button
            data-test-id="image-modal-option-file"
            onClick={() => setMode('file')}>
            File
          </Button>
        </DialogButtonsList>
      )}
      {mode === 'url' && <InsertImageUriDialogBody onClick={onClick} />}
      {mode === 'file' && (
        <InsertImageUploadedDialogBody onClick={onClick} onError={onError} />
      )}
    </>
  );
}

export default function ImagesPlugin({
  captionsEnabled,
}: {
  captionsEnabled?: boolean;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagesPlugin: ImageNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload);
          $insertNodes([imageNode]);
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
          }
          const parent = imageNode.getParent();
          if (
            parent &&
            $isRootOrShadowRoot(parent) &&
            imageNode.getNextSibling() === null
          ) {
            const trailingParagraph = $createParagraphNode();
            imageNode.insertAfter(trailingParagraph);
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return $onDragStart(event);
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return $onDragover(event);
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return $onDrop(event, editor);
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerNodeTransform(ImageNode, (node) =>
        enforceImageNodeStructure(node),
      ),
      editor.registerMutationListener(ImageCaptionNode, (mutations) => {
        editor.getEditorState().read(() => {
          for (const [nodeKey] of mutations) {
            const captionNode = $getNodeByKey(nodeKey);
            if ($isImageCaptionNode(captionNode)) {
              updateCaptionEmptyAttribute(editor, captionNode);
            }
          }
        });
      }),
      editor.registerMutationListener(TextNode, (mutations) => {
        updateCaptionEmptyFromMutations(editor, mutations);
      }),
      editor.registerMutationListener(ParagraphNode, (mutations) => {
        updateCaptionEmptyFromMutations(editor, mutations);
      }),
    );
  }, [captionsEnabled, editor]);

  return null;
}

/**
 * Normalize image nodes after any update.
 *
 * Ensures the image node has a stable internal structure:
 * - Exactly one render child, always first.
 * - At most one caption child when showCaption is enabled.
 * - Removes any unexpected children.
 * - Unwraps the image from a paragraph when it is the only child.
 * - Ensures a trailing paragraph exists when the image is the last root child.
 */
function enforceImageNodeStructure(node: ImageNode): void {
  let renderNode: ReturnType<typeof $createImageRenderNode> | null = null;
  const captionNodes: Array<ReturnType<typeof $createImageCaptionNode>> = [];
  for (const child of node.getChildren()) {
    if ($isImageRenderNode(child)) {
      if (!renderNode) {
        renderNode = child;
      } else {
        child.remove();
      }
    } else if ($isImageCaptionNode(child)) {
      captionNodes.push(child);
    } else {
      child.remove();
    }
  }

  if (!renderNode) {
    renderNode = $createImageRenderNode();
    const firstChild = node.getFirstChild();
    if (firstChild) {
      firstChild.insertBefore(renderNode);
    } else {
      node.append(renderNode);
    }
  } else if (node.getFirstChild() !== renderNode) {
    renderNode.remove();
    node.splice(0, 0, [renderNode]);
  }

  if (captionNodes.length > 0 && !node.getShowCaption()) {
    node.setShowCaption(true);
  }

  if (node.getShowCaption()) {
    let captionNode = captionNodes[0] ?? null;
    for (let i = 1; i < captionNodes.length; i += 1) {
      captionNodes[i].remove();
    }
    if (!captionNode) {
      captionNode = $createImageCaptionNode();
      node.append(captionNode);
    }
    if (captionNode.getChildrenSize() === 0) {
      captionNode.append($createParagraphNode());
    }
  } else {
    for (const captionNode of captionNodes) {
      captionNode.remove();
    }
  }

  const nodeParent = node.getParent();
  if ($isParagraphNode(nodeParent) && nodeParent.getChildrenSize() === 1) {
    nodeParent.replace(node);
  }

  const parent = node.getParent();
  if (parent && $isRootOrShadowRoot(parent) && node.getNextSibling() === null) {
    node.insertAfter($createParagraphNode());
  }
}

const TRANSPARENT_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
let img: HTMLImageElement | null = null;

function $onDragStart(event: DragEvent): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  dataTransfer.setData('text/plain', '_');
  if (!img) {
    img = document.createElement('img');
    img.src = TRANSPARENT_IMAGE;
  }
  dataTransfer.setDragImage(img, 0, 0);

  const editor = $getEditor();
  const selection = $getSelection();
  const dragHtml =
    selection !== null
      ? editor.getEditorState().read(() =>
          $generateHtmlFromNodes(editor, selection),
        )
      : null;

  dataTransfer.setData(
    'application/x-lexical-drag',
    JSON.stringify({
      data: {
        altText: node.getAltText(),
        height: node.getHeight(),
        key: node.getKey(),
        maxWidth: node.getMaxWidth(),
        showCaption: node.getShowCaption(),
        src: node.getSrc(),
        srcset: node.getSrcset(),
        width: node.getWidth(),
        widthPercent: node.getWidthPercent(),
        isCkFigure: node.getIsCkFigure(),
        captionsEnabled: node.getCaptionsEnabled(),
        html: dragHtml,
      },
      type: 'image',
    }),
  );

  return true;
}

function $onDragover(event: DragEvent): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropImage(event)) {
    event.preventDefault();
  }
  return false;
}

function $onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragImageData(event);
  if (!data) {
    return false;
  }
  const existingLink = $findMatchingParent(
    node,
    (parent): parent is LinkNode =>
      !$isAutoLinkNode(parent) && $isLinkNode(parent),
  );
  event.preventDefault();
  if (canDropImage(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection();
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection(rangeSelection);
    if (data.html && typeof DOMParser !== 'undefined') {
      const dom = new DOMParser().parseFromString(data.html, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      $insertNodes(nodes);
    } else {
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
    }
    if (existingLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, existingLink.getURL());
    }
  }
  return true;
}

function $getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection();
  if (!$isNodeSelection(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isImageNode(node) ? node : null;
}

function getDragImageData(event: DragEvent): null | InsertImagePayload {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag');
  if (!dragData) {
    return null;
  }
  const {type, data} = JSON.parse(dragData);
  if (type !== 'image') {
    return null;
  }

  return data;
}

declare global {
  interface DragEvent {
    rangeOffset?: number;
    rangeParent?: Node;
  }
}

function canDropImage(event: DragEvent): boolean {
  const target = event.target;
  return !!(
    isHTMLElement(target) &&
    !target.closest('code, figure.editor-image') &&
    isHTMLElement(target.parentElement) &&
    target.parentElement.closest('div.ContentEditable__root')
  );
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range;
  const domSelection = getDOMSelectionFromTarget(event.target);
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY);
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
    range = domSelection.getRangeAt(0);
  } else {
    throw Error(`Cannot get the selection when dragging`);
  }

  return range;
}
