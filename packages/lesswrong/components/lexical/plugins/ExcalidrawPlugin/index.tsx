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

import type {AppState, BinaryFiles} from '@excalidraw/excalidraw/types';
import type {NonDeletedExcalidrawElement} from '@excalidraw/excalidraw/element/types';
import type {JSX} from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot, mergeRegister} from '@lexical/utils';
import {
  $getNodeByKey,
  COMMAND_PRIORITY_EDITOR,
  NodeKey,
} from 'lexical';
import * as React from 'react';
import {Suspense, useEffect, useState} from 'react';
import { useMessages } from '@/components/common/withMessages';

import {
  $createExcalidrawNode,
  $isExcalidrawNode,
  ExcalidrawNode,
} from '../../nodes/ExcalidrawNode';
import type {ExcalidrawInitialElements} from '../../ui/ExcalidrawModal';
import {EDIT_EXCALIDRAW_COMMAND, INSERT_EXCALIDRAW_COMMAND} from './commands';

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
    if (!editor.hasNodes([ExcalidrawNode])) {
      throw new Error(
        'ExcalidrawPlugin: ExcalidrawNode not registered on editor',
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
