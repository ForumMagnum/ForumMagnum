"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { defineExtension } from 'lexical';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';
import { useCurrentUser } from '../common/withUser';
import WarningBanner from '../common/WarningBanner';
import { useClientId } from '../hooks/useClientId';
import type { CollaborationConfig } from '../lexical/collaboration';
import { useHocuspocusAuth } from './lexicalPlugins/collaboration/useHocuspocusAuth'
import Editor from '../lexical/Editor';
import type { CollaborativeEditingAccessLevel } from '@/lib/collections/posts/collabEditingPermissions';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { SharedHistoryContext } from '../lexical/context/SharedHistoryContext';
import { TableContext } from '../lexical/plugins/TablePlugin';
import PlaygroundNodes from '../lexical/nodes/PlaygroundNodes';
import PlaygroundEditorTheme from '../lexical/themes/PlaygroundEditorTheme';
import { ToolbarContext } from '../lexical/context/ToolbarContext';
import Settings from '../lexical/Settings';
import { TableCellNode } from '@lexical/table';


const lexicalStyles = defineStyles('LexicalPostEditor', (theme: ThemeType) => ({
  editorContainer: {
    position: 'relative',
    fontFamily: theme.typography.fontFamily,
    fontSize: '1.1rem',
    lineHeight: 1.7,
  },
  editorShell: {
    '--lexical-editor-min-height': '400px',
  },
  editorInner: {
    position: 'relative',
    background: theme.palette.panelBackground.default,
    borderRadius: 4,
  },
  editorInput: {
    minHeight: 400,
    resize: 'none',
    fontSize: '1.1rem',
    position: 'relative',
    outline: 'none',
    padding: '12px 16px',
    caretColor: theme.palette.text.normal,
    '&:focus': {
      outline: 'none',
    },
    // Content styles
    '& p': {
      margin: '0 0 1em 0',
    },
    '& h1': {
      fontSize: '1.8rem',
      fontWeight: 600,
      marginBottom: '0.5em',
      marginTop: '1em',
    },
    '& h2': {
      fontSize: '1.5rem',
      fontWeight: 600,
      marginBottom: '0.5em',
      marginTop: '1em',
    },
    '& h3': {
      fontSize: '1.3rem',
      fontWeight: 600,
      marginBottom: '0.5em',
      marginTop: '1em',
    },
    '& blockquote': {
      margin: '1em 0',
      padding: '0.5em 1em',
      borderLeft: `4px solid ${theme.palette.grey[300]}`,
      color: theme.palette.grey[700],
      backgroundColor: theme.palette.grey[100],
    },
    '& ul, & ol': {
      margin: '0 0 1em 0',
      padding: '0 0 0 1.5em',
    },
    '& li': {
      margin: '0.25em 0',
    },
    '& code': {
      fontFamily: 'monospace',
      backgroundColor: theme.palette.grey[100],
      padding: '0.2em 0.4em',
      borderRadius: 4,
      fontSize: '0.9em',
    },
    '& pre': {
      margin: '1em 0',
      padding: '1em',
      backgroundColor: theme.palette.grey[100],
      borderRadius: 4,
      overflow: 'auto',
      '& code': {
        backgroundColor: 'transparent',
        padding: 0,
      },
    },
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'underline',
    },
    '& strong': {
      fontWeight: 600,
    },
    '& em': {
      fontStyle: 'italic',
    },
    // Footnote styles
    '& .footnote-section': {
      marginTop: '2em',
      paddingTop: '1em',
      borderTop: `1px solid ${theme.palette.grey[300]}`,
      fontSize: '0.9em',
      listStyle: 'none',
      padding: 0,
      counterReset: 'footnote-counter',
    },
    '& .footnote-item': {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.5em',
      marginBottom: '0.5em',
      padding: '0.5em',
      backgroundColor: theme.palette.grey[50],
      borderRadius: 4,
      counterIncrement: 'footnote-counter',
      '&::before': {
        content: 'counter(footnote-counter) ". "',
        flexShrink: 0,
        minWidth: '1.5em',
        textAlign: 'right',
      },
    },
    '& .footnote-content': {
      flex: 1,
      '& p': {
        margin: 0,
      },
    },
    '& .footnote-reference': {
      cursor: 'pointer',
      '& a': {
        color: theme.palette.primary.main,
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        },
      },
    },
    '& .footnote-back-link': {
      marginRight: '0.25em',
      '& a': {
        color: theme.palette.primary.main,
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        },
      },
    },
    // Math styles
    '& .math-tex': {
      cursor: 'pointer',
    },
    '& .math-preview': {
      fontFamily: 'inherit',
    },
    '& .math-inline': {
      display: 'inline-block',
      verticalAlign: 'middle',
    },
    '& .math-display': {
      display: 'block',
      textAlign: 'center',
      margin: '1em 0',
      padding: '0.5em',
    },
    // Spoiler styles
    '& .spoilers': {
      backgroundColor: theme.palette.grey[100],
      border: `1px solid ${theme.palette.grey[300]}`,
      borderRadius: 4,
      padding: '1em',
      margin: '1em 0',
      position: 'relative',
      '&::before': {
        content: '"Spoiler"',
        position: 'absolute',
        top: -10,
        left: 10,
        backgroundColor: theme.palette.panelBackground.default,
        padding: '0 4px',
        fontSize: '0.75em',
        color: theme.palette.grey[600],
        fontWeight: 500,
      },
    },
    // Claim/prediction styles
    '& .elicit-binary-prediction-wrapper': {
      margin: '1em 0',
    },
    // Table styles
    '& table': {
      borderCollapse: 'collapse',
      width: 'auto',
      margin: '1em 0',
      border: `1px solid ${theme.palette.grey[300]}`,
    },
    '& th, & td': {
      border: `1px solid ${theme.palette.grey[300]}`,
      padding: '8px 12px',
      minWidth: 50,
      verticalAlign: 'top',
      position: 'relative',
    },
    '& th': {
      backgroundColor: theme.palette.grey[100],
      fontWeight: 600,
      textAlign: 'left',
    },
    '& td': {
      backgroundColor: theme.palette.panelBackground.default,
    },
    // Selected cell highlighting (class applied by Lexical via theme.tableCellSelected)
    '& td.editor-table-cell-selected, & th.editor-table-cell-selected': {
      backgroundColor: theme.palette.primary.light,
    },
    // Table resize handles (if using column resize)
    '& .table-cell-resizer': {
      position: 'absolute',
      right: -2,
      top: 0,
      bottom: 0,
      width: 4,
      cursor: 'col-resize',
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: theme.palette.primary.main,
      },
    },
  },
  editorInputComment: {
    minHeight: 100,
  },
  editorPlaceholder: {
    color: theme.palette.grey[500],
    overflow: 'hidden',
    position: 'absolute',
    textOverflow: 'ellipsis',
    top: 12,
    left: 16,
    fontSize: '1.1rem',
    userSelect: 'none',
    display: 'inline-block',
    pointerEvents: 'none',
  },
}));

