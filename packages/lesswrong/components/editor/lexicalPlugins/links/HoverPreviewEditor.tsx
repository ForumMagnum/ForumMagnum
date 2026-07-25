import React, { useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LinkNode } from '@lexical/link';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes, type EditorState, type LexicalEditor } from 'lexical';
import { parseDocumentFromString } from '@/lib/domParser';
import { validateUrl } from '@/components/lexical/utils/url';
import { buildTextNodeExportMap } from '@/components/editor/lexicalDomExport';
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

// Only the marks that make sense in a two-sentence card. Nested hover previews are
// deliberately not available here: PreviewLinkNode is not registered, so links written
// inside a preview are plain links.
const hoverPreviewTheme = {
  link: 'hoverPreviewEditorLink',
  text: {
    bold: 'hoverPreviewEditorBold',
    italic: 'hoverPreviewEditorItalic',
  },
};

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
 * The small rich-text field used to write a link's custom hover preview, shown inside the
 * floating link editor. A standalone Lexical instance rather than a nested composer: it
 * edits a detached HTML string, not a subtree of the document being edited.
 *
 * `initialHtml` is read once on mount; remount with a new `key` to reset it.
 */
export function HoverPreviewEditor({ initialHtml, onChangeHtml, autoFocus }: {
  initialHtml: string,
  onChangeHtml: (html: string) => void,
  autoFocus?: boolean,
}) {
  const classes = useStyles(styles);

  return (
    <div className={classes.root}>
      <LexicalComposer initialConfig={{
        namespace: 'HoverPreviewEditor',
        nodes: [LinkNode],
        theme: hoverPreviewTheme,
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
              autoFocus={autoFocus}
              aria-label="Hover preview text"
            />
          }
          placeholder={<div className={classes.placeholder}>Preview text…</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <LinkPlugin validateUrl={validateUrl} />
        <HoverPreviewChangeHandler onChangeHtml={onChangeHtml} />
      </LexicalComposer>
    </div>
  );
}
