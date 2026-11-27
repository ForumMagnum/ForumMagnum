// Vendored from: https://github.com/facebook/lexical/commit/2e0f8fa65f7c9a389603008671d120bbd1f71d7a
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// LessWrong modifications from upstream:
//  * The modal (and with it, Excalidraw and its CSS) is loaded lazily.
//  * The diagram is inserted as a block rather than inside a paragraph.
//  * This plugin also handles editing existing diagrams (upstream, that's
//    handled by ExcalidrawComponent), via EDIT_EXCALIDRAW_COMMAND.
//  * Diagrams can't be inserted or edited in suggestion mode.
//  * This plugin also manages diagrams' captions; see CaptionedExcalidrawNode.

import type {AppState, BinaryFiles} from '@excalidraw/excalidraw/types';
import type {NonDeletedExcalidrawElement} from '@excalidraw/excalidraw/element/types';
import type {JSX} from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  $findMatchingParent,
  $insertNodeToNearestRoot,
  mergeRegister,
} from '@lexical/utils';
import {
  $createNodeSelection,
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  type EditorState,
  HISTORIC_TAG,
  type LexicalNode,
  NodeKey,
  type NodeMutation,
} from 'lexical';
import * as React from 'react';
import {Suspense, useEffect, useState} from 'react';
import { useMessages } from '@/components/common/withMessages';

import {
  $addExcalidrawCaption,
  $createExcalidrawNode,
  $isCaptionedExcalidrawNode,
  $isExcalidrawNode,
  CaptionedExcalidrawNode,
  ExcalidrawNode,
} from '../../nodes/ExcalidrawNode';
import {$isImageCaptionNode} from '../../nodes/ImageNode';
import type {ExcalidrawInitialElements} from '../../ui/ExcalidrawModal';
import {
  EDIT_EXCALIDRAW_COMMAND,
  INSERT_EXCALIDRAW_COMMAND,
  TOGGLE_EXCALIDRAW_CAPTION_COMMAND,
} from './commands';

const ExcalidrawModal = React.lazy(() => import('../../ui/ExcalidrawModal'));

interface ExcalidrawModalState {
  /** The diagram being edited, or null if this is a new diagram */
  nodeKey: NodeKey | null;
  elements: ExcalidrawInitialElements;
  appState: Partial<AppState>;
  files: BinaryFiles;
}

const NEW_DIAGRAM_MODAL_STATE: ExcalidrawModalState = {
  nodeKey: null,
  elements: [],
  appState: {},
  files: {},
};

/**
 * Given a node that has ended up inside of a CaptionedExcalidrawNode, but
 * which is neither its diagram nor its caption, returns the blocks to put
 * after the CaptionedExcalidrawNode in its place. For a second caption,
 * that's its content as ordinary paragraphs (which empties the caption node).
 */
function $getBlocksToMoveOut(misplacedNode: LexicalNode): LexicalNode[] {
  if (!$isImageCaptionNode(misplacedNode)) {
    return [misplacedNode];
  }
  const children = misplacedNode.getChildren();
  const hasInlineChildren = children.some((child) => !$isElementNode(child) || child.isInline());
  return hasInlineChildren ? [$createParagraphNode().append(...children)] : children;
}

/**
 * Keeps a CaptionedExcalidrawNode to just a diagram and its caption:
 *  * Without the caption, it turns back into a plain diagram.
 *  * Without the diagram, it's removed along with its caption.
 *  * Anything else in it is moved to after it. Inserting a block (eg a
 *    divider) while the cursor is in the caption puts the block inside of
 *    this node, and splits the caption in two around it.
 */
