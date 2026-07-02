"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useNavigate } from '../../lib/routeUtil';
import Loading from '../vulcan-core/Loading';
import ForumIcon from '../common/ForumIcon';
import { PanelRightIcon } from './PanelRightIcon';
import { ProjectSidebarQuery } from './projectSidebarQuery';
import { ResearchEnvironmentsByProjectQuery } from './researchEnvironmentsQuery';
import {
  researchInputBackground,
  researchCompactRow,
  researchCompactRowActive,
  researchEyebrow,
  researchScrollbars,
  researchWarmAlpha,
  researchCanvas,
  researchRadius,
} from './researchStyleUtils';

interface ProjectSidebarProps {
  projectId: string;
  activeDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
  /** Navigate to the conversation's host document and focus its block. */
  onSelectConversation: (conversationId: string) => void;
  /** Open the conversation in the right chat panel instead. */
  onOpenConversationChat: (conversationId: string) => void;
  /** Open the scratch document with a fresh /query input appended. */
  onStartNewConversation: () => void;
  onCollapse: () => void;
}

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

const RenameResearchDocumentMutation = gql(`
  mutation RenameResearchDocumentSidebar($id: String!, $title: String) {
    updateResearchDocument(selector: { _id: $id }, data: { title: $title }) {
      data {
        _id
        title
      }
    }
  }
`);

const RenameResearchConversationMutation = gql(`
  mutation RenameResearchConversationSidebar($id: String!, $title: String) {
    updateResearchConversation(selector: { _id: $id }, data: { title: $title }) {
      data {
        _id
        title
      }
    }
  }
`);

const RenameResearchEnvironmentMutation = gql(`
  mutation RenameResearchEnvironmentSidebar($id: String!, $label: String!) {
    updateResearchEnvironment(selector: { _id: $id }, data: { label: $label }) {
      data {
        _id
        label
      }
    }
  }
`);

const SidebarStatusesQuery = gql(`
  query ResearchConversationSidebarStatuses($projectId: String!) {
    researchConversationSidebarStatuses(projectId: $projectId) {
      conversationId
      turnActive
      lastActivityAt
      lastReadAt
    }
  }
`);

const STATUS_POLL_MS = 10_000;

interface SidebarConversationStatus {
  turnActive: boolean;
  unread: boolean;
}

function deriveConversationStatus(status: {
  turnActive: boolean;
  lastActivityAt: Date | string | null;
  lastReadAt: Date | string | null;
}): SidebarConversationStatus {
  // Null lastReadAt = never stamped (pre-feature conversations) — treat as
  // read so the whole sidebar doesn't light up on ship.
  const unread = !status.turnActive
    && !!status.lastReadAt
    && !!status.lastActivityAt
    && new Date(status.lastActivityAt).valueOf() > new Date(status.lastReadAt).valueOf();
  return { turnActive: status.turnActive, unread };
}

const styles = defineStyles('ProjectSidebar', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    // Background comes from the workspace shell's whisper-recessed sidebar
    // column; the sidebar itself stays transparent.
  },
  header: {
    flex: 'none',
    padding: '8px 8px 8px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    boxSizing: 'border-box',
  },
  // The work's name gets the essay serif — the one brand moment in the
  // workspace chrome (everything else stays in the UI sans).
  projectTitle: {
    fontSize: 15,
    fontWeight: 600,
    fontFamily: theme.palette.fonts.serifStack,
    color: theme.palette.text.primary,
    margin: 0,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 6px 24px',
    ...researchScrollbars(theme),
  },
  section: {
    paddingTop: 14,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 8px 3px',
    ...researchEyebrow(theme),
  },
  iconButton: {
    border: 'none',
    borderRadius: researchRadius.xs,
    background: 'transparent',
    color: theme.palette.text.dim,
    cursor: 'pointer',
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    flex: 'none',
    '&:hover': {
      background: researchWarmAlpha(0.06),
      color: theme.palette.text.primary,
    },
  },
  icon: {
    '--icon-size': '14px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  item: {
    ...researchCompactRow(theme),
    // display, not visibility: hidden hover buttons must not reserve layout
    // width — on a narrow sidebar the two of them cost ~50px of label space
    // and titles truncated absurdly early.
    '&:hover $itemEditButton': {
      display: 'flex',
    },
  },
  itemActive: researchCompactRowActive(theme),
  // Snapshot rows aren't navigable (yet) — no pointer, no hover fill; the
  // rename affordance is the only interaction.
  itemStatic: {
    cursor: 'default',
    '&:hover': {
      background: 'transparent',
    },
  },
  itemIcon: {
    '--icon-size': '13px',
    flex: 'none',
    color: theme.palette.text.dim,
  },
  // Both dots occupy the 13px icon slot so rows don't shift as state changes.
  statusDot: {
    flex: 'none',
    width: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:before': {
      content: '""',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: theme.palette.primary.main,
    },
  },
  statusDotActive: {
    animation: '$sidebarTurnPulse 1.4s ease-in-out infinite',
  },
  '@keyframes sidebarTurnPulse': {
    '0%, 100%': { opacity: 0.25, transform: 'scale(0.85)' },
    '50%': { opacity: 1, transform: 'scale(1)' },
  },
  itemUnread: {
    '& $itemLabel': {
      fontWeight: 600,
      color: theme.palette.text.primary,
    },
  },
  itemLabel: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemLabelUntitled: {
    color: theme.palette.text.dim,
  },
  itemEditInput: {
    flex: 1,
    minWidth: 0,
    padding: '1px 4px',
    margin: '-1px -4px',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    color: theme.palette.text.primary,
    background: researchInputBackground(theme),
    border: `1px solid ${researchWarmAlpha(0.2)}`,
    borderRadius: researchRadius.xs,
    outline: 'none',
    '&:focus': {
      border: `1px solid ${theme.palette.primary.main}`,
    },
  },
  itemEditButton: {
    flex: 'none',
    width: 18,
    height: 18,
    border: 'none',
    background: 'transparent',
    color: theme.palette.text.dim,
    cursor: 'pointer',
    padding: 0,
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: researchRadius.xs,
    '&:hover': {
      color: theme.palette.text.primary,
      background: researchWarmAlpha(0.08),
    },
  },
  editIcon: {
    '--icon-size': '12px',
  },
  // PanelRightIcon is a raw SVG sized in em, so drive it with font-size.
  panelIcon: {
    fontSize: 13,
    display: 'block',
  },
  empty: {
    padding: '4px 8px',
    fontSize: 12,
    color: theme.palette.text.dim,
    fontStyle: 'italic',
  },
}));

