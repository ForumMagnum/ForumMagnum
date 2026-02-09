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
import {useCallback, useEffect, useRef, useState} from 'react';

import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { DraggableBlockMenuIcon } from '../../icons/DraggableBlockMenuIcon';
import { PlusIcon } from '../../icons/PlusIcon';
import useModal from '../../hooks/useModal';
import { useInsertClaim } from '../../embeds/ElicitEmbed/ClaimsPlugin';
import { isLWorAF } from '@/lib/instanceSettings';
import BlockInsertToolbarPlugin from './BlockInsertToolbar';

const styles = defineStyles('LexicalDraggableBlockPlugin', (theme: ThemeType) => ({
  menu: {
    borderRadius: 4,
    padding: '2px 1px',
    cursor: 'grab',
    opacity: 0,
    position: 'absolute',
    // The editor div (anchorElem) is shifted 50px left via negative margin to
    // extend its hit zone into the gutter. Adjust from -42 to 8 (-42 + 50) so
    // the menu appears at the same visual position.
    left: 8,
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

const BLOCK_MENU_CLASS = 'draggable-block-menu';
const BLOCK_INSERT_TOOLBAR_CLASS = 'block-insert-toolbar';

function isOnMenu(element: HTMLElement): boolean {
  return !!(
    element.closest(`.${BLOCK_MENU_CLASS}`) ||
    element.closest(`.${BLOCK_INSERT_TOOLBAR_CLASS}`)
  );
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
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [draggableElement, setDraggableElement] = useState<HTMLElement | null>(
    null,
  );
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);

  const [modal, showModal] = useModal();
  const insertClaimFn = useInsertClaim();
  const insertClaim = isLWorAF() ? insertClaimFn : null;

  const handleClose = useCallback(() => {
    setIsToolbarOpen(false);
  }, []);

  // Close toolbar when hovered block changes, but only if the toolbar isn't
  // currently open (when the toolbar is open, isOnMenu prevents the library
  // from changing draggableElement, but guard against edge cases).
  const isToolbarOpenRef = useRef(false);
  isToolbarOpenRef.current = isToolbarOpen;
  useEffect(() => {
    if (!isToolbarOpenRef.current) {
      setIsToolbarOpen(false);
    }
  }, [draggableElement]);

  function toggleToolbar(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsToolbarOpen((prev) => !prev);
  }

  return (
    <>
      {modal}
      {/* eslint-disable-next-line react/jsx-pascal-case */}
      <DraggableBlockPlugin_EXPERIMENTAL
        anchorElem={anchorElem}
        menuRef={menuRef}
        targetLineRef={targetLineRef}
        menuComponent={
          <div ref={menuRef} className={classNames(classes.menu, 'draggable-block-menu')}>
            <button
              ref={addButtonRef}
              type="button"
              title="Click to insert custom element"
              className={classes.addButton}
              onClick={toggleToolbar}>
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
      {isToolbarOpen && addButtonRef.current && (
        <BlockInsertToolbarPlugin
          editor={editor}
          anchorElem={anchorElem}
          buttonElem={addButtonRef.current}
          onClose={handleClose}
          showModal={showModal}
          insertClaim={insertClaim}
        />
      )}
    </>
  );
}
