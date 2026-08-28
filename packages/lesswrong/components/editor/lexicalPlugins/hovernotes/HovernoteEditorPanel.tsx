"use client";

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import {
  $getRoot,
  COMMAND_PRIORITY_NORMAL,
  EditorState,
  KEY_ESCAPE_COMMAND,
  LexicalEditor,
} from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ListItemNode, ListNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { $generateHtmlFromNodes } from '@lexical/html';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import ContentStyles from '@/components/common/ContentStyles';
import { SparkleIcon } from '@/components/icons/sparkleIcon';
import { CheckSmallIcon } from '@/components/icons/CheckSmallIcon';
import { TrashIcon } from '@/components/lexical/icons/TrashIcon';
import PlaygroundEditorTheme from '@/components/lexical/themes/PlaygroundEditorTheme';
import LinkPlugin from '@/components/lexical/plugins/LinkPlugin';
import { $appendHtmlAsBlocks } from './hovernoteContentSync';

const styles = defineStyles('HovernoteEditorPanel', (theme: ThemeType) => ({
  panel: {
    position: 'absolute',
    zIndex: 1001,
  },
  card: {
    background: theme.palette.panelBackground.default,
    borderRadius: 8,
    boxShadow: `0 10px 20px ${theme.palette.greyAlpha(0.19)}, 0 6px 6px ${theme.palette.greyAlpha(0.23)}`,
    border: `1px solid ${theme.palette.grey[300]}`,
    width: 420,
    maxWidth: 'calc(100vw - 24px)',
  },
  // Match the hover card a reader sees (FootnotePreview's hovercard styles),
  // so the popup renders the note the way it will look on hover.
  body: {
    padding: 16,
    paddingBottom: 8,
    ...theme.typography.body2,
    fontSize: '1.1rem',
    ...theme.typography.commentStyle,
    color: theme.palette.grey[800],
    '& a': {
      color: theme.palette.primary.main,
    },
  },
  contentEditable: {
    outline: 'none',
    minHeight: 40,
    '& > :first-child': {
      marginTop: 0,
    },
    '& > :last-child': {
      marginBottom: 0,
    },
  },
  placeholder: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: '1.1rem',
    color: theme.palette.grey[550],
    position: 'absolute',
    top: 16,
    left: 16,
    userSelect: 'none',
    pointerEvents: 'none',
  },
  editorWrapper: {
    position: 'relative',
  },
  chrome: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '4px 8px 6px 16px',
  },
  hint: {
    flexGrow: 1,
    fontSize: 11,
    color: theme.palette.grey[600],
  },
  button: {
    border: 0,
    display: 'flex',
    background: 'none',
    borderRadius: 6,
    padding: 5,
    cursor: 'pointer',
    color: theme.palette.grey[600],
    '&:hover:not([disabled])': {
      backgroundColor: theme.palette.grey[200],
      color: theme.palette.grey[900],
    },
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
  buttonError: {
    color: theme.palette.error.main,
  },
  icon: {
    width: 16,
    height: 16,
  },
  generatingIcon: {
    animation: 'hovernote-generating-pulse 1s infinite alternate ease-in-out',
  },
  '@keyframes hovernote-generating-pulse': {
    from: { opacity: 0.3 },
    to: { opacity: 1 },
  },
}));

/**
 * Position the panel is anchored to, in document (not viewport) coordinates,
 * so that the panel scrolls together with the document.
 */
export interface HovernoteEditorAnchor {
  left: number;
  bottom: number;
}

interface HovernoteEditorPanelProps {
  anchor: HovernoteEditorAnchor;
  /** The footnote content HTML the nested editor starts from. */
  initialHtml: string;
  /**
   * Bumped (together with a new initialHtml) when the content is replaced from
   * outside, e.g. by an autogeneration result landing.
   */
  contentVersion: number;
  generating: boolean;
  generateError: string | null;
  onHtmlChange: (html: string) => void;
  onApply: () => void;
  onCancel: () => void;
  onRemove: () => void;
  onAutogenerate: () => void;
}

function EscapeCancelPlugin({ onCancel }: { onCancel: () => void }): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        onCancel();
        return true;
      },
      COMMAND_PRIORITY_NORMAL,
    );
  }, [editor, onCancel]);
  return null;
}

const HOVERNOTE_EDITOR_NODES = [ListNode, ListItemNode, LinkNode, AutoLinkNode];

/**
 * The popup for creating/editing a hovernote: a small rich-text editor that
 * renders the note the way the hover card will, plus autogenerate/remove/done
 * buttons. Clicking outside applies; Escape cancels.
 */
const HovernoteEditorPanel = ({
  anchor,
  initialHtml,
  contentVersion,
  generating,
  generateError,
  onHtmlChange,
  onApply,
  onCancel,
  onRemove,
  onAutogenerate,
}: HovernoteEditorPanelProps) => {
  const classes = useStyles(styles);
  const panelRef = useRef<HTMLDivElement>(null);

  // Apply when the user starts a pointer interaction outside the panel
  // (mirrors MathEditorPanel's dismiss behavior).
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      if (target === document.documentElement) return;
      onApply();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [onApply]);

  const handleChange = (editorState: EditorState, editor: LexicalEditor) => {
    editorState.read(() => {
      onHtmlChange($generateHtmlFromNodes(editor, null));
    });
  };

  const initialEditorState = (editor: LexicalEditor) => {
    const root = $getRoot();
    root.clear();
    $appendHtmlAsBlocks(editor, root, initialHtml);
  };

  const panelStyle: React.CSSProperties = {
    left: anchor.left,
    top: anchor.bottom + 6,
  };

  return createPortal(
    <div ref={panelRef} className={classes.panel} style={panelStyle}>
      <div className={classes.card}>
        <LexicalComposer
          key={contentVersion}
          initialConfig={{
            namespace: 'HovernoteEditor',
            theme: PlaygroundEditorTheme,
            nodes: HOVERNOTE_EDITOR_NODES,
            editorState: initialEditorState,
            onError: (error: Error) => {
              throw error;
            },
          }}
        >
          <ContentStyles contentType="postHighlight" className={classes.body}>
            <div className={classes.editorWrapper}>
              <RichTextPlugin
                contentEditable={<ContentEditable className={classes.contentEditable} />}
                placeholder={<div className={classes.placeholder}>Write the note shown on hover…</div>}
                ErrorBoundary={LexicalErrorBoundary}
              />
            </div>
          </ContentStyles>
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <AutoFocusPlugin defaultSelection="rootEnd" />
          <EscapeCancelPlugin onCancel={onCancel} />
        </LexicalComposer>
        <div className={classes.chrome}>
          <span className={classes.hint}>Shown on hover · listed in the footnotes</span>
          <button
            type="button"
            title={generateError ?? 'Autogenerate: research this phrase (with the post as context) and draft the note'}
            aria-label="Autogenerate hovernote"
            disabled={generating}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onAutogenerate}
            className={classNames(classes.button, { [classes.buttonError]: !!generateError })}
          >
            <SparkleIcon className={classNames(classes.icon, { [classes.generatingIcon]: generating })} />
          </button>
          <button
            type="button"
            title="Remove hovernote (keeps the text)"
            aria-label="Remove hovernote"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onRemove}
            className={classes.button}
          >
            <TrashIcon className={classes.icon} />
          </button>
          <button
            type="button"
            title="Done (Esc cancels)"
            aria-label="Done"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onApply}
            className={classes.button}
          >
            <CheckSmallIcon className={classes.icon} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default HovernoteEditorPanel;
