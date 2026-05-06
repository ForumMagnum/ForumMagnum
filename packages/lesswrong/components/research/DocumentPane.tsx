"use client";

import React, { useCallback, useMemo } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ListNode, ListItemNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { LinkNode } from '@lexical/link';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { researchEditorNodes } from './lexical/researchEditorNodes';
import { ResearchEditorPlugins } from './lexical/ResearchEditorPlugins';
import { ResearchEditorProvider, type FireQueryResult, type FireDocumentQueryArgs } from './lexical/ResearchEditorContext';
import { ResearchAnchorProvider } from './lexical/ResearchAnchorContext';
import Loading from '../vulcan-core/Loading';

interface DocumentPaneProps {
  projectId: string;
  documentId: string | null;
  onOpenChat: (conversationId: string) => void;
}

interface ResearchDocumentDetail {
  _id: string;
  title: string | null;
  contents: {
    html: string | null;
    originalContents: { type: string; data: string } | null;
  } | null;
}

interface DocumentQueryResult {
  researchDocument: { result: ResearchDocumentDetail } | null;
}

interface DocumentQueryVars {
  documentId: string;
}

const ResearchDocumentQuery = gql(`
  query ResearchDocumentQuery($documentId: String!) {
    researchDocument(input: { selector: { _id: $documentId } }) {
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
`) as TypedDocumentNode<DocumentQueryResult, DocumentQueryVars>;

interface FireConversationResult {
  fireResearchConversation: { conversationId: string } | null;
}

interface FireConversationVars {
  projectId: string;
  entrypoint: { kind: string; documentId?: string; anchorId?: string };
  prompt: string;
}

const FireDocumentConversationMutation = gql(`
  mutation FireDocumentConversation($projectId: String!, $entrypoint: JSON!, $prompt: String!) {
    fireResearchConversation(input: { projectId: $projectId, entrypoint: $entrypoint, prompt: $prompt }) {
      conversationId
    }
  }
`) as TypedDocumentNode<FireConversationResult, FireConversationVars>;

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
  titleBar: {
    padding: '12px 24px 0',
    fontSize: 22,
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  editorWrap: {
    flex: 1,
    padding: '12px 24px 24px',
    overflow: 'auto',
    position: 'relative',
  },
  editorRoot: {
    position: 'relative',
    minHeight: '100%',
    fontSize: 16,
    lineHeight: 1.6,
    color: theme.palette.text.primary,
  },
  contentEditable: {
    minHeight: 200,
    outline: 'none',
    padding: '8px 0',
    '& p': { margin: '0 0 12px' },
    '& h1, & h2, & h3': { margin: '24px 0 12px' },
    '& ul, & ol': { paddingLeft: 24, margin: '0 0 12px' },
  },
  placeholder: {
    color: theme.palette.text.dim,
    pointerEvents: 'none',
    position: 'absolute',
    top: 8,
    left: 0,
  },
  loadingWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

const editorTheme = {
  paragraph: 'research-document-paragraph',
};

const DocumentPane = ({ projectId, documentId, onOpenChat }: DocumentPaneProps) => {
  const classes = useStyles(styles);
  const [fireConversation] = useMutation(FireDocumentConversationMutation);

  const { data, loading } = useQuery(ResearchDocumentQuery, {
    variables: { documentId: documentId ?? '' },
    skip: !documentId,
    fetchPolicy: 'cache-and-network',
  });

  const documentRecord = data?.researchDocument?.result;

  const fireDocumentQuery = useCallback(
    async (args: FireDocumentQueryArgs): Promise<FireQueryResult> => {
      if (!documentId) {
        throw new Error('Cannot fire query: no document loaded');
      }
      const result = await fireConversation({
        variables: {
          projectId,
          entrypoint: {
            kind: 'document',
            documentId: args.documentId,
            anchorId: args.anchorId,
          },
          prompt: args.prompt ?? '',
        },
      });
      const conversationId = result.data?.fireResearchConversation?.conversationId;
      if (!conversationId) {
        throw new Error('fireResearchConversation returned no conversationId');
      }
      onOpenChat(conversationId);
      return { conversationId };
    },
    [projectId, documentId, fireConversation, onOpenChat],
  );

  const initialConfig = useMemo(() => {
    return {
      namespace: `research-doc-${documentId ?? 'placeholder'}`,
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        LinkNode,
        ...researchEditorNodes,
      ],
      onError: (error: Error) => {
        // eslint-disable-next-line no-console
        console.error('[DocumentPane Lexical]', error);
      },
      theme: editorTheme,
      editorState: tryParseEditorState(documentRecord?.contents),
    };
  }, [documentId, documentRecord?.contents]);

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

  if (!documentRecord) {
    return <div className={classes.empty}>Document not found.</div>;
  }

  return (
    <div className={classes.root}>
      <div className={classes.titleBar}>{documentRecord.title ?? 'Untitled document'}</div>
      <div className={classes.editorWrap}>
        <LexicalComposer key={documentId} initialConfig={initialConfig}>
          <ResearchEditorProvider environment={{ documentId, fireDocumentQuery }}>
            <ResearchAnchorProvider>
              <div className={classes.editorRoot}>
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable className={classes.contentEditable} />
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <ListPlugin />
              </div>
              <ResearchEditorPlugins
                environment={{
                  documentId,
                  fireDocumentQuery,
                }}
              />
            </ResearchAnchorProvider>
          </ResearchEditorProvider>
        </LexicalComposer>
      </div>
    </div>
  );
};

/**
 * Attempt to parse persisted Lexical contents JSON. Returns `undefined` to let
 * Lexical use its default empty state if parsing fails or there's no value.
 */
function tryParseEditorState(contents: unknown): string | undefined {
  if (!contents) return undefined;
  if (typeof contents === 'string') return contents;
  try {
    return JSON.stringify(contents);
  } catch {
    return undefined;
  }
}

export default DocumentPane;
