/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { type JSX } from 'react';

import {isDOMNode} from 'lexical';

import {ReactNode, useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LexicalModal', (theme: ThemeType) => ({
  overlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'fixed',
    flexDirection: 'column',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.palette.lexicalEditor.modalOverlay,
    flexGrow: 0,
    flexShrink: 1,
    zIndex: 100,
  },
  modal: {
    padding: 20,
    minHeight: 100,
    minWidth: 300,
    display: 'flex',
    flexGrow: 0,
    backgroundColor: theme.palette.panelBackground.default,
    flexDirection: 'column',
    position: 'relative',
    boxShadow: `0 0 20px 0 ${theme.palette.greyAlpha(0.2)}`,
    borderRadius: 10,
  },
  title: {
    color: theme.palette.grey[800],
    margin: 0,
    paddingBottom: 10,
    borderBottom: `1px solid ${theme.palette.grey[310]}`,
  },
  closeButton: {
    border: 0,
    position: 'absolute',
    right: 20,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    width: 30,
    height: 30,
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: theme.palette.grey[200],
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    },
  },
  content: {
    paddingTop: 20,
  },
}));

function PortalImpl({
  onClose,
  children,
  title,
  closeOnClickOutside,
}: {
  children: ReactNode;
  closeOnClickOutside: boolean;
  onClose: () => void;
  title: string;
}) {
  const classes = useStyles(styles);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalRef.current !== null) {
      modalRef.current.focus();
    }
  }, []);

  useEffect(() => {
    let modalOverlayElement: HTMLElement | null = null;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const clickOutsideHandler = (event: MouseEvent) => {
      const target = event.target;
      if (
        modalRef.current !== null &&
        isDOMNode(target) &&
        !modalRef.current.contains(target) &&
        closeOnClickOutside
      ) {
        onClose();
      }
    };
    const modelElement = modalRef.current;
    if (modelElement !== null) {
      modalOverlayElement = modelElement.parentElement;
      if (modalOverlayElement !== null) {
        modalOverlayElement.addEventListener('click', clickOutsideHandler);
      }
    }

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
      if (modalOverlayElement !== null) {
        modalOverlayElement?.removeEventListener('click', clickOutsideHandler);
      }
    };
  }, [closeOnClickOutside, onClose]);

  return (
    <div className={classes.overlay} role="dialog">
      <div className={classes.modal} tabIndex={-1} ref={modalRef}>
        <h2 className={classes.title}>{title}</h2>
        <button
          className={classes.closeButton}
          aria-label="Close modal"
          type="button"
          onClick={onClose}>
          X
        </button>
        <div className={classes.content}>{children}</div>
      </div>
    </div>
  );
}

export default function Modal({
  onClose,
  children,
  title,
  closeOnClickOutside = false,
}: {
  children: ReactNode;
  closeOnClickOutside?: boolean;
  onClose: () => void;
  title: string;
}): JSX.Element {
  return createPortal(
    <PortalImpl
      onClose={onClose}
      title={title}
      closeOnClickOutside={closeOnClickOutside}>
      {children}
    </PortalImpl>,
    document.body,
  );
}
