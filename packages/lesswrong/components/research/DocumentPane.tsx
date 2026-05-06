"use client";

import React, { useCallback } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { researchEditorNodes } from './lexical/researchEditorNodes';
import { ResearchEditorPlugins } from './lexical/ResearchEditorPlugins';
import { type FireQueryResult, type FireDocumentQueryArgs } from './lexical/ResearchEditorContext';
import Loading from '../vulcan-core/Loading';
import LexicalEditor from '../editor/LexicalEditor';

interface DocumentPaneProps {
  projectId: string;
  documentId: string | null;
  onOpenChat: (conversationId: string) => void;
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
        <LexicalEditor
          data={documentRecord.contents?.html ?? ''}
          onChange={ignoreEditorChange}
          placeholder="Start writing..."
          collectionName="ResearchDocuments"
          documentId={documentId}
          fieldName="contents"
          accessLevel="edit"
          extraNodes={researchEditorNodes}
        >
          <ResearchEditorPlugins
            environment={{
              documentId,
              fireDocumentQuery,
            }}
          />
        </LexicalEditor>
      </div>
    </div>
  );
};

export default DocumentPane;
