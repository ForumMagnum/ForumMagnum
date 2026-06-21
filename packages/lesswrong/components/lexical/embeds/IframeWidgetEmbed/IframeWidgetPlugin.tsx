'use client';
import React, { type JSX, useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot, mergeRegister} from '@lexical/utils';
import {
  $getNodeByKey,
  $createTextNode,
  $isLineBreakNode,
  $isElementNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalEditor,
} from 'lexical';
import {useMessages} from '@/components/common/withMessages';
import { randomId } from '@/lib/random';

import {$createIframeWidgetNode, IframeWidgetNode} from './IframeWidgetNode';
import {injectResizeScript, clampIframeHeight, IFRAME_DEFAULT_HEIGHT} from './iframeResizeScript';
import {defineStyles, useStyles} from '@/components/hooks/useStyles';
import ForumIcon from '@/components/common/ForumIcon';
import { CodeIcon } from '../../icons/CodeIcon';

export const INSERT_IFRAME_WIDGET_COMMAND: LexicalCommand<string | undefined> = createCommand(
  'INSERT_IFRAME_WIDGET_COMMAND',
);

const PREVIEW_MODE_CLASS = 'iframe-widget-preview-mode';

function updateWidgetGutter(key: string, editor: LexicalEditor): void {
  const element = editor.getElementByKey(key);
  if (!element) return;
  editor.getEditorState().read(() => {
    const node = $getNodeByKey(key);
    if (!node || !$isElementNode(node)) return;
    const children = node.getChildren();
    let gutter = '1';
    let count = 1;
    for (const child of children) {
      if ($isLineBreakNode(child)) {
        gutter += '\n' + ++count;
      }
    }
    element.setAttribute('data-gutter', gutter);
    element.style.setProperty('--gutter-chars', String(String(count).length));
  });
}

const styles = defineStyles('IframeWidgetPlugin', (theme: ThemeType) => ({
  toggleButton: {
    position: 'absolute',
    zIndex: 2,
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.palette.grey[200],
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    color: theme.palette.grey[800],
    opacity: 0.6,
    '&:hover': {
      background: theme.palette.grey[300],
      opacity: 0.8,
    },
  },
  previewOverlay: {
    position: 'absolute',
    zIndex: 1,
    border: theme.palette.greyBorder('1px', 0.2),
    borderRadius: 4,
    overflow: 'hidden',
    background: theme.palette.background.default,
  },
  iframe: {
    display: 'block',
    width: '100%',
    border: 'none',
  },
  emptyPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    color: theme.palette.grey[500],
    fontStyle: 'italic',
    fontFamily: 'sans-serif',
  },
  icon: {
    width: 16,
    height: 16,
  },
}));

interface WidgetState {
  viewMode: 'code' | 'preview';
  previewHeight: number;
  htmlContent: string;
}

function stripDeletedMarkupFromSrcdoc(srcdoc: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(srcdoc, 'text/html');
  doc.querySelectorAll('del').forEach((node) => node.remove());
  return doc.documentElement.innerHTML;
}

function applyPreviewModeToDOM(
  editor: LexicalEditor,
  nodeKey: string,
  previewHeight: number,
): void {
  const elem = editor.getElementByKey(nodeKey);
  if (!elem) return;
  elem.classList.add(PREVIEW_MODE_CLASS);
  elem.dataset.view = 'preview';
  elem.style.height = `${previewHeight}px`;
}

function removePreviewModeFromDOM(
  editor: LexicalEditor,
  nodeKey: string,
): void {
  const elem = editor.getElementByKey(nodeKey);
  if (!elem) return;
  elem.classList.remove(PREVIEW_MODE_CLASS);
  delete elem.dataset.view;
  elem.style.removeProperty('height');
}

function readCodeContent(editor: LexicalEditor, nodeKey: string): string {
  let content = '';
  editor.getEditorState().read(() => {
    const node = $getNodeByKey(nodeKey);
    if (node) {
      content = node.getTextContent();
    }
  });
  return content;
}

interface OverlayPosition {
  top: number;
  left: number;
  width: number;
}

