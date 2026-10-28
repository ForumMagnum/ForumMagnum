'use client';
import React, { type JSX, useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
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

import {$createIframeWidgetNode, $isIframeWidgetNode, IframeWidgetNode} from './IframeWidgetNode';
import {
  IframeWidgetLayout, IframeWidgetPosition, parseIframeWidgetLayout, setIframeWidgetLayout, shouldWrapWidget,
  stripIframeWidgetLayout, widgetWidthPx, WRAP_GUTTER,
} from '@/components/contents/iframeWidgetLayout';
import {injectResizeScript, clampIframeHeight, IFRAME_DEFAULT_HEIGHT} from './iframeResizeScript';
import {defineStyles, useStyles} from '@/components/hooks/useStyles';
import ForumIcon from '@/components/common/ForumIcon';
import { CodeIcon } from '../../icons/CodeIcon';
import classNames from 'classnames';

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
    // EXPERIMENT (experiment/iframe-layout-ronny): clear like the published widget; the outline and
    // the placement bar show while the widget is hovered (or the bar has focus).
    border: '1px solid transparent',
    borderRadius: 4,
    overflow: 'hidden',
    background: 'transparent',
    transition: 'border-color 0.15s',
    '&:hover': {
      borderColor: theme.palette.greyAlpha(0.2),
    },
    '&:hover $layoutBar': {
      opacity: 1,
    },
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
  // EXPERIMENT (experiment/iframe-layout-ronny): placement controls on each widget preview.
  layoutBar: {
    position: 'absolute',
    zIndex: 2,
    top: 4,
    left: 4,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 2,
    maxWidth: 'calc(100% - 44px)',
    padding: 2,
    background: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder('1px', 0.15),
    borderRadius: 6,
    boxShadow: `0 1px 4px ${theme.palette.boxShadowColor(0.1)}`,
    ...theme.typography.body2,
    fontSize: 12,
    opacity: 0,
    transition: 'opacity 0.15s',
    '&:focus-within': {
      opacity: 1,
    },
  },
  layoutButton: {
    padding: '3px 7px',
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    color: theme.palette.text.normal,
    cursor: 'pointer',
    font: 'inherit',
    '&:hover': {
      background: theme.palette.grey[200],
    },
  },
  layoutButtonActive: {
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    '&:hover': {
      background: theme.palette.primary.main,
    },
  },
  layoutDivider: {
    width: 1,
    alignSelf: 'stretch',
    margin: '2px 3px',
    background: theme.palette.grey[300],
  },
  layoutNote: {
    padding: '3px 6px',
    color: theme.palette.grey[600],
    whiteSpace: 'nowrap',
  },
  '@global': {
    // As in the post, a new section starts below a widget the text wraps around.
    '.iframe-widget-code[data-lw-wraps] ~ h1, .iframe-widget-code[data-lw-wraps] ~ h2, .iframe-widget-code[data-lw-wraps] ~ h3': {
      clear: 'both',
    },
  },
}));

const LAYOUT_POSITIONS: Array<{ position: IframeWidgetPosition, label: string }> = [
  { position: 'inline', label: 'Full width' },
  { position: 'left', label: 'Left' },
  { position: 'right', label: 'Right' },
];
// Widths that leave room to wrap in LessWrong's normal 682px text column.
const LAYOUT_WIDTHS = ['25%', '33%', '38%'];
const DEFAULT_WRAP_WIDTH = '33%';

interface WidgetState {
  viewMode: 'code' | 'preview';
  previewHeight: number;
  htmlContent: string;
  layout: IframeWidgetLayout;
}

/** Width of the editor's text column, which wrapped widgets are sized against. */
function editorColumnWidth(editor: LexicalEditor): number {
  const root = editor.getRootElement();
  if (!root) return 0;
  const cs = getComputedStyle(root);
  return root.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
}

/**
 * Floats the preview spacer the way the post will float the widget, so the editor's text wraps
 * around it (the preview overlay follows the spacer's box). Code view is always full width.
 */
