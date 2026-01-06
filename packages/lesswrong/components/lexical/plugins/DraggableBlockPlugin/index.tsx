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

const styles = defineStyles('LexicalDraggableBlockPlugin', (theme: ThemeType) => ({
  menu: {
    borderRadius: 4,
    padding: '2px 1px',
    cursor: 'grab',
    opacity: 0,
    position: 'absolute',
    left: 0,
    top: 0,
    willChange: 'transform, opacity',
    display: 'flex',
    gap: 2,
    transition: 'transform 140ms ease-in-out, opacity 160ms ease-in-out',
    '&:active': {
      cursor: 'grabbing',
    },
  },
  icon: {
    width: 16,
    height: 16,
    opacity: 0.3,
    backgroundImage: 'url(/lexical/icons/draggable-block-menu.svg)',
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
    },
  },
  iconPlus: {
    display: 'inline-block',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    backgroundImage: 'url(/lexical/icons/plus.svg)',
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

  function insertBlock(e: React.MouseEvent) {
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
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div ref={menuRef} className={classNames(classes.icon, classes.menu, 'draggable-block-menu')}>
          <button
            title="Click to add below"
            className={classNames(classes.icon, classes.iconPlus)}
            onClick={insertBlock}
          />
          <div className={classes.icon} />
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