function $normalizeCaptionedExcalidrawNode(node: CaptionedExcalidrawNode): void {
  const diagramNode = node.getDiagramNode();
  if (!diagramNode) {
    node.remove();
    return;
  }
  const captionNode = node.getCaptionNode();
  if (!captionNode) {
    node.replace(diagramNode);
    return;
  }
  const misplacedNodes = node.getChildren()
    .filter((child) => !child.is(diagramNode) && !child.is(captionNode));
  misplacedNodes
    .flatMap($getBlocksToMoveOut)
    .reduce<LexicalNode>((previousNode, block) => previousNode.insertAfter(block), node);
  misplacedNodes.filter($isImageCaptionNode).forEach((emptiedCaption) => emptiedCaption.remove());
}

function $getCaptionedDiagramContainingSelection(): CaptionedExcalidrawNode | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return null;
  }
  return $findMatchingParent(selection.anchor.getNode(), $isCaptionedExcalidrawNode);
}

/**
 * If the selection has just left a caption which is empty, returns the key of
 * the CaptionedExcalidrawNode that the caption belongs to.
 */
function getAbandonedEmptyCaptionKey(
  prevEditorState: EditorState,
  editorState: EditorState,
): NodeKey | null {
  const previousKey = prevEditorState.read(
    () => $getCaptionedDiagramContainingSelection()?.getKey() ?? null,
  );
  if (previousKey === null) {
    return null;
  }
  return editorState.read(() => {
    const node = $getNodeByKey(previousKey);
    if (!$isCaptionedExcalidrawNode(node) || node.is($getCaptionedDiagramContainingSelection())) {
      return null;
    }
    return node.getCaptionNode()?.isEmpty() ? previousKey : null;
  });
}

function getKeysWithMutation(
  mutations: Map<NodeKey, NodeMutation>,
  mutation: NodeMutation,
): NodeKey[] {
  return Array.from(mutations.entries())
    .filter(([, nodeMutation]) => nodeMutation === mutation)
    .map(([key]) => key);
}

function $isDiagramOrItsCaptionSelected(diagramKey: NodeKey): boolean {
  const selection = $getSelection();
  if ($isNodeSelection(selection)) {
    return selection.has(diagramKey);
  }
  return $getCaptionedDiagramContainingSelection()?.getDiagramNode()?.getKey() === diagramKey;
}

/**
 * When a caption is added or removed by undo, redo or another collaborator
 * (rather than with the button on the diagram), the diagram's node is
 * replaced with a new one. If the diagram was selected or the cursor was in
 * its caption, returns the key of the new node, so that it can be selected.
 * Otherwise nothing would be selected, and since the keyboard focus was on an
 * element that the update removed, keyboard input (such as a further undo)
 * wouldn't reach the editor.
 */
function getReplacementForSelectedDiagram(
  mutations: Map<NodeKey, NodeMutation>,
  prevEditorState: EditorState,
): NodeKey | null {
  const destroyedKeys = getKeysWithMutation(mutations, 'destroyed');
  const createdKeys = getKeysWithMutation(mutations, 'created');
  if (destroyedKeys.length !== 1 || createdKeys.length !== 1) {
    return null;
  }
  const wasSelected = prevEditorState.read(() => $isDiagramOrItsCaptionSelected(destroyedKeys[0]));
  return wasSelected ? createdKeys[0] : null;
}

