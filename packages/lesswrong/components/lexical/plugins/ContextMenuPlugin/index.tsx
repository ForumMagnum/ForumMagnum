/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';

import {$isLinkNode, TOGGLE_LINK_COMMAND} from '@lexical/link';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {
  NodeContextMenuOption,
  NodeContextMenuPlugin,
  NodeContextMenuSeparator,
} from '@lexical/react/LexicalNodeContextMenuPlugin';
import {
  $getSelection,
  $isDecoratorNode,
  $isNodeSelection,
  $isRangeSelection,
  COPY_COMMAND,
  CUT_COMMAND,
  type LexicalNode,
  PASTE_COMMAND,
} from 'lexical';
import {useMemo} from 'react';
import {useLexicalEditable} from '@lexical/react/useLexicalEditable';
import { ScissorsIcon } from '../../icons/ScissorsIcon';
import { CopyIcon } from '../../icons/CopyIcon';
import { ClipboardIcon } from '../../icons/ClipboardIcon';
import { TrashIcon } from '../../icons/TrashIcon';
import { LINK_CHANGE_COMMAND } from '@/components/editor/lexicalPlugins/suggestions/linkChangeSuggestionCommand';

export default function ContextMenuPlugin({
  isSuggestionMode = false,
}: {
  isSuggestionMode?: boolean;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();

  const iconStyle = useMemo(() => ({ width: 16, height: 16, marginRight: 8, opacity: 0.6 }), []);
  const disabledIconStyle = useMemo(() => ({ width: 16, height: 16, marginRight: 8, opacity: 0.3 }), []);

  const items = useMemo(() => {
    return [
      new NodeContextMenuOption(`Remove Link`, {
        $onSelect: () => {
          if (!isEditable) return;
          if (isSuggestionMode) {
            editor.dispatchCommand(LINK_CHANGE_COMMAND, {
              text: null,
              linkNode: null,
              url: null,
              linkTextNode: null,
            });
          } else {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
          }
        },
        $showOn: (node: LexicalNode) => isEditable && $isLinkNode(node.getParent()),
        disabled: !isEditable,
        icon: <span style={isEditable ? iconStyle : disabledIconStyle} />,
      }),
      new NodeContextMenuSeparator({
        $showOn: (node: LexicalNode) => isEditable && $isLinkNode(node.getParent()),
      }),
      new NodeContextMenuOption(`Cut`, {
        $onSelect: () => {
          if (!isEditable) return;
          editor.dispatchCommand(CUT_COMMAND, null);
        },
        disabled: !isEditable,
        icon: <ScissorsIcon style={isEditable ? iconStyle : disabledIconStyle} />,
      }),
      new NodeContextMenuOption(`Copy`, {
        $onSelect: () => {
          editor.dispatchCommand(COPY_COMMAND, null);
        },
        disabled: false,
        icon: <CopyIcon style={iconStyle} />,
      }),
      new NodeContextMenuOption(`Paste`, {
        $onSelect: () => {
          if (!isEditable) return;
          void navigator.clipboard.read().then(async function (...args) {
            const data = new DataTransfer();

            const readClipboardItems = await navigator.clipboard.read();
            const item = readClipboardItems[0];

            const permission = await navigator.permissions.query({
              // @ts-expect-error These types are incorrect.
              name: 'clipboard-read',
            });
            if (permission.state === 'denied') {
              alert('Not allowed to paste from clipboard.');
              return;
            }

            for (const type of item.types) {
              const dataString = await (await item.getType(type)).text();
              data.setData(type, dataString);
            }

            const event = new ClipboardEvent('paste', {
              clipboardData: data,
            });

            editor.dispatchCommand(PASTE_COMMAND, event);
          });
        },
        disabled: !isEditable,
        icon: <ClipboardIcon style={isEditable ? iconStyle : disabledIconStyle} />,
      }),
      new NodeContextMenuOption(`Paste as Plain Text`, {
        $onSelect: () => {
          if (!isEditable) return;
          void navigator.clipboard.read().then(async function (...args) {
            const permission = await navigator.permissions.query({
              // @ts-expect-error These types are incorrect.
              name: 'clipboard-read',
            });

            if (permission.state === 'denied') {
              alert('Not allowed to paste from clipboard.');
              return;
            }

            const data = new DataTransfer();
            const clipboardText = await navigator.clipboard.readText();
            data.setData('text/plain', clipboardText);

            const event = new ClipboardEvent('paste', {
              clipboardData: data,
            });
            editor.dispatchCommand(PASTE_COMMAND, event);
          });
        },
        disabled: !isEditable,
        icon: <ClipboardIcon style={isEditable ? iconStyle : disabledIconStyle} />,
      }),
      new NodeContextMenuSeparator(),
      new NodeContextMenuOption(`Delete Node`, {
        $onSelect: () => {
          if (!isEditable) return;
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const currentNode = selection.anchor.getNode();
            const ancestorNodeWithRootAsParent = currentNode
              .getParents()
              .at(-2);

            ancestorNodeWithRootAsParent?.remove();
          } else if ($isNodeSelection(selection)) {
            const selectedNodes = selection.getNodes();
            selectedNodes.forEach((node) => {
              if ($isDecoratorNode(node)) {
                node.remove();
              }
            });
          }
        },
        disabled: !isEditable,
        icon: <TrashIcon style={isEditable ? iconStyle : disabledIconStyle} />,
      }),
    ];
  }, [editor, iconStyle, disabledIconStyle, isEditable, isSuggestionMode]);

  return (
    <NodeContextMenuPlugin
      className="editor-context-menu"
      itemClassName="editor-context-menu-item"
      separatorClassName="editor-context-menu-separator"
      items={items}
    />
  );
}
