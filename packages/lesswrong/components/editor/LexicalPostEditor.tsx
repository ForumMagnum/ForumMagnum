"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import { LexicalCollaboration } from '@lexical/react/LexicalCollaborationContext';
import { defineExtension } from 'lexical';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useCurrentUser } from '../common/withUser';
import { useClientId } from '../hooks/useClientId';
import type { CollaborationConfig } from '../lexical/collaboration';
import { useHocuspocusAuth } from './lexicalPlugins/collaboration/useHocuspocusAuth'
import Editor from '../lexical/Editor';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { SharedHistoryContext } from '../lexical/context/SharedHistoryContext';
import { TableContext } from '../lexical/plugins/TablePlugin';
import PlaygroundNodes from '../lexical/nodes/PlaygroundNodes';
import PlaygroundEditorTheme from '../lexical/themes/PlaygroundEditorTheme';
import { ToolbarContext } from '../lexical/context/ToolbarContext';
import Settings from '../lexical/Settings';


const lexicalStyles = defineStyles('LexicalPostEditor', (theme: ThemeType) => ({
  editorContainer: {
    position: 'relative',
    fontFamily: theme.typography.fontFamily,
    fontSize: '1.1rem',
    lineHeight: 1.7,
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
    // Collapsible section styles
    '& .detailsBlock': {
      margin: '1em 0',
      border: `1px solid ${theme.palette.grey[300]}`,
      borderRadius: 4,
      overflow: 'hidden',
    },
    '& .detailsBlockEdit': {
      // In editing mode, we use a div instead of details for better cursor control
    },
    '& .detailsBlockTitle': {
      padding: '0.75em 1em',
      backgroundColor: theme.palette.grey[100],
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5em',
      '&::before': {
        content: '"▼"',
        fontSize: '0.75em',
        transition: 'transform 0.2s ease',
      },
      '& p': {
        margin: 0,
        flex: 1,
      },
    },
    '& .detailsBlockClosed .detailsBlockTitle::before': {
      transform: 'rotate(-90deg)',
    },
    '& .detailsBlockContent': {
      padding: '0.75em 1em',
      '& > p:first-child': {
        marginTop: 0,
      },
      '& > p:last-child': {
        marginBottom: 0,
      },
    },
    '& .detailsBlockClosed .detailsBlockContent': {
      display: 'none',
    },
    '& .detailsBlock.detailsBlockSelected': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
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
}), { allowNonThemeColors: true });

interface LexicalPostEditorProps {
  data?: string;
  placeholder?: string;
  onChange: (html: string) => void;
  onReady?: () => void;
  commentEditor?: boolean;
  /** Post ID for enabling collaborative editing. If not provided, collaboration is disabled. */
  postId?: string | null;
  /** Whether to enable collaborative editing (requires postId) */
  collaborative?: boolean;
}

const LexicalPostEditor = ({
  data = '',
  placeholder = 'Start writing...',
  onChange,
  onReady,
  postId = null,
  collaborative = false,
}: LexicalPostEditorProps) => {
  const classes = useStyles(lexicalStyles);
  const currentUser = useCurrentUser();
  const clientId = useClientId();
  const initialHtmlRef = useRef<string | null>(null);
  const lastPostIdRef = useRef<string | null>(null);
  if (lastPostIdRef.current !== postId) {
    lastPostIdRef.current = postId;
    initialHtmlRef.current = data;
  } else if (initialHtmlRef.current === null) {
    initialHtmlRef.current = data;
  }

  // Fetch Hocuspocus auth if collaboration is enabled
  // Anonymous users can collaborate if they have a clientId (from cookie)
  const shouldEnableCollaboration = collaborative && !!postId;
  const { auth: hocuspocusAuth, loading: authLoading, error: authError } = useHocuspocusAuth(
    postId,
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
      postId: postId!,
      token: hocuspocusAuth.token,
      wsUrl: hocuspocusAuth.wsUrl,
      documentName: hocuspocusAuth.documentName,
      user: {
        id: userId,
        name: userName,
      },
    };
  }, [shouldEnableCollaboration, hocuspocusAuth, currentUser, clientId, postId]);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const app = useMemo(
    () =>
      defineExtension({
        $initialEditorState: null,
        // html: buildHTMLConfig(),
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

  // Log auth errors but continue without collaboration
  if (authError) {
    // eslint-disable-next-line no-console
    console.error('[LexicalPostEditor] Failed to get collaboration auth:', authError);
  }

  return (
    <LexicalCollaboration>
      <LexicalExtensionComposer extension={app} contentEditable={null}>
        <SharedHistoryContext>
          <TableContext>
            <ToolbarContext>
              <div className="editor-shell">
                <Editor
                  key={postId ?? 'lexical-new'}
                  collaborationConfig={collaborationConfig ?? undefined}
                  initialHtml={initialHtmlRef.current ?? ''}
                  onChangeHtml={onChange}
                  placeholder={placeholder}
                />
              </div>
              <Settings />
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

export default LexicalPostEditor;

