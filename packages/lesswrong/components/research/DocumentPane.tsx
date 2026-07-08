"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation, useApolloClient } from '@apollo/client/react';
import { pollForConversationTitle, ProjectSidebarQuery } from './projectSidebarQuery';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { researchEditorNodes } from './lexical/researchEditorNodes';
import { ResearchEditorPlugins } from './lexical/ResearchEditorPlugins';
import {
  ResearchEditorProvider,
  ResearchNavigationProvider,
  PendingConversationsProvider,
  type FireQueryResult,
  type FireDocumentQueryArgs,
  type PendingConversation,
  type ResearchEditorEnvironment,
  type ResearchNavigationContextValue,
} from './lexical/ResearchEditorContext';
import Loading from '../vulcan-core/Loading';
import LexicalEditor from '../editor/LexicalEditor';
import ContentStyles from '../common/ContentStyles';
import classNames from 'classnames';
import {
  ResearchCommentsMarginHostProvider,
  type ResearchCommentsMarginHost,
} from './lexical/researchCommentsMarginContext';

interface DocumentPaneProps {
  projectId: string;
  documentId: string | null;
  openConversation: (conversationId: string) => void;
  onSelectDocument: (documentId: string) => void;
}

const ResearchDocumentQuery = gql(`
  query ResearchDocumentQuery($documentId: String!) {
    researchDocument(selector: { _id: $documentId }) {
      result {
        _id
        title
        contents {
          html
          originalContents {
            type
            data
          }
        }
      }
    }
  }
`);

const FireDocumentConversationMutation = gql(`
  mutation FireDocumentConversation(
    $conversationId: String!
    $projectId: String!
    $activeDocumentId: String!
    $promptHtml: String!
    $baseEnvironmentId: String
    $runtime: String
  ) {
    fireResearchConversation(
      input: {
        conversationId: $conversationId
        projectId: $projectId
        kind: document
        activeDocumentId: $activeDocumentId
        promptHtml: $promptHtml
        baseEnvironmentId: $baseEnvironmentId
        runtime: $runtime
      }
    ) {
      conversationId
    }
  }
`);

const COMMENTS_MARGIN_WIDTH = 300;
const COMMENTS_MARGIN_RIGHT = 16;