function placeSpacer(elem: HTMLElement, layout: IframeWidgetLayout | null, columnWidth: number): void {
  const wraps = !!layout && shouldWrapWidget(layout, columnWidth);
  const side = layout?.position === 'left' ? 'left' : 'right';
  elem.style.float = wraps ? side : '';
  elem.style.clear = wraps ? side : '';
  elem.style.width = wraps ? `${widgetWidthPx(layout!, columnWidth)}px` : '';
  elem.style.margin = wraps ? (side === 'left' ? `6px ${WRAP_GUTTER}px 16px 0` : `6px 0 16px ${WRAP_GUTTER}px`) : '';
  elem.toggleAttribute('data-lw-wraps', wraps);
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
  layout: IframeWidgetLayout,
): void {
  const elem = editor.getElementByKey(nodeKey);
  if (!elem) return;
  elem.classList.add(PREVIEW_MODE_CLASS);
  elem.dataset.view = 'preview';
  elem.style.height = `${previewHeight}px`;
  placeSpacer(elem, layout, editorColumnWidth(editor));
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
  placeSpacer(elem, null, 0);
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
      let changed = prev.size !== next.size;
      const merged = new Map<string, OverlayPosition>();
      for (const [key, pos] of next) {
        const prevPos = prev.get(key);
        if (prevPos && prevPos.top === pos.top && prevPos.left === pos.left
          && prevPos.width === pos.width) {
          merged.set(key, prevPos);
        } else {
          merged.set(key, pos);
          changed = true;
        }
      }
      return changed ? merged : prev;
    });
  }, [editor, anchorElem, widgets]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (!anchorElem) return;
    let scheduledFrame: number | null = null;
    const scheduleMeasure = () => {
      if (scheduledFrame !== null) return;
      scheduledFrame = requestAnimationFrame(() => {
        scheduledFrame = null;
        measure();
      });
    };
    const unregister = editor.registerUpdateListener(scheduleMeasure);
    window.addEventListener('resize', scheduleMeasure);
    // Editor updates alone are not enough: the document reflows without any
    // Lexical update when images/iframes finish loading, when another
    // widget's spacer collapses or resizes, when fonts land, or when a
    // workspace panel resizes the editor column. Watch the editor's own
    // size — the anchor wrapper (width changes) and the contenteditable
    // root (height changes with content) — and re-measure on any of it.
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(anchorElem);
    const rootElem = editor.getRootElement();
    if (rootElem) resizeObserver.observe(rootElem);
    return () => {
      unregister();
      window.removeEventListener('resize', scheduleMeasure);
      resizeObserver.disconnect();
      if (scheduledFrame !== null) cancelAnimationFrame(scheduledFrame);
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

function LayoutControls({ layout, columnWidth, onChange }: {
  layout: IframeWidgetLayout,
  columnWidth: number,
  onChange: (layout: IframeWidgetLayout) => void,
}) {
  const classes = useStyles(styles);
  const sided = layout.position === 'left' || layout.position === 'right';
  const width = layout.width ?? DEFAULT_WRAP_WIDTH;
  const widths = LAYOUT_WIDTHS.includes(width) ? LAYOUT_WIDTHS : [...LAYOUT_WIDTHS, width];
  const button = (active: boolean, label: string, next: IframeWidgetLayout) => <button
    key={label}
    type="button"
    tabIndex={-1}
    className={classNames(classes.layoutButton, active && classes.layoutButtonActive)}
    onMouseDown={(e) => e.preventDefault()}
    onClick={(e) => { e.stopPropagation(); e.preventDefault(); onChange(next); }}
  >{label}</button>;
  return (
    <div className={classes.layoutBar}>
      {LAYOUT_POSITIONS.map(({ position, label }) => button(
        layout.position === position || (position === 'inline' && layout.position === 'center'),
        label,
        position === 'inline' ? { position: 'inline', width: null } : { position, width },
      ))}
      {sided && <>
        <span className={classes.layoutDivider}/>
        {widths.map(w => button(w === width, w, { position: layout.position, width: w }))}
        {!shouldWrapWidget(layout, columnWidth) && <span className={classes.layoutNote}>
          too wide to wrap here
        </span>}
      </>}
    </div>
  );
}

const IframeWidgetOverlay = React.memo(function IframeWidgetOverlay({
  nodeKey,
  state,
  position,
  columnWidth,
  onToggle,
  onIframeResize,
  onLayoutChange,
}: {
  nodeKey: string;
  state: WidgetState;
  position: OverlayPosition | undefined;
  columnWidth: number;
  onToggle: (nodeKey: string) => void;
  onIframeResize: (nodeKey: string, height: number) => void;
  onLayoutChange: (nodeKey: string, layout: IframeWidgetLayout) => void;
}) {
  const classes = useStyles(styles);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handler(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type !== 'iframe-widget-resize') return;
      onIframeResize(nodeKey, clampIframeHeight(event.data.height));
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [nodeKey, onIframeResize]);

  const handleToggleClick = useCallback(() => onToggle(nodeKey), [onToggle, nodeKey]);
  const handleLayoutChange = useCallback((layout: IframeWidgetLayout) => onLayoutChange(nodeKey, layout), [onLayoutChange, nodeKey]);

  // The layout tag only places the frame, so changing it doesn't reload the widget.
  const widgetHtml = stripIframeWidgetLayout(state.htmlContent);
  const srcdoc = useMemo(
    () => widgetHtml.trim()
      ? injectResizeScript(stripDeletedMarkupFromSrcdoc(widgetHtml))
      : '',
    [widgetHtml],
  );

  if (state.viewMode !== 'preview' || !position) return null;

  return (
    <div
      className={classes.previewOverlay}
      style={{ top: position.top, left: position.left, width: position.width }}
    >
      <ToggleButton
        viewMode="preview"
        onClick={handleToggleClick}
        className={classes.toggleButton}
        style={{ top: 4, right: 4 }}
      />
      {srcdoc && <LayoutControls layout={state.layout} columnWidth={columnWidth} onChange={handleLayoutChange} />}
      {srcdoc ? (
        <iframe
          ref={iframeRef}
          className={classes.iframe}
          srcDoc={srcdoc}
          sandbox="allow-scripts"
          scrolling="no"
          title="Embedded widget preview"
          style={{ height: state.previewHeight }}
        />
      ) : (
        <div className={classes.emptyPreview}>No HTML content</div>
      )}
    </div>
  );
});

