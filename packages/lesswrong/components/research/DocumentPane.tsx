"use client";

import React, { useCallback, useMemo, useState } from 'react';
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

const DocumentPane = ({ projectId, documentId, openConversation, onSelectDocument }: DocumentPaneProps) => {
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
                  <ResearchEditorPlugins projectId={projectId} />
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

export default DocumentPane;
