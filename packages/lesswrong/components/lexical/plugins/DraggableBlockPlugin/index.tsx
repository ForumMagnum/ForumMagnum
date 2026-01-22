/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React, { type JSX } from 'react';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {DraggableBlockPlugin_EXPERIMENTAL} from '@lexical/react/LexicalDraggableBlockPlugin';
import {$createParagraphNode, $getNearestNodeFromDOMNode} from 'lexical';
import {useRef, useState} from 'react';

import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { DraggableBlockMenuIcon } from '../../icons/DraggableBlockMenuIcon';
import { PlusIcon } from '../../icons/PlusIcon';

const styles = defineStyles('LexicalDraggableBlockPlugin', (theme: ThemeType) => ({
  menu: {
    borderRadius: 4,
    padding: '2px 1px',
    cursor: 'grab',
    opacity: 0,
    position: 'absolute',
    left: -42,
    top: -2,
    willChange: 'transform, opacity',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    transition: 'transform 140ms ease-in-out, opacity 160ms ease-in-out',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: -8,
      bottom: -8,
      right: -4,
      width: 8,
    },
    '&:active': {
      cursor: 'grabbing',
    },
  },
  icon: {
    width: 16,
    height: 16,
    opacity: 0.3,
  },
  dragHandle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
    },
  },
  addButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    padding: 0,
  },
  targetLine: {
    pointerEvents: 'none',
    background: 'deepskyblue',
    height: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0,
    willChange: 'transform',
  },
}));

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest('.draggable-block-menu');
}

export default function DraggableBlockPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): JSX.Element {
  const classes = useStyles(styles);
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const [draggableElement, setDraggableElement] = useState<HTMLElement | null>(
    null,
  );

  function insertBlock(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!draggableElement || !editor) {
      return;
    }

    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableElement);
      if (!node) {
        return;
      }

      const pNode = $createParagraphNode();
      if (e.altKey || e.ctrlKey) {
        node.insertBefore(pNode);
      } else {
        node.insertAfter(pNode);
      }
      pNode.select();
    });
  }

  return (
    // eslint-disable-next-line react/jsx-pascal-case
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div ref={menuRef} className={classNames(classes.menu, 'draggable-block-menu')}>
          <button
            type="button"
            title="Click to add below"
            className={classes.addButton}
            onClick={insertBlock}>
            <PlusIcon className={classes.icon} />
          </button>
          <div className={classes.dragHandle}>
            <DraggableBlockMenuIcon className={classes.icon} />
          </div>
        </div>
      }
      targetLineComponent={
        <div ref={targetLineRef} className={classes.targetLine} />
      }
      isOnMenu={isOnMenu}
      onElementChanged={setDraggableElement}
    />
  );
}