function usePositionTracking(
  editor: LexicalEditor,
  anchorElem: HTMLElement | undefined,
  widgets: Map<string, WidgetState>,
): Map<string, OverlayPosition> {
  const [positions, setPositions] = useState<Map<string, OverlayPosition>>(new Map());

  const measure = useCallback(() => {
    if (!anchorElem) return;
    const anchorRect = anchorElem.getBoundingClientRect();
    const next = new Map<string, OverlayPosition>();
    for (const [key, state] of widgets) {
      if (state.viewMode !== 'preview') continue;
      const elem = editor.getElementByKey(key);
      if (!elem) continue;
      const elemRect = elem.getBoundingClientRect();
      next.set(key, {
        top: elemRect.top - anchorRect.top + anchorElem.scrollTop,
        left: elemRect.left - anchorRect.left + anchorElem.scrollLeft,
        width: elemRect.width,
      });
    }
    setPositions((prev) => {
      if (prev.size !== next.size) return next;
      for (const [key, pos] of next) {
        const prevPos = prev.get(key);
        if (!prevPos || prevPos.top !== pos.top || prevPos.left !== pos.left
          || prevPos.width !== pos.width) {
          return next;
        }
      }
      return prev;
    });
  }, [editor, anchorElem, widgets]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (!anchorElem) return;
    const unregister = editor.registerUpdateListener(() => {
      requestAnimationFrame(measure);
    });
    const handleResize = () => measure();
    window.addEventListener('resize', handleResize);
    return () => {
      unregister();
      window.removeEventListener('resize', handleResize);
    };
  }, [editor, anchorElem, measure]);

  return positions;
}

function ToggleButton({
  viewMode,
  onClick,
  className,
  style,
}: {
  viewMode: 'code' | 'preview';
  onClick: () => void;
  className: string;
  style?: React.CSSProperties;
}) {
  const classes = useStyles(styles);

  const title = viewMode === 'code' ? 'Switch to preview' : 'Switch to code';
  return (
    <button
      className={className}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClick(); }}
      title={title}
      type="button"
      tabIndex={-1}
      style={style}
    >
      {viewMode === 'code' ? <ForumIcon icon="Eye" className={classes.icon} /> : <CodeIcon />}
    </button>
  );
}

function IframeWidgetOverlay({
  state,
  position,
  onToggle,
  onIframeResize,
}: {
  state: WidgetState;
  position: OverlayPosition | undefined;
  onToggle: () => void;
  onIframeResize: (height: number) => void;
}) {
  const classes = useStyles(styles);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handler(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type !== 'iframe-widget-resize') return;
      onIframeResize(clampIframeHeight(event.data.height));
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onIframeResize]);

  if (state.viewMode !== 'preview' || !position) return null;

  const srcdoc = state.htmlContent.trim()
    ? injectResizeScript(stripDeletedMarkupFromSrcdoc(state.htmlContent))
    : '';

  return (
    <div
      className={classes.previewOverlay}
      style={{ top: position.top, left: position.left, width: position.width }}
    >
      <ToggleButton
        viewMode="preview"
        onClick={onToggle}
        className={classes.toggleButton}
        style={{ top: 4, right: 4 }}
      />
      {srcdoc ? (
        <iframe
          ref={iframeRef}
          className={classes.iframe}
          srcDoc={srcdoc}
          sandbox="allow-scripts"
          title="Embedded widget preview"
          style={{ height: state.previewHeight }}
        />
      ) : (
        <div className={classes.emptyPreview}>No HTML content</div>
      )}
    </div>
  );
}

function IframeWidgetCodeToggle({
  nodeKey,
  editor,
  anchorElem,
  onToggle,
}: {
  nodeKey: string;
  editor: LexicalEditor;
  anchorElem: HTMLElement;
  onToggle: () => void;
}) {
  const classes = useStyles(styles);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    function measure() {
      const elem = editor.getElementByKey(nodeKey);
      if (!elem) return;
      const codeRect = elem.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();
      setPosition({
        top: codeRect.top - anchorRect.top + anchorElem.scrollTop + 4,
        right: anchorRect.right - codeRect.right + 4,
      });
    }
    measure();
    const unregister = editor.registerUpdateListener(() => {
      requestAnimationFrame(measure);
    });
    window.addEventListener('resize', measure);
    return () => {
      unregister();
      window.removeEventListener('resize', measure);
    };
  }, [editor, nodeKey, anchorElem]);

  if (!position) return null;

  return (
    <ToggleButton
      viewMode="code"
      onClick={onToggle}
      className={classes.toggleButton}
      style={{ top: position.top, right: position.right }}
    />
  );
}

