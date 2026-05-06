"use client";

import React, { useCallback, useMemo } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { researchEditorNodes } from './lexical/researchEditorNodes';
import { ResearchEditorPlugins } from './lexical/ResearchEditorPlugins';
import {
  ResearchEditorProvider,
  type FireQueryResult,
  type FireDocumentQueryArgs,
  type ResearchEditorEnvironment,
} from './lexical/ResearchEditorContext';
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
    padding: '10px 28px 0',
    fontSize: 15,
    fontWeight: 600,
    color: theme.palette.text.primary,
    lineHeight: 1.4,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  editorWrap: {
    flex: 1,
    padding: '10px 28px 28px',
    overflow: 'auto',
    position: 'relative',
    '& [contenteditable="true"]': {
      minHeight: 'calc(100vh - 150px)',
      fontSize: 14,
      lineHeight: 1.55,
      fontFamily: theme.palette.fonts.sansSerifStack,
      maxWidth: 960,
      padding: '8px 0 32px',
    },
    '& [contenteditable="true"] p': {
      margin: '0 0 0.75em',
    },
    '& [contenteditable="true"] h1': {
      fontSize: 24,
      lineHeight: 1.25,
      margin: '1em 0 0.5em',
    },
    '& [contenteditable="true"] h2': {
      fontSize: 20,
      lineHeight: 1.3,
      margin: '1em 0 0.5em',
    },
    '& [contenteditable="true"] h3': {
      fontSize: 17,
      lineHeight: 1.35,
      margin: '1em 0 0.5em',
    },
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

  const researchEditorEnvironment = useMemo<ResearchEditorEnvironment | null>(() => {
    if (!documentId) return null;
    return {
      documentId,
      fireDocumentQuery,
    };
  }, [documentId, fireDocumentQuery]);

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

  if (!documentRecord || !researchEditorEnvironment) {
    return <div className={classes.empty}>Document not found.</div>;
  }

  return (
    <div className={classes.root}>
      <div className={classes.titleBar}>{documentRecord.title ?? 'Untitled document'}</div>
      <div className={classes.editorWrap}>
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
          >
            <ResearchEditorPlugins />
          </LexicalEditor>
        </ResearchEditorProvider>
      </div>
    </div>
  );
};

export default DocumentPane;