const styles = defineStyles('DocumentPane', (theme: ThemeType) => ({
  // Positioning context for the document-swap (see the DocumentPane wrapper).
  swapRoot: {
    position: 'relative',
    height: '100%',
  },
  // The on-screen document fills the wrapper.
  pane: {
    height: '100%',
  },
  // The incoming document loads here — a real mount (so it connects + syncs)
  // laid over the current one but fully transparent and click-through, until it
  // has painted content and is promoted to the visible pane.
  loadingPane: {
    position: 'absolute',
    inset: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.text.dim,
    fontSize: 14,
  },
  editorWrap: {
    flex: 1,
    overflow: 'auto',
    position: 'relative',
    // Editor-content typography (sizing of paragraphs, headings, lists, etc.,
    // plus placeholder positioning) lives in the `researchDocument` content
    // type in ContentStylesValues, scoped under `[data-lexical-editor]`
    // so it doesn't leak onto floating menus or popovers inside this wrap.
  },
  editorWrapWithComments: {
    '& [contenteditable="true"]:not(.research-query-input-content):not(.research-chat-composer *)': {
      marginRight: COMMENTS_MARGIN_WIDTH + COMMENTS_MARGIN_RIGHT + 24,
    },
  },
  commentsMargin: {
    position: 'absolute',
    top: 44,
    right: COMMENTS_MARGIN_RIGHT,
    width: COMMENTS_MARGIN_WIDTH,
    height: 0,
    overflow: 'visible',
    pointerEvents: 'none',
    zIndex: 2,
  },
  loadingWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

interface DocumentPaneInnerProps extends DocumentPaneProps {
  /** Fired when this pane's editor has loaded (see ResearchEditorPlugins.onReady).
   * Set only on the incoming pane during a swap, so DocumentPane knows when to promote it. */
  onReady?: () => void;
  /** Whether this pane's document is the navigation target — only the active pane
   * acts on workspace intents (see WorkspaceIntentPlugin). */
  active?: boolean;
}

const DocumentPaneInner = ({ projectId, documentId, openConversation, onSelectDocument, onReady, active }: DocumentPaneInnerProps) => {
  const classes = useStyles(styles);
  const apolloClient = useApolloClient();
  const [commentsMarginEl, setCommentsMarginEl] = useState<HTMLDivElement | null>(null);
  const [openThreadCount, setOpenThreadCount] = useState(0);
  const commentsMarginHost = useMemo<ResearchCommentsMarginHost>(() => ({
    portalContainer: commentsMarginEl,
    setOpenThreadCount,
  }), [commentsMarginEl]);
  const [fireConversation] = useMutation(FireDocumentConversationMutation, {
    refetchQueries: [ProjectSidebarQuery],
  });

  const { data, loading } = useQuery(ResearchDocumentQuery, {
    variables: { documentId: documentId ?? '' },
    skip: !documentId,
    fetchPolicy: 'cache-and-network',
  });

  const documentRecord = data?.researchDocument?.result;

  const [pendingConversations, setPendingConversations] = useState<ReadonlyMap<string, PendingConversation>>(new Map<string, PendingConversation>());

  const fireDocumentQuery = useCallback(
    async (args: FireDocumentQueryArgs): Promise<FireQueryResult> => {
      if (!documentId) {
        throw new Error('Cannot fire query: no document loaded');
      }
      setPendingConversations((prev) => {
        const next = new Map(prev);
        next.set(args.conversationId, { promptHtml: args.promptHtml });
        return next;
      });
      try {
        const result = await fireConversation({
          variables: {
            conversationId: args.conversationId,
            projectId,
            activeDocumentId: args.documentId,
            promptHtml: args.promptHtml,
            baseEnvironmentId: args.baseEnvironmentId,
            runtime: args.runtime,
          },
        });
        const conversationId = result.data?.fireResearchConversation?.conversationId;
        if (!conversationId) {
          throw new Error('fireResearchConversation returned no conversationId');
        }
        void pollForConversationTitle(apolloClient, projectId, conversationId);
        return { conversationId };
      } finally {
        setPendingConversations((prev) => {
          if (!prev.has(args.conversationId)) return prev;
          const next = new Map(prev);
          next.delete(args.conversationId);
          return next;
        });
      }
    },
    [projectId, documentId, fireConversation, apolloClient],
  );

  const researchEditorEnvironment = useMemo<ResearchEditorEnvironment | null>(() => {
    if (!documentId) return null;
    return { documentId, projectId, fireDocumentQuery };
  }, [documentId, projectId, fireDocumentQuery]);

  const researchNavigationContext = useMemo<ResearchNavigationContextValue | null>(() => {
    if (!documentId) return null;
    return {
      navigateToDocument: onSelectDocument,
      openConversation,
      host: { kind: 'document', documentId },
    };
  }, [documentId, onSelectDocument, openConversation]);

  if (!documentId) {
    return (
      <div className={classes.empty}>
        Select a document from the sidebar, or create a new one.
      </div>
    );
  }

  if (loading && !documentRecord) {
    return (
      <div className={classes.loadingWrap}>
        <Loading />
      </div>
    );
  }

  if (!documentRecord || !researchEditorEnvironment || !researchNavigationContext) {
    return <div className={classes.empty}>Document not found.</div>;
  }

  return (
    <div className={classes.root}>
      <ContentStyles
        contentType="researchDocument"
        className={classNames(classes.editorWrap, openThreadCount > 0 && classes.editorWrapWithComments)}
      >
        <ResearchNavigationProvider value={researchNavigationContext}>
          <ResearchEditorProvider environment={researchEditorEnvironment}>
            <PendingConversationsProvider value={pendingConversations}>
              <ResearchCommentsMarginHostProvider value={commentsMarginHost}>
                <LexicalEditor
                  data={documentRecord.contents?.html ?? ''}
                  placeholder="Start writing..."
                  collectionName="ResearchDocuments"
                  documentId={documentId}
                  fieldName="contents"
                  accessLevel="edit"
                  extraNodes={researchEditorNodes}
                  disableMentions
                >
                  <ResearchEditorPlugins projectId={projectId} onReady={onReady} active={active} />
                </LexicalEditor>
              </ResearchCommentsMarginHostProvider>
            </PendingConversationsProvider>
          </ResearchEditorProvider>
        </ResearchNavigationProvider>
        <div ref={setCommentsMarginEl} className={classes.commentsMargin} />
      </ContentStyles>
    </div>
  );
};

/**
 * Backstop for promoting the incoming pane, in case its editor never reports
 * ready (e.g. a brand-new document that syncs to genuinely nothing while
 * offline). The common empty-document case is handled promptly by the first
 * collaboration sync, so this only covers the rare stuck case.
 */
const PROMOTE_TIMEOUT_MS = 2000;

/**
 * Flash-free document switching. Navigating to a new document keeps the current
 * one on screen while the incoming one mounts *for real* but invisibly (so it
 * connects + syncs via the normal collaboration path — a hidden `<Activity>`
 * wouldn't run its effects and so would never load), and only swaps once the
 * incoming editor reports ready (its `ResearchEditorPlugins.onReady` — content
 * painted, or first collaboration sync). The swap runs in a React transition,
 * so it stays low-priority and is interruptible if the user navigates again
 * mid-load.
 *
 * Both panes are keyed siblings under one parent, so promoting the incoming one
 * just flips its class from the transparent overlay to the visible pane — the
 * already-synced editor instance is preserved, never remounted. Relies on
 * multiple live collaborative editors coexisting (the per-editor provider
 * factory; previously a module-level config singleton allowed only one).
 */
const DocumentPane = (props: DocumentPaneProps) => {
  const classes = useStyles(styles);
  const { documentId } = props;
  const [displayedId, setDisplayedId] = useState<string | null>(documentId);
  const [, startTransition] = useTransition();
  const documentIdRef = useRef(documentId);
  documentIdRef.current = documentId;

  // A null target (no document selected) shows immediately.
  useEffect(() => {
    if (documentId === null) setDisplayedId(null);
  }, [documentId]);

  const pendingId = documentId !== null && documentId !== displayedId ? documentId : null;

  // Promote the incoming pane to the visible one — ignoring stale readiness if
  // the user has since navigated elsewhere. The swap is a transition so it stays
  // interruptible.
  const promote = useCallback((id: string) => {
    if (documentIdRef.current !== id) return;
    startTransition(() => {
      setDisplayedId((current) => (documentIdRef.current === id ? id : current));
    });
  }, []);

  // Backstop only — the pending pane normally promotes itself via onReady.
  useEffect(() => {
    if (pendingId === null) return;
    const timer = setTimeout(() => promote(pendingId), PROMOTE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [pendingId, promote]);

  const panes: Array<{ id: string | null; pending: boolean }> = [{ id: displayedId, pending: false }];
  if (pendingId !== null) panes.push({ id: pendingId, pending: true });

  return (
    <div className={classes.swapRoot}>
      {panes.map(({ id, pending }) => (
        <div
          key={id ?? 'empty'}
          className={classNames(classes.pane, pending && classes.loadingPane)}
        >
          <DocumentPaneInner
            {...props}
            documentId={id}
            active={id === documentId}
            onReady={pending && id !== null ? () => promote(id) : undefined}
          />
        </div>
      ))}
    </div>
  );
};

export default DocumentPane;