export default function IframeWidgetPlugin({
  anchorElem,
  isSuggestionMode,
}: {
  anchorElem?: HTMLElement;
  isSuggestionMode?: boolean;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const {flash} = useMessages();
  const [widgets, setWidgets] = useState<Map<string, WidgetState>>(new Map);

  useEffect(() => {
    if (!editor.hasNodes([IframeWidgetNode])) {
      throw new Error('IframeWidgetPlugin: IframeWidgetNode not registered on editor');
    }

    return mergeRegister(
      editor.registerCommand<string | undefined>(
        INSERT_IFRAME_WIDGET_COMMAND,
        (payload) => {
          if (isSuggestionMode) {
            flash({
              messageString: 'Iframe widgets are not supported in suggestion mode',
              type: 'error',
            });
            return true;
          }
          const node = $createIframeWidgetNode(randomId());
          if (payload) {
            node.append($createTextNode(payload));
          }
          $insertNodeToNearestRoot(node);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerMutationListener(IframeWidgetNode, (mutations) => {
        editor.getEditorState().read(() => {
          const initialPreviews: Array<{ key: string; height: number }> = [];
          setWidgets((prev) => {
            const next = new Map(prev);
            for (const [key, type] of mutations) {
              if (type === 'destroyed') {
                next.delete(key);
              } else if (!next.has(key)) {
                const node = $getNodeByKey(key);
                const hasContent = node ? node.getTextContent().trim().length > 0 : false;
                next.set(key, {
                  viewMode: hasContent ? 'preview' : 'code',
                  previewHeight: IFRAME_DEFAULT_HEIGHT,
                  htmlContent: hasContent ? node!.getTextContent() : '',
                });
                if (hasContent) {
                  initialPreviews.push({ key, height: IFRAME_DEFAULT_HEIGHT });
                }
              }
            }
            return next;
          });
          for (const { key, height } of initialPreviews) {
            applyPreviewModeToDOM(editor, key, height);
          }
        });
      }, {skipInitialization: false}),
      editor.registerMutationListener(IframeWidgetNode, (mutations) => {
        for (const [key, type] of mutations) {
          if (type !== 'destroyed') {
            updateWidgetGutter(key, editor);
          }
        }
      }, {skipInitialization: false}),
    );
  }, [editor, isSuggestionMode, flash]);

  // Apply/remove preview-mode CSS on code block DOM elements.
  // useLayoutEffect ensures this runs before position measurement
  // (declared in usePositionTracking below), so the overlay sees the
  // collapsed spacer dimensions rather than the full code block.
  useLayoutEffect(() => {
    for (const [key, state] of widgets) {
      if (state.viewMode === 'preview') {
        applyPreviewModeToDOM(editor, key, state.previewHeight);
      } else {
        removePreviewModeFromDOM(editor, key);
      }
    }
  }, [editor, widgets]);

  const widgetKeys = Array.from(widgets.keys());
  const positions = usePositionTracking(editor, anchorElem, widgets);

  const handleToggle = useCallback((key: string) => {
    setWidgets((prev) => {
      const next = new Map(prev);
      const state = next.get(key);
      if (!state) return prev;
      if (state.viewMode === 'code') {
        const htmlContent = readCodeContent(editor, key);
        next.set(key, { ...state, viewMode: 'preview', htmlContent });
      } else {
        next.set(key, { ...state, viewMode: 'code' });
      }
      return next;
    });
  }, [editor]);

  const handleIframeResize = useCallback((key: string, height: number) => {
    setWidgets((prev) => {
      const state = prev.get(key);
      if (!state || state.previewHeight === height) return prev;
      const next = new Map(prev);
      next.set(key, { ...state, previewHeight: height });
      return next;
    });
    applyPreviewModeToDOM(editor, key, height);
  }, [editor]);

  if (!anchorElem) return null;

  return createPortal(
    <>
      {widgetKeys.map((key) => {
        const state = widgets.get(key)!;
        if (state.viewMode === 'code') {
          return (
            <IframeWidgetCodeToggle
              key={key}
              nodeKey={key}
              editor={editor}
              anchorElem={anchorElem}
              onToggle={() => handleToggle(key)}
            />
          );
        }
        return (
          <IframeWidgetOverlay
            key={key}
            state={state}
            position={positions.get(key)}
            onToggle={() => handleToggle(key)}
            onIframeResize={(h) => handleIframeResize(key, h)}
          />
        );
      })}
    </>,
    anchorElem,
  );
}