/**
 * Workspace sidebar: project header with an escape hatch back to the project
 * list, then IDE-compact Documents and Conversations sections. Conversations
 * are a flat recency-sorted list — clicking one jumps to its inline block in
 * its host document.
 */
const ProjectSidebar = ({
  projectId,
  activeDocumentId,
  onSelectDocument,
  onSelectConversation,
  onOpenConversationChat,
  onStartNewConversation,
  onCollapse,
}: ProjectSidebarProps) => {
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const [creatingDoc, setCreatingDoc] = useState(false);

  const { data, loading, refetch } = useQuery(ProjectSidebarQuery, {
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Lightweight polled status feed for the activity/unread indicators.
  const { data: statusData } = useQuery(SidebarStatusesQuery, {
    variables: { projectId },
    pollInterval: STATUS_POLL_MS,
  });
  const statusByConversation = useMemo(() => {
    const map = new Map<string, SidebarConversationStatus>();
    for (const status of statusData?.researchConversationSidebarStatuses ?? []) {
      map.set(status.conversationId, deriveConversationStatus(status));
    }
    return map;
  }, [statusData]);

  const [createDocument] = useMutation(CreateResearchDocumentMutation);
  const [renameDocument] = useMutation(RenameResearchDocumentMutation);
  const [renameConversation] = useMutation(RenameResearchConversationMutation);
  const [renameEnvironment] = useMutation(RenameResearchEnvironmentMutation);

  const { data: environmentsData } = useQuery(ResearchEnvironmentsByProjectQuery, {
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
  });
  const snapshots = environmentsData?.researchEnvironments?.results ?? [];

  const project = data?.researchProject?.result;
  const documents = data?.researchDocuments?.results ?? [];
  const conversations = useMemo(() => {
    const list = [...(data?.researchConversations?.results ?? [])];
    list.sort((a, b) => {
      const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).valueOf() : 0;
      const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).valueOf() : 0;
      return bTime - aTime;
    });
    return list;
  }, [data?.researchConversations?.results]);

  const handleRenameDocument = async (id: string, title: string | null) => {
    await renameDocument({ variables: { id, title } });
  };
  const handleRenameConversation = async (id: string, title: string | null) => {
    await renameConversation({ variables: { id, title } });
  };
  const handleRenameSnapshot = async (id: string, label: string | null) => {
    // Labels are required — an emptied input just cancels the rename.
    if (!label) return;
    await renameEnvironment({ variables: { id, label } });
  };

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

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <button
          type="button"
          className={classes.iconButton}
          onClick={() => navigate('/research')}
          title="All projects"
          aria-label="All projects"
        >
          <ForumIcon icon="ChevronLeft" className={classes.icon} />
        </button>
        <h2 className={classes.projectTitle}>{project?.title ?? (loading ? 'Loading…' : 'Project')}</h2>
        <button
          type="button"
          className={classes.iconButton}
          onClick={onCollapse}
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <ForumIcon icon="ChevronDoubleLeft" className={classes.icon} />
        </button>
      </div>
      <div className={classes.body}>
        <div className={classes.section}>
          <div className={classes.sectionHeader}>
            <span>Documents</span>
            <button
              className={classes.iconButton}
              onClick={handleNewDocument}
              disabled={creatingDoc}
              title="New document"
              aria-label="New document"
            >
              <ForumIcon icon="PlusSmall" className={classes.icon} />
            </button>
          </div>
          {loading && documents.length === 0 ? <Loading /> : null}
          <ul className={classes.list}>
            {documents.map((doc) => (
              <li key={doc._id}>
                <div
                  className={classNames(classes.item, {
                    [classes.itemActive]: doc._id === activeDocumentId,
                  })}
                  onClick={() => onSelectDocument(doc._id)}
                  role="button"
                  tabIndex={0}
                >
                  <ForumIcon icon="Document" className={classes.itemIcon} />
                  <EditableTitle
                    classes={classes}
                    title={doc.title}
                    placeholder="Untitled document"
                    onRename={(next) => handleRenameDocument(doc._id, next)}
                  />
                </div>
              </li>
            ))}
            {!loading && documents.length === 0 ? (
              <li className={classes.empty}>No documents yet</li>
            ) : null}
          </ul>
        </div>
        <div className={classes.section}>
          <div className={classes.sectionHeader}>
            <span>Conversations</span>
            <button
              className={classes.iconButton}
              onClick={onStartNewConversation}
              title="New conversation"
              aria-label="New conversation"
            >
              <ForumIcon icon="PlusSmall" className={classes.icon} />
            </button>
          </div>
          {loading && conversations.length === 0 ? <Loading /> : null}
          {!loading && conversations.length === 0 ? (
            <div className={classes.empty}>No conversations yet</div>
          ) : null}
          <ul className={classes.list}>
            {conversations.map((conv) => {
              const status = statusByConversation.get(conv._id);
              return (
              <li key={conv._id}>
                <div
                  className={classNames(classes.item, status?.unread && classes.itemUnread)}
                  onClick={() => onSelectConversation(conv._id)}
                  role="button"
                  tabIndex={0}
                >
                  {status?.turnActive ? (
                    <span
                      className={classNames(classes.statusDot, classes.statusDotActive)}
                      title="Agent is working"
                      aria-label="Agent is working"
                    />
                  ) : status?.unread ? (
                    <span
                      className={classes.statusDot}
                      title="Finished since you last looked"
                      aria-label="Unread activity"
                    />
                  ) : (
                    <ForumIcon icon="ChatBubbleLeftRight" className={classes.itemIcon} />
                  )}
                  <EditableTitle
                    classes={classes}
                    title={conv.title ?? null}
                    placeholder="Untitled conversation"
                    onRename={(next) => handleRenameConversation(conv._id, next)}
                  />
                  <button
                    type="button"
                    className={classes.itemEditButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenConversationChat(conv._id);
                    }}
                    title="Open in side panel"
                    aria-label="Open in side panel"
                  >
                    <PanelRightIcon className={classes.panelIcon} />
                  </button>
                </div>
              </li>
              );
            })}
          </ul>
        </div>
        {snapshots.length > 0 ? (
          <div className={classes.section}>
            <div className={classes.sectionHeader}>
              <span>Snapshots</span>
            </div>
            <ul className={classes.list}>
              {snapshots.map((snapshot) => (
                <li key={snapshot._id}>
                  <div className={classNames(classes.item, classes.itemStatic)}>
                    <ForumIcon icon="Tag" className={classes.itemIcon} />
                    <EditableTitle
                      classes={classes}
                      title={snapshot.label}
                      placeholder="Untitled snapshot"
                      onRename={(next) => handleRenameSnapshot(snapshot._id, next)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
};

interface EditableTitleProps {
  classes: Record<string, string>;
  title: string | null | undefined;
  placeholder: string;
  onRename: (next: string | null) => Promise<unknown>;
}

const EditableTitle = ({ classes, title, placeholder, onRename }: EditableTitleProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEditing = (event: React.MouseEvent) => {
    event.stopPropagation();
    setDraft(title ?? '');
    setEditing(true);
  };

  const commit = async () => {
    if (saving) return;
    const trimmed = draft.trim();
    const next = trimmed.length === 0 ? null : trimmed;
    if (next === (title ?? null)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onRename(next);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={classes.itemEditInput}
        value={draft}
        placeholder={placeholder}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        onBlur={() => void commit()}
      />
    );
  }

  return (
    <>
      <span className={classNames(classes.itemLabel, !title && classes.itemLabelUntitled)}>
        {title ?? placeholder}
      </span>
      <button
        type="button"
        className={classes.itemEditButton}
        onClick={startEditing}
        title="Rename"
        aria-label="Rename"
      >
        <ForumIcon icon="Pencil" className={classes.editIcon} />
      </button>
    </>
  );
};

export default ProjectSidebar;
