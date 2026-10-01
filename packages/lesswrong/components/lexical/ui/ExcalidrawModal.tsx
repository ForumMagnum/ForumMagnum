// Vendored from: https://github.com/facebook/lexical/commit/2e0f8fa65f7c9a389603008671d120bbd1f71d7a
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// LessWrong modifications from upstream:
//  * Styles converted from ExcalidrawModal.css to JSS, and the modal is
//    larger (and full-screen on phones).
//  * On save, the diagram is also rendered to SVG (passed to `onSave`), and
//    deleted elements and unused files are dropped.
//  * The Escape key no longer deletes the diagram (Excalidraw itself uses
//    Escape for many things, and doesn't stop it from propagating).
//  * The discard confirmation is rendered inside the modal, since our Modal
//    component has a lower z-index than this one, and is skipped if nothing
//    was changed.
//  * Excalidraw itself is focused on open (rather than the modal), so that its
//    keyboard shortcuts work immediately.
//  * Excalidraw is configured with our theme (light/dark), the asset path for
//    its self-hosted fonts, and without the canvas actions that don't make
//    sense here.
//  * Excalidraw's own dialogs and tooltips are raised above this modal, and
//    its internal layers are isolated below the modal's own controls.

import type {NonDeletedExcalidrawElement} from '@excalidraw/excalidraw/element/types';
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types';
import type {JSX} from 'react';

import '@excalidraw/excalidraw/index.css';

import {
  Excalidraw,
  exportToSvg,
  getNonDeletedElements,
  hashElementsVersion,
} from '@excalidraw/excalidraw';
import {isDOMNode} from 'lexical';
import * as React from 'react';
import {ReactPortal, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useTheme } from '@/components/themes/useTheme';
import { EXCALIDRAW_ASSET_PATH } from '@/lib/lexical/excalidrawDiagrams';
import Button from './Button';

declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH?: string | string[];
  }
}

// Excalidraw reads this when it first loads fonts (on first render, not at
// import time).
if (typeof window !== 'undefined') {
  window.EXCALIDRAW_ASSET_PATH = EXCALIDRAW_ASSET_PATH;
}

/**
 * Media query for screens that are too small to show the editor as a modal
 * with a margin around it (phones, including in landscape). On those, it's
 * full-screen instead.
 */
function smallScreenMediaQuery(theme: ThemeType): string {
  return `${theme.breakpoints.down('xs')}, (max-height: 499.95px)`;
}

const styles = defineStyles('LexicalExcalidrawModal', (theme: ThemeType) => ({
  overlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'fixed',
    flexDirection: 'column',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexGrow: 0,
    flexShrink: 1,
    zIndex: theme.zIndexes.modal,
    backgroundColor: theme.palette.lexicalEditor.modalOverlay,
  },
  '@global': {
    // Excalidraw renders its own dialogs (eg help, and the Mermaid
    // text-to-diagram dialog) and tooltips in containers appended to <body>,
    // with z-indexes taken from these variables (declared on :root by
    // Excalidraw's CSS). Their defaults would put them underneath this modal.
    body: {
      '--zIndex-modal': String(theme.zIndexes.modal + 1),
      '--zIndex-popup': String(theme.zIndexes.modal + 2),
    },
  },
  modal: {
    position: 'relative',
    width: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: theme.palette.grey[200],
    [smallScreenMediaQuery(theme)]: {
      // Fill the overlay (which covers the viewport)
      alignSelf: 'stretch',
      flexGrow: 1,
      borderRadius: 0,
    },
  },
  row: {
    position: 'relative',
    padding: '44px 5px 5px',
    width: '90vw',
    height: '85vh',
    borderRadius: 8,
    boxShadow: `0 12px 28px 0 ${theme.palette.boxShadowColor(0.2)}, 0 2px 4px 0 ${theme.palette.boxShadowColor(0.1)}`,
    '& > div': {
      borderRadius: 5,
    },
    [smallScreenMediaQuery(theme)]: {
      // Fill the modal
      width: 'auto',
      height: 'auto',
      flexGrow: 1,
      alignSelf: 'stretch',
      padding: '44px 0 0',
      borderRadius: 0,
      boxShadow: 'none',
      '& > div': {
        borderRadius: 0,
      },
    },
  },
  excalidrawWrapper: {
    height: '100%',
    // Excalidraw's internal layers have z-indexes (up to ~130) but don't form
    // their own stacking context, so without this they'd compete with (and
    // could cover) the action buttons and discard confirmation below.
    isolation: 'isolate',
  },
  actions: {
    display: 'flex',
    gap: 6,
    position: 'absolute',
    right: 5,
    top: 6,
    zIndex: 1,
  },
  discardOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: theme.palette.lexicalEditor.modalOverlay,
    [smallScreenMediaQuery(theme)]: {
      borderRadius: 0,
    },
  },
  discardDialog: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: theme.palette.panelBackground.default,
    boxShadow: `0 0 20px 0 ${theme.palette.greyAlpha(0.2)}`,
    ...theme.typography.commentStyle,
  },
  discardActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
}));

export type ExcalidrawInitialElements = ExcalidrawInitialDataState['elements'];

type ExcalidrawElements = NonNullable<ExcalidrawInitialElements>;

type NonDeletedElements = readonly NonDeletedExcalidrawElement[];