export default function ExcalidrawPlugin({
  isSuggestionMode,
}: {
  isSuggestionMode?: boolean;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const {flash} = useMessages();
  const [modalState, setModalState] = useState<ExcalidrawModalState | null>(
    null,
  );

  useEffect(() => {
    if (!editor.hasNodes([ExcalidrawNode, CaptionedExcalidrawNode])) {
      throw new Error(
        'ExcalidrawPlugin: ExcalidrawNode or CaptionedExcalidrawNode not registered on editor',
      );
    }

    return mergeRegister(
      editor.registerCommand(
        INSERT_EXCALIDRAW_COMMAND,
        () => {
          if (isSuggestionMode) {
            flash({
              messageString: 'Diagrams are not supported in suggestion mode',
              type: 'error',
            });
            return true;
          }
          setModalState(NEW_DIAGRAM_MODAL_STATE);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        EDIT_EXCALIDRAW_COMMAND,
        (nodeKey) => {
          if (isSuggestionMode) {
            flash({
              messageString: 'Diagrams cannot be edited in suggestion mode',
              type: 'error',
            });
            return true;
          }
          const node = $getNodeByKey(nodeKey);
          if (!$isExcalidrawNode(node)) {
            return false;
          }
          const {
            elements = [],
            files = {},
            appState = {},
          } = JSON.parse(node.getData());
          setModalState({nodeKey, elements, appState, files});
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        TOGGLE_EXCALIDRAW_CAPTION_COMMAND,
        (nodeKey) => {
          if (isSuggestionMode) {
            flash({
              messageString: 'Diagram captions cannot be added or removed in suggestion mode',
              type: 'error',
            });
            return true;
          }
          const node = $getNodeByKey(nodeKey);
          if (!$isExcalidrawNode(node)) {
            return false;
          }
          const parent = node.getParent();
          if ($isCaptionedExcalidrawNode(parent)) {
            parent.getCaptionNode()?.remove();
          } else {
            $addExcalidrawCaption(node).selectEnd();
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerNodeTransform(
        CaptionedExcalidrawNode,
        $normalizeCaptionedExcalidrawNode,
      ),
      editor.registerMutationListener(
        ExcalidrawNode,
        (mutations, {prevEditorState}) => {
          const replacementKey = getReplacementForSelectedDiagram(mutations, prevEditorState);
          if (replacementKey === null) {
            return;
          }
          editor.update(() => {
            const selection = $createNodeSelection();
            selection.add(replacementKey);
            $setSelection(selection);
          });
        },
        {skipInitialization: true},
      ),
      editor.registerUpdateListener(({prevEditorState, editorState, tags}) => {
        // Undoing the typing of a caption empties it and moves the selection,
        // but removing the caption then would discard the redo history. And
        // in suggestion mode, removing it wouldn't be recorded as a suggestion.
        if (!editor.isEditable() || isSuggestionMode || tags.has(HISTORIC_TAG)) {
          return;
        }
        const abandonedKey = getAbandonedEmptyCaptionKey(prevEditorState, editorState);
        if (abandonedKey === null) {
          return;
        }
        editor.update(() => {
          const node = $getNodeByKey(abandonedKey);
          if ($isCaptionedExcalidrawNode(node)) {
            node.getCaptionNode()?.remove();
          }
        });
      }),
    );
  }, [editor, isSuggestionMode, flash]);

  const onClose = () => {
    setModalState(null);
  };

  const onDelete = () => {
    // Saving an empty diagram deletes it
    const nodeKey = modalState?.nodeKey;
    if (nodeKey) {
      editor.update(() => {
        $getNodeByKey(nodeKey)?.remove();
      });
    }
    setModalState(null);
  };

  const onSave = (
    elements: readonly NonDeletedExcalidrawElement[],
    appState: Partial<AppState>,
    files: BinaryFiles,
    svg: string,
  ) => {
    const nodeKey = modalState?.nodeKey;
    const data = JSON.stringify({
      appState,
      elements,
      files,
    });
    editor.update(() => {
      if (nodeKey) {
        const node = $getNodeByKey(nodeKey);
        if ($isExcalidrawNode(node)) {
          node.setData(data);
          node.setSvg(svg);
        }
      } else {
        const excalidrawNode = $createExcalidrawNode(data, svg);
        $insertNodeToNearestRoot(excalidrawNode);
      }
    });
    setModalState(null);
  };

  return modalState ? (
    <Suspense fallback={null}>
      <ExcalidrawModal
        initialElements={modalState.elements}
        initialAppState={modalState.appState}
        initialFiles={modalState.files}
        isShown={true}
        onDelete={onDelete}
        onClose={onClose}
        onSave={onSave}
        closeOnClickOutside={false}
      />
    </Suspense>
  ) : null;
}