const IframeWidgetCodeToggle = React.memo(function IframeWidgetCodeToggle({
  nodeKey,
  editor,
  anchorElem,
  onToggle,
}: {
  nodeKey: string;
  editor: LexicalEditor;
  anchorElem: HTMLElement;
  onToggle: (nodeKey: string) => void;
}) {
  const classes = useStyles(styles);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    function measure() {
      const elem = editor.getElementByKey(nodeKey);
      if (!elem) return;
      const codeRect = elem.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();
      const top = codeRect.top - anchorRect.top + anchorElem.scrollTop + 4;
      const right = anchorRect.right - codeRect.right + 4;
      setPosition((prev) => (prev && prev.top === top && prev.right === right ? prev : { top, right }));
    }
    measure();
    let scheduledFrame: number | null = null;
    const scheduleMeasure = () => {
      if (scheduledFrame !== null) return;
      scheduledFrame = requestAnimationFrame(() => {
        scheduledFrame = null;
        measure();
      });
    };
    const unregister = editor.registerUpdateListener(scheduleMeasure);
    window.addEventListener('resize', scheduleMeasure);
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(anchorElem);
    const rootElem = editor.getRootElement();
    if (rootElem) resizeObserver.observe(rootElem);
    return () => {
      unregister();
      window.removeEventListener('resize', scheduleMeasure);
      resizeObserver.disconnect();
      if (scheduledFrame !== null) cancelAnimationFrame(scheduledFrame);
    };
  }, [editor, nodeKey, anchorElem]);

  const handleToggleClick = useCallback(() => onToggle(nodeKey), [onToggle, nodeKey]);

  if (!position) return null;

  return (
    <ToggleButton
      viewMode="code"
      onClick={handleToggleClick}
      className={classes.toggleButton}
      style={{ top: position.top, right: position.right }}
    />
  );
});

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
  const widgetsRef = useRef(widgets);
  widgetsRef.current = widgets;

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
        const tracked = widgetsRef.current;
        const removed: string[] = [];
        const added: Array<{ key: string; state: WidgetState }> = [];
        const relaid: Array<{ key: string; htmlContent: string; layout: IframeWidgetLayout }> = [];
        editor.getEditorState().read(() => {
          for (const [key, type] of mutations) {
            if (type === 'destroyed') {
              if (tracked.has(key)) removed.push(key);
            } else if (tracked.has(key)) {
              // A previewed widget's placement can change under it (undo, redo): keep the preview in step.
              const state = tracked.get(key)!;
              const htmlContent = $getNodeByKey(key)?.getTextContent() ?? '';
              const layout = parseIframeWidgetLayout(htmlContent);
              if (state.viewMode === 'preview'
                && (layout.position !== state.layout.position || layout.width !== state.layout.width)) {
                relaid.push({ key, htmlContent, layout });
              }
            } else {
              const node = $getNodeByKey(key);
              const htmlContent = node ? node.getTextContent() : '';
              const hasContent = htmlContent.trim().length > 0;
              added.push({
                key,
                state: {
                  viewMode: hasContent ? 'preview' : 'code',
                  previewHeight: IFRAME_DEFAULT_HEIGHT,
                  htmlContent: hasContent ? htmlContent : '',
                  layout: parseIframeWidgetLayout(htmlContent),
                },
              });
            }
          }
        });
        if (removed.length === 0 && added.length === 0 && relaid.length === 0) return;
        setWidgets((prev) => {
          const next = new Map(prev);
          for (const key of removed) next.delete(key);
          for (const { key, state } of added) {
            if (!next.has(key)) next.set(key, state);
          }
          for (const { key, htmlContent, layout } of relaid) {
            const state = next.get(key);
            if (state) next.set(key, { ...state, htmlContent, layout });
          }
          return next;
        });
        for (const { key, state } of added) {
          if (state.viewMode === 'preview') {
            applyPreviewModeToDOM(editor, key, state.previewHeight, state.layout);
          }
        }
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
  // The editor's text column width, for deciding which widgets have room to wrap.
  const [columnWidth, setColumnWidth] = useState(0);
  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) return;
    const measure = () => setColumnWidth(editorColumnWidth(editor));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [editor]);

  useLayoutEffect(() => {
    for (const [key, state] of widgets) {
      if (state.viewMode === 'preview') {
        applyPreviewModeToDOM(editor, key, state.previewHeight, state.layout);
      } else {
        removePreviewModeFromDOM(editor, key);
      }
    }
  }, [editor, widgets, columnWidth]);

  const widgetKeys = Array.from(widgets.keys());
  const positions = usePositionTracking(editor, anchorElem, widgets);

  const handleToggle = useCallback((key: string) => {
    setWidgets((prev) => {
      const next = new Map(prev);
      const state = next.get(key);
      if (!state) return prev;
      if (state.viewMode === 'code') {
        const htmlContent = readCodeContent(editor, key);
        next.set(key, { ...state, viewMode: 'preview', htmlContent, layout: parseIframeWidgetLayout(htmlContent) });
      } else {
        next.set(key, { ...state, viewMode: 'code' });
      }
      return next;
    });
  }, [editor]);

  const handleIframeResize = useCallback((key: string, height: number) => {
    const current = widgetsRef.current.get(key);
    setWidgets((prev) => {
      const next = new Map(prev);
      const state = next.get(key);
      if (!state) return prev;
      next.set(key, { ...state, previewHeight: height });
      return next;
    });
    if (current) applyPreviewModeToDOM(editor, key, height, current.layout);
  }, [editor]);

  // Writes the placement into the widget's own HTML (its <meta name="lw-layout"> tag), which is what
  // the published post reads.
  const handleLayoutChange = useCallback((key: string, layout: IframeWidgetLayout) => {
    editor.update(() => {
      const node = $getNodeByKey(key);
      if (!$isIframeWidgetNode(node)) return;
      const html = setIframeWidgetLayout(node.getTextContent(), layout);
      node.clear();
      node.append($createTextNode(html));
    });
    setWidgets((prev) => {
      const next = new Map(prev);
      const state = next.get(key);
      if (!state) return prev;
      next.set(key, { ...state, layout, htmlContent: setIframeWidgetLayout(state.htmlContent, layout) });
      return next;
    });
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
              onToggle={handleToggle}
            />
          );
        }
        return (
          <IframeWidgetOverlay
            key={key}
            nodeKey={key}
            state={state}
            position={positions.get(key)}
            columnWidth={columnWidth}
            onToggle={handleToggle}
            onIframeResize={handleIframeResize}
            onLayoutChange={handleLayoutChange}
          />
        );
      })}
    </>,
    anchorElem,
  );
}
