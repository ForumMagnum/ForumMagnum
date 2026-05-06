"use client";

import React, { useState } from 'react';
import classNames from 'classnames';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import Loading from '../vulcan-core/Loading';

interface ProjectSidebarProps {
  projectId: string;
  activeDocumentId: string | null;
  activeChatConversationId: string | null;
  onSelectDocument: (documentId: string) => void;
  onSelectConversation: (conversationId: string) => void;
  /**
   * Open the chat pane in "new chat" mode (null conversation), letting the
   * user type their first prompt directly into the ChatPane composer rather
   * than into a native window.prompt.
   */
  onStartNewChat: () => void;
}

const ProjectSidebarQuery = gql(`
  query ProjectSidebarQuery($projectId: String!) {
    researchProject(input: { selector: { _id: $projectId } }) {
      result {
        _id
        title
      }
    }
    researchDocuments(selector: { byProject: { projectId: $projectId } }, limit: 200) {
      results {
        _id
        title
        createdAt
      }
    }
    researchConversations(selector: { byProjectAndEntrypointKind: { projectId: $projectId, kind: "chat" } }, limit: 200) {
      results {
        _id
        title
        lastActivityAt
      }
    }
  }
`);

const CreateResearchDocumentMutation = gql(`
  mutation CreateResearchDocumentSidebar($projectId: String!, $title: String) {
    createResearchDocument(data: { projectId: $projectId, title: $title }) {
      data {
        _id
        title
        createdAt
      }
    }
  }
`);

const styles = defineStyles('ProjectSidebar', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: theme.palette.background.pageActiveAreaBackground ?? theme.palette.background.default,
  },
  header: {
    padding: '12px 16px',
    borderBottom: theme.palette.greyBorder('1px', 0.1),
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: theme.palette.text.primary,
    margin: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
  },
  section: {
    padding: '12px 0',
    borderBottom: theme.palette.greyBorder('1px', 0.05),
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px 4px',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.palette.text.dim,
    fontWeight: 600,
  },
  sectionAction: {
    border: 'none',
    background: 'transparent',
    color: theme.palette.text.dim,
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    padding: '0 4px',
    fontFamily: 'inherit',
    '&:hover': {
      color: theme.palette.text.primary,
    },
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: 13,
    color: theme.palette.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '&:hover': {
      background: theme.palette.greyAlpha(0.06),
    },
  },
  itemActive: {
    background: theme.palette.greyAlpha(0.1),
    fontWeight: 600,
  },
  empty: {
    padding: '6px 16px',
    fontSize: 12,
    color: theme.palette.text.dim,
    fontStyle: 'italic',
  },
}));

const ProjectSidebar = ({
  projectId,
  activeDocumentId,
  activeChatConversationId,
  onSelectDocument,
  onSelectConversation,
  onStartNewChat,
}: ProjectSidebarProps) => {
  const classes = useStyles(styles);
  const [creatingDoc, setCreatingDoc] = useState(false);

  const { data, loading, refetch } = useQuery(ProjectSidebarQuery, {
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const [createDocument] = useMutation(CreateResearchDocumentMutation);

  const project = data?.researchProject?.result;
  const documents = data?.researchDocuments?.results ?? [];
  const conversations = data?.researchConversations?.results ?? [];

  const handleNewDocument = async () => {
    if (creatingDoc) return;
    setCreatingDoc(true);
    try {
      const result = await createDocument({ variables: { projectId, title: null } });
      const created = result.data?.createResearchDocument?.data;
      if (created) {
        onSelectDocument(created._id);
      }
      await refetch();
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleNewChat = () => {
    onStartNewChat();
  };

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <h2 className={classes.projectTitle}>{project?.title ?? (loading ? 'Loading…' : 'Project')}</h2>
      </div>
      <div className={classes.body}>
        <div className={classes.section}>
          <div className={classes.sectionHeader}>
            <span>Documents</span>
            <button
              className={classes.sectionAction}
              onClick={handleNewDocument}
              disabled={creatingDoc}
              title="New document"
            >
              +
            </button>
          </div>
          {loading && documents.length === 0 ? <Loading /> : null}
          <ul className={classes.list}>
            {documents.map((doc) => (
              <li
                key={doc._id}
                className={classNames(classes.item, {
                  [classes.itemActive]: doc._id === activeDocumentId,
                })}
                onClick={() => onSelectDocument(doc._id)}
              >
                {doc.title ?? 'Untitled document'}
              </li>
            ))}
            {!loading && documents.length === 0 ? (
              <li className={classes.empty}>No documents yet</li>
            ) : null}
          </ul>
        </div>
        <div className={classes.section}>
          <div className={classes.sectionHeader}>
            <span>Chats</span>
            <button
              className={classes.sectionAction}
              onClick={handleNewChat}
              title="New chat"
            >
              +
            </button>
          </div>
          {loading && conversations.length === 0 ? <Loading /> : null}
          <ul className={classes.list}>
            {conversations.map((conv) => (
              <li
                key={conv._id}
                className={classNames(classes.item, {
                  [classes.itemActive]: conv._id === activeChatConversationId,
                })}
                onClick={() => onSelectConversation(conv._id)}
              >
                {conv.title ?? 'Untitled chat'}
              </li>
            ))}
            {!loading && conversations.length === 0 ? (
              <li className={classes.empty}>No chats yet</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProjectSidebar;