type Props = {
  closeOnClickOutside?: boolean;
  /**
   * The initial set of elements to draw into the scene
   */
  initialElements: ExcalidrawInitialElements;
  /**
   * The initial set of elements to draw into the scene
   */
  initialAppState: Partial<AppState>;
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
   * Callback when the save button is clicked. `svg` is the markup of the
   * diagram rendered as an SVG.
   */
  onSave: (
    elements: NonDeletedElements,
    appState: Partial<AppState>,
    files: BinaryFiles,
    svg: string,
  ) => void;
};

/**
 * Of the files (images) in a scene, only the ones used by an element.
 */
function getReferencedFiles(
  elements: NonDeletedElements,
  files: BinaryFiles,
): BinaryFiles {
  const referencedFiles: BinaryFiles = {};
  for (const element of elements) {
    if (element.type === 'image' && element.fileId && files[element.fileId]) {
      referencedFiles[element.fileId] = files[element.fileId];
    }
  }
  return referencedFiles;
}

/**
 * Replace each <a> that's inside another <a> with its contents. Excalidraw
 * wraps elements that have a link in an <a>, and also renders web embeds as
 * an <a> (with the same link), but links can't be nested.
 */
function unwrapNestedLinks(svg: SVGSVGElement) {
  for (const nestedLink of Array.from(svg.querySelectorAll('a a'))) {
    nestedLink.replaceWith(...Array.from(nestedLink.childNodes));
  }
}

/**
 * Render a diagram to SVG markup, for display outside the editor. This is
 * always rendered in light mode, with a transparent background and without
 * embedded fonts; the fonts are loaded from our @font-face rules, and dark
 * mode is handled with a CSS filter. Web embeds are rendered as a placeholder
 * that links to the embedded page (rather than as an iframe, which the
 * sanitizer wouldn't allow inside an SVG).
 */
async function renderDiagramSvg(
  elements: NonDeletedElements,
  files: BinaryFiles,
): Promise<string> {
  const svg = await exportToSvg({
    elements,
    appState: {
      exportBackground: false,
      exportWithDarkMode: false,
      exportEmbedScene: false,
    },
    files,
    renderEmbeddables: false,
    skipInliningFonts: true,
  });
  unwrapNestedLinks(svg);
  return svg.outerHTML;
}

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
  // This modal is only ever rendered on the client, in response to a user
  // action, so it's safe to read the theme directly.
  const theme = useTheme();
  const excaliDrawModelRef = useRef<HTMLDivElement | null>(null);
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [elements, setElements] =
    useState<ExcalidrawInitialElements>(initialElements);
  const [files, setFiles] = useState<BinaryFiles>(initialFiles);
  // A hash of the elements' versions when the scene was loaded, so that we
  // can tell whether there are changes to discard
  const initialSceneVersionRef = useRef<number | null>(null);

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

  const save = async () => {
    const nonDeletedElements = getNonDeletedElements(elements ?? []);
    if (nonDeletedElements.length > 0) {
      const appState = excalidrawAPI?.getAppState();
      // We only need a subset of the state
      const partialState: Partial<AppState> = {
        isBindingEnabled: appState?.isBindingEnabled,
        name: appState?.name,
        zenModeEnabled: appState?.zenModeEnabled,
        zoom: appState?.zoom,
      };
      const referencedFiles = getReferencedFiles(nonDeletedElements, files);
      setIsSaving(true);
      try {
        const svg = await renderDiagramSvg(nonDeletedElements, referencedFiles);
        onSave(nonDeletedElements, partialState, referencedFiles, svg);
      } finally {
        setIsSaving(false);
      }
    } else {
      // delete node if the scene is clear
      onDelete();
    }
  };

  const discard = () => {
    const hasChanges =
      initialSceneVersionRef.current === null ||
      hashElementsVersion(elements ?? []) !== initialSceneVersionRef.current;
    if (hasChanges) {
      setDiscardModalOpen(true);
    } else {
      onClose();
    }
  };

  function renderDiscardDialog(): JSX.Element {
    return (
      <div className={classes.discardOverlay}>
        <div className={classes.discardDialog} role="alertdialog">
          Are you sure you want to discard the changes?
          <div className={classes.discardActions}>
            <Button
              onClick={() => {
                setDiscardModalOpen(false);
                onClose();
              }}>
              Discard
            </Button>
            <Button
              onClick={() => {
                setDiscardModalOpen(false);
              }}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isShown === false) {
    return null;
  }

  const onChange = (
    els: ExcalidrawElements,
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
          {discardModalOpen && renderDiscardDialog()}
          <div className={classes.excalidrawWrapper}>
            <Excalidraw
              onChange={onChange}
              onExcalidrawAPI={setExcalidrawAPI}
              onInitialize={(api) => {
                initialSceneVersionRef.current = hashElementsVersion(
                  api.getSceneElementsIncludingDeleted(),
                );
              }}
              initialData={{
                appState: initialAppState,
                elements: initialElements,
                files: initialFiles,
                scrollToContent: true,
              }}
              theme={theme.dark ? 'dark' : 'light'}
              UIOptions={{
                canvasActions: {
                  // Diagrams are always displayed on the page background
                  changeViewBackgroundColor: false,
                  saveToActiveFile: false,
                  // The theme follows the site theme
                  toggleTheme: false,
                },
              }}
              aiEnabled={false}
              autoFocus
            />
          </div>
          <div className={classes.actions}>
            <Button small onClick={discard} disabled={isSaving}>
              Discard
            </Button>
            <Button small onClick={() => void save()} disabled={isSaving}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
