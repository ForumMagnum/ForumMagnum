/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// These types are from @excalidraw/excalidraw/types - stubbed out until the dependency is installed
type AppState = Record<string, unknown>;
type BinaryFiles = Record<string, unknown>;
type ExcalidrawImperativeAPI = { getAppState: () => AppState };
type ExcalidrawInitialDataState = { elements?: unknown[] };

import React, { type JSX } from 'react';

// @ts-ignore - @excalidraw/excalidraw not installed yet
// eslint-disable-next-line import/no-unresolved
import {Excalidraw} from '@excalidraw/excalidraw';
import {isDOMNode} from 'lexical';

import {ReactPortal, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Button from './Button';
import Modal from './Modal';

const styles = defineStyles('LexicalExcalidrawModal', (theme: ThemeType) => ({
  overlay: {
    display: 'flex',
    alignItems: 'center',
    position: 'fixed',
    flexDirection: 'column',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexGrow: 0,
    flexShrink: 1,
    zIndex: 100,
    backgroundColor: theme.palette.lexicalEditor.modalOverlay,
  },
  actions: {
    textAlign: 'end',
    position: 'absolute',
    right: 5,
    top: 5,
    zIndex: 1,
    '& button': {
      backgroundColor: theme.palette.grey[0],
      borderRadius: 5,
    },
  },
  row: {
    position: 'relative',
    padding: '40px 5px 5px',
    width: '70vw',
    height: '70vh',
    borderRadius: 8,
    boxShadow: `0 12px 28px 0 ${theme.palette.greyAlpha(0.2)}, 0 2px 4px 0 ${theme.palette.greyAlpha(0.1)}, inset 0 0 0 1px ${theme.palette.inverseGreyAlpha(0.5)}`,
    '& > div': {
      borderRadius: 5,
    },
  },
  modal: {
    position: 'relative',
    zIndex: 10,
    top: 50,
    width: 'auto',
    left: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: theme.palette.grey[200],
  },
  discardModal: {
    marginTop: 60,
    textAlign: 'center',
  },
}));

function ShowDiscardDialog({ setDiscardModalOpen, onClose }: {
  setDiscardModalOpen: (value: boolean) => void,
  onClose: () => void,
}) {
  const classes = useStyles(styles);

  return (
    <Modal
      title="Discard"
      onClose={() => {
        setDiscardModalOpen(false);
      }}
      closeOnClickOutside={false}>
      Are you sure you want to discard the changes?
      <div className={classes.discardModal}>
        <Button
          onClick={() => {
            setDiscardModalOpen(false);
            onClose();
          }}>
          Discard
        </Button>{' '}
        <Button
          onClick={() => {
            setDiscardModalOpen(false);
          }}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

export type ExcalidrawInitialElements = ExcalidrawInitialDataState['elements'];

type Props = {
  closeOnClickOutside?: boolean;
  /**
   * The initial set of elements to draw into the scene
   */
  initialElements: ExcalidrawInitialElements;
  /**
   * The initial set of elements to draw into the scene
   */
  initialAppState: AppState;
  /**
   * The initial set of elements to draw into the scene
   */
  initialFiles: BinaryFiles;
  /**
   * Controls the visibility of the modal
   */
  isShown?: boolean;
  /**
   * Callback when closing and discarding the new changes
   */
  onClose: () => void;
  /**
   * Completely remove Excalidraw component
   */
  onDelete: () => void;
  /**
   * Callback when the save button is clicked
   */
  onSave: (
    elements: ExcalidrawInitialElements,
    appState: Partial<AppState>,
    files: BinaryFiles,
  ) => void;
};

/**
 * @explorer-desc
 * A component which renders a modal with Excalidraw (a painting app)
 * which can be used to export an editable image
 */
export default function ExcalidrawModal({
  closeOnClickOutside = false,
  onSave,
  initialElements,
  initialAppState,
  initialFiles,
  isShown = false,
  onDelete,
  onClose,
}: Props): ReactPortal | null {
  const classes = useStyles(styles);
  const excaliDrawModelRef = useRef<HTMLDivElement | null>(null);
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [elements, setElements] =
    useState<ExcalidrawInitialElements>(initialElements);
  const [files, setFiles] = useState<BinaryFiles>(initialFiles);

  useEffect(() => {
    excaliDrawModelRef.current?.focus();
  }, []);

  useEffect(() => {
    let modalOverlayElement: HTMLElement | null = null;

    const clickOutsideHandler = (event: MouseEvent) => {
      const target = event.target;
      if (
        excaliDrawModelRef.current !== null &&
        isDOMNode(target) &&
        !excaliDrawModelRef.current.contains(target) &&
        closeOnClickOutside
      ) {
        onDelete();
      }
    };

    if (excaliDrawModelRef.current !== null) {
      modalOverlayElement = excaliDrawModelRef.current?.parentElement;
      modalOverlayElement?.addEventListener('click', clickOutsideHandler);
    }

    return () => {
      modalOverlayElement?.removeEventListener('click', clickOutsideHandler);
    };
  }, [closeOnClickOutside, onDelete]);

  useLayoutEffect(() => {
    const currentModalRef = excaliDrawModelRef.current;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDelete();
      }
    };

    currentModalRef?.addEventListener('keydown', onKeyDown);

    return () => {
      currentModalRef?.removeEventListener('keydown', onKeyDown);
    };
  }, [elements, files, onDelete]);

  const save = () => {
    if (elements?.some((el: { isDeleted?: boolean }) => !el.isDeleted)) {
      const appState = excalidrawAPI?.getAppState();
      // We only need a subset of the state
      const partialState: Partial<AppState> = {
        exportBackground: appState?.exportBackground,
        exportScale: appState?.exportScale,
        exportWithDarkMode: appState?.theme === 'dark',
        isBindingEnabled: appState?.isBindingEnabled,
        isLoading: appState?.isLoading,
        name: appState?.name,
        theme: appState?.theme,
        viewBackgroundColor: appState?.viewBackgroundColor,
        viewModeEnabled: appState?.viewModeEnabled,
        zenModeEnabled: appState?.zenModeEnabled,
        zoom: appState?.zoom,
      };
      onSave(elements, partialState, files);
    } else {
      // delete node if the scene is clear
      onDelete();
    }
  };

  const discard = () => {
    setDiscardModalOpen(true);
  };

  if (isShown === false) {
    return null;
  }

  const onChange = (
    els: ExcalidrawInitialElements,
    _: AppState,
    fls: BinaryFiles,
  ) => {
    setElements(els);
    setFiles(fls);
  };

  return createPortal(
    <div className={classes.overlay} role="dialog">
      <div
        className={classes.modal}
        ref={excaliDrawModelRef}
        tabIndex={-1}>
        <div className={classes.row}>
          {discardModalOpen && <ShowDiscardDialog setDiscardModalOpen={setDiscardModalOpen} onClose={onClose} />}
          <Excalidraw
            onChange={onChange}
            excalidrawAPI={setExcalidrawAPI}
            initialData={{
              appState: initialAppState || {isLoading: false},
              elements: initialElements,
              files: initialFiles,
            }}
          />
          <div className={classes.actions}>
            <button className="action-button" onClick={discard}>
              Discard
            </button>
            <button className="action-button" onClick={save}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
