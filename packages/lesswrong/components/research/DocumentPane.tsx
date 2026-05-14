"use client";

import React, { useCallback, useMemo } from 'react';
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
  type FireQueryResult,
  type FireDocumentQueryArgs,
  type ResearchEditorEnvironment,
  type ResearchNavigationContextValue,
} from './lexical/ResearchEditorContext';
import Loading from '../vulcan-core/Loading';
import LexicalEditor from '../editor/LexicalEditor';
import ContentStyles from '../common/ContentStyles';

interface DocumentPaneProps {
  projectId: string;
  documentId: string | null;
  onOpenConversationInChat: (conversationId: string) => void;
  onSelectDocument: (documentId: string) => void;
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
`);

const FireDocumentConversationMutation = gql(`
  mutation FireDocumentConversation($projectId: String!, $entrypoint: JSON!, $prompt: String!) {
    fireResearchConversation(input: { projectId: $projectId, entrypoint: $entrypoint, prompt: $prompt }) {
      conversationId
    }
  }
`);

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
    // type in ContentStylesValues, scoped under `[contenteditable="true"]`
    // so it doesn't leak onto floating menus or popovers inside this wrap.
  },
  loadingWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

function ignoreEditorChange(_html: string) {
  // ResearchDocument edits persist through the Yjs/Hocuspocus collaboration path.
}

const DocumentPane = ({ projectId, documentId, onOpenConversationInChat, onSelectDocument }: DocumentPaneProps) => {
  const classes = useStyles(styles);
  const apolloClient = useApolloClient();
  const [fireConversation] = useMutation(FireDocumentConversationMutation, {
    refetchQueries: [ProjectSidebarQuery],
  });

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
          },
          prompt: args.prompt ?? '',
        },
      });
      const conversationId = result.data?.fireResearchConversation?.conversationId;
      if (!conversationId) {
        throw new Error('fireResearchConversation returned no conversationId');
      }
      void pollForConversationTitle(apolloClient, projectId, conversationId);
      // Document queries belong to the AgentBlock that fired them; the chat
      // pane is for stand-alone chat conversations. Surfacing every document
      // query in the chat pane made the chat appear to mirror whichever
      // AgentBlock was most recently active.
      return { conversationId };
    },
    [projectId, documentId, fireConversation, apolloClient],
  );

  const researchEditorEnvironment = useMemo<ResearchEditorEnvironment | null>(() => {
    if (!documentId) return null;
    return { documentId, fireDocumentQuery };
  }, [documentId, fireDocumentQuery]);

  const researchNavigationContext = useMemo<ResearchNavigationContextValue | null>(() => {
    if (!documentId) return null;
    return {
      navigateToDocument: onSelectDocument,
      openConversationInChat: onOpenConversationInChat,
      host: { kind: 'document', documentId },
    };
  }, [documentId, onSelectDocument, onOpenConversationInChat]);

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
      <ContentStyles contentType="researchDocument" className={classes.editorWrap}>
        <ResearchNavigationProvider value={researchNavigationContext}>
          <ResearchEditorProvider environment={researchEditorEnvironment}>
            <LexicalEditor
              data={documentRecord.contents?.html ?? ''}
              onChange={ignoreEditorChange}
              placeholder="Start writing..."
              collectionName="ResearchDocuments"
              documentId={documentId}
              fieldName="contents"
              accessLevel="edit"
              extraNodes={researchEditorNodes}
              disableComponentPicker
              disableMentions
            >
              <ResearchEditorPlugins projectId={projectId} />
            </LexicalEditor>
          </ResearchEditorProvider>
        </ResearchNavigationProvider>
      </ContentStyles>
    </div>
  );
};

export default DocumentPane;