interface LexicalEditorProps {
  data?: string;
  placeholder?: string;
  onChange: (html: string) => void;
  onReady?: () => void;
  commentEditor?: boolean;
  /** Collection name to determine whether collaboration is supported. */
  collectionName?: CollectionNameString;
  /** Document ID for collaborative editing. When provided for Posts, the editor always uses
   * collaborative mode (Yjs) for consistency, even if not sharing with others. */
  documentId?: string | null;
  /** Collaborative editor access level for suggested edits permissions */
  accessLevel?: CollaborativeEditingAccessLevel;
}

const LexicalEditor = ({
  data = '',
  placeholder = 'Start writing...',
  onChange,
  onReady,
  collectionName,
  documentId = null,
  commentEditor = false,
  accessLevel,
}: LexicalEditorProps) => {
  const classes = useStyles(lexicalStyles);
  const currentUser = useCurrentUser();
  const clientId = useClientId();
  const initialHtmlRef = useRef<string | null>(null);
  const lastDocumentIdRef = useRef<string | null>(null);
  const lastEmittedHtmlRef = useRef<string | null>(null);
  const [editorVersion, setEditorVersion] = React.useState(0);
  const [collaborationWarning, setCollaborationWarning] = React.useState<string | null>(null);

  if (lastDocumentIdRef.current !== documentId) {
    lastDocumentIdRef.current = documentId;
    initialHtmlRef.current = data;
  } else if (initialHtmlRef.current === null) {
    initialHtmlRef.current = data;
  }

  // Always enable collaboration for posts (when documentId is available).
  // This ensures we always use Yjs for consistency, even when not sharing with others.
  // Anonymous users can collaborate if they have a clientId (from cookie).
  const shouldEnableCollaboration = collectionName === 'Posts' && !!documentId;
  const { auth: hocuspocusAuth, loading: authLoading, error: authError } = useHocuspocusAuth(
    documentId,
    !shouldEnableCollaboration
  );

  // Build collaboration config when auth is available
  const collaborationConfig: CollaborationConfig | null = useMemo(() => {
    if (!shouldEnableCollaboration || !hocuspocusAuth) {
      return null;
    }
    // Use currentUser info if logged in, otherwise use clientId for anonymous users
    const userId = currentUser?._id ?? clientId ?? 'anonymous';
    const userName = currentUser?.displayName ?? 'Anonymous';
    
    return {
      postId: documentId!,
      token: hocuspocusAuth.token,
      wsUrl: hocuspocusAuth.wsUrl,
      documentName: hocuspocusAuth.documentName,
      user: {
        id: userId,
        name: userName,
      },
      onError: (error) => {
        setCollaborationWarning(error.message);
      },
    };
  }, [shouldEnableCollaboration, hocuspocusAuth, currentUser, clientId, documentId]);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  // Handle external data changes when NOT in collaborative mode (e.g., comments).
  // In collaborative mode, the Yjs document is the source of truth.
  useEffect(() => {
    if (shouldEnableCollaboration) return;
    const lastEmitted = lastEmittedHtmlRef.current;
    if (lastEmitted !== null && data === lastEmitted) return;
    if ((initialHtmlRef.current ?? '') === data) return;
    initialHtmlRef.current = data;
    setEditorVersion((prev) => prev + 1);
  }, [shouldEnableCollaboration, data]);

  const handleChange = React.useCallback((html: string) => {
    lastEmittedHtmlRef.current = html;
    onChange(html);
  }, [onChange]);

  const app = useMemo(
    () =>
      defineExtension({
        $initialEditorState: null,
        html: {
          export: new Map([[
            TableCellNode,
            (editor, target) => {
              const output = target.exportDOM(editor);
              if (output.element && 'style' in output.element) {
                output.element.style = '';
              }
              return output;
            }
          ]])
        },
        name: '@lexical/playground',
        namespace: 'Playground',
        nodes: PlaygroundNodes,
        theme: PlaygroundEditorTheme,
        dependencies: [],
      }),
    [],
  );

  // Show loading state while fetching collaboration auth
  if (shouldEnableCollaboration && authLoading) {
    return (
      <div className={classes.editorContainer}>
        <div className={classes.editorInner}>
          <div className={classes.editorPlaceholder}>Loading collaborative editor...</div>
        </div>
      </div>
    );
  }

  // Fail closed if collaboration is required but auth is missing or failed.
  if (shouldEnableCollaboration && !authLoading && !hocuspocusAuth) {
    // eslint-disable-next-line no-console
    console.error('[LexicalEditor] Failed to get collaboration auth:', authError);
    return (
      <div className={classes.editorContainer}>
        <div className={classes.editorInner}>
          <WarningBanner
            message="Unable to start collaborative editing. Please refresh, or message us on Intercom if this persists."
          />
        </div>
      </div>
    );
  }

  return (
    <LexicalCollaboration>
      <LexicalExtensionComposer extension={app} contentEditable={null}>
        <SharedHistoryContext>
          <TableContext>
            <ToolbarContext>
              {collaborationWarning && shouldEnableCollaboration && (
                <WarningBanner message={collaborationWarning} />
              )}
              <div className={classNames(!commentEditor && classes.editorShell)}>
                <Editor
                  key={`${documentId ?? 'lexical-new'}-${editorVersion}`}
                  collaborationConfig={collaborationConfig ?? undefined}
                  accessLevel={accessLevel}
                  initialHtml={initialHtmlRef.current ?? ''}
                  onChangeHtml={handleChange}
                  placeholder={placeholder}
                  commentEditor={commentEditor}
                />
              </div>
              {/* {!commentEditor && <Settings />} */}
              {/* {isDevPlayground ? <DocsPlugin /> : null}
              {isDevPlayground ? <PasteLogPlugin /> : null}
              {isDevPlayground ? <TestRecorderPlugin /> : null}

              {measureTypingPerf ? <TypingPerfPlugin /> : null} */}
            </ToolbarContext>
          </TableContext>
        </SharedHistoryContext>
      </LexicalExtensionComposer>
    </LexicalCollaboration>
  );
};

export default LexicalEditor;

