import React, { useCallback, useEffect, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';

import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import {
  $getRoot,
  $insertNodes,
  COMMAND_PRIORITY_NORMAL,
  KEY_DOWN_COMMAND,
  type EditorState,
  type LexicalEditor,
} from 'lexical';
import { parseDocumentFromString } from '@/lib/domParser';
import { validateUrl } from '@/components/lexical/utils/url';
import { isInsertLink } from '@/components/lexical/plugins/ShortcutsPlugin/shortcuts';
import { buildTextNodeExportMap } from '@/components/editor/lexicalDomExport';
import FloatingLinkEditorPlugin from '@/components/lexical/plugins/FloatingLinkEditorPlugin';
import { hoverPreviewEditorNodes, MAX_HOVER_PREVIEW_DEPTH } from './HoverPreviewNode';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('HoverPreviewEditor', (theme: ThemeType) => ({
  root: {
    position: 'relative',
    margin: '0 12px 8px 12px',
    padding: '6px 10px',
    borderRadius: 8,
    backgroundColor: theme.palette.grey[200],
  },
  contentEditable: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: 14,
    color: theme.palette.grey[800],
    outline: 0,
    minHeight: 40,
    maxHeight: 160,
    overflowY: 'auto',
    '& p': {
      margin: '0 0 4px 0',
    },
    '& p:last-child': {
      marginBottom: 0,
    },
    '& a': {
      color: theme.palette.primary.main,
    },
  },
  placeholder: {
    position: 'absolute',
    top: 6,
    left: 10,
    pointerEvents: 'none',
    userSelect: 'none',
    ...theme.typography.commentStyle,
    fontSize: 14,
    color: theme.palette.grey[500],
  },
}));

function onHoverPreviewEditorError(error: Error): void {
  // eslint-disable-next-line no-console
  console.error('Hover preview editor error', error);
}

function seedFromHtml(html: string) {
  return (editor: LexicalEditor) => {
    if (!html) {
      return;
    }
    const { document } = parseDocumentFromString(html);
    const nodes = $generateNodesFromDOM(editor, document);
    const root = $getRoot();
    root.clear();
    $insertNodes(nodes);
  };
}

/** The body editor has no toolbar, so Cmd/Ctrl-K is the only way in. */
function OpenLinkEditorShortcut({ onOpen }: { onOpen: () => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => editor.registerCommand(
    KEY_DOWN_COMMAND,
    (event: KeyboardEvent) => {
      if (!isInsertLink(event)) {
        return false;
      }
      event.preventDefault();
      onOpen();
      return true;
    },
    COMMAND_PRIORITY_NORMAL,
  ), [editor, onOpen]);

  return null;
}

function HoverPreviewChangeHandler({ onChangeHtml }: { onChangeHtml: (html: string) => void }) {
  const [editor] = useLexicalComposerContext();

  const onChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      onChangeHtml($generateHtmlFromNodes(editor, null));
    });
  }, [editor, onChangeHtml]);

  return <OnChangePlugin onChange={onChange} ignoreSelectionChange />;
}

/**
 * The rich-text field for a preview body. A standalone Lexical instance,
 * not a nested composer: it edits a detached HTML string, read once on
 * mount (remount with a new `key` to reset).
 *
 * Mounts its own link editor so previews nest, up to
 * MAX_HOVER_PREVIEW_DEPTH. That editor portals to the outer anchorElem;
 * this box scrolls and would clip it.
 */
export function HoverPreviewEditor({ initialHtml, onChangeHtml, depth, anchorElem }: {
  initialHtml: string,
  onChangeHtml: (html: string) => void,
  depth: number,
  anchorElem: HTMLElement,
}) {
  const classes = useStyles(styles);
  const [isLinkEditMode, setIsLinkEditMode] = useState(false);
  const openLinkEditor = useCallback(() => setIsLinkEditMode(true), []);
  const canNest = depth < MAX_HOVER_PREVIEW_DEPTH;

  return (
    <div className={classes.root}>
      <LexicalComposer initialConfig={{
        namespace: 'HoverPreviewEditor',
        nodes: hoverPreviewEditorNodes,
        onError: onHoverPreviewEditorError,
        editorState: seedFromHtml(initialHtml),
        // Same TextNode export override the main editor uses, so bold or italic preview
        // text exports as a single semantic element instead of <b><strong>text</strong></b>.
        html: { export: buildTextNodeExportMap() },
      }}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className={classes.contentEditable}
              aria-label="Hover preview text"
            />
          }
          placeholder={<div className={classes.placeholder}>Preview text…</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <LinkPlugin validateUrl={validateUrl} />
        <HoverPreviewChangeHandler onChangeHtml={onChangeHtml} />
        {canNest && <>
          <OpenLinkEditorShortcut onOpen={openLinkEditor} />
          <FloatingLinkEditorPlugin
            anchorElem={anchorElem}
            isLinkEditMode={isLinkEditMode}
            setIsLinkEditMode={setIsLinkEditMode}
            depth={depth}
          />
        </>}
      </LexicalComposer>
    </div>
  );
}
