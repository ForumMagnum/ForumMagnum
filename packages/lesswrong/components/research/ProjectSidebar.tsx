"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMessages } from '@/components/common/withMessages';
import { useMutation } from '@apollo/client/react';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useNavigate } from '../../lib/routeUtil';
import Loading from '../vulcan-core/Loading';
import ForumIcon from '../common/ForumIcon';
import { PanelRightIcon } from './PanelRightIcon';
import { ResearchIconPicker } from './ResearchIconPicker';
import { ResearchItemIcon } from './researchIconSet';
import { ProjectSidebarQuery } from './projectSidebarQuery';
import { ResearchEnvironmentsByProjectQuery } from './researchEnvironmentsQuery';
import {
  researchInputBackground,
  researchCompactRow,
  researchCompactRowActive,
  researchEyebrow,
  researchScrollbars,
  researchWarmAlpha,
  researchRadius,
  researchTransition,
} from './researchStyleUtils';

interface ProjectSidebarProps {
  projectId: string;
  activeDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
  onSelectConversation: (conversationId: string) => void;
  /** Cmd/Ctrl+click: insert a full conversation block (transcript + composer)
   * bound to the conversation at the current editor cursor, without navigating. */
  onInsertConversationBlock: (conversationId: string) => void;
  onOpenConversationChat: (conversationId: string) => void;
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

const SetResearchDocumentIconMutation = gql(`
  mutation SetResearchDocumentIcon($id: String!, $icon: String) {
    updateResearchDocument(selector: { _id: $id }, data: { icon: $icon }) {
      data {
        _id
        icon
      }
    }
  }
`);

const SetResearchConversationIconMutation = gql(`
  mutation SetResearchConversationIcon($id: String!, $icon: String) {
    updateResearchConversation(selector: { _id: $id }, data: { icon: $icon }) {
      data {
        _id
        icon
      }
    }
  }
`);

const ReorderResearchDocumentsMutation = gql(`
  mutation ReorderResearchDocuments($projectId: String!, $orderedIds: [String!]!) {
    reorderResearchDocuments(projectId: $projectId, orderedIds: $orderedIds) {
      success
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

const ArchiveResearchDocumentMutation = gql(`
  mutation ArchiveResearchDocument($id: String!, $archived: Boolean!) {
    updateResearchDocument(selector: { _id: $id }, data: { archived: $archived }) {
      data {
        _id
        archived
      }
    }
  }
`);

const ArchiveResearchConversationMutation = gql(`
  mutation ArchiveResearchConversation($id: String!, $archived: Boolean!) {
    updateResearchConversation(selector: { _id: $id }, data: { archived: $archived }) {
      data {
        _id
        archived
      }
    }
  }
`);

const ArchiveResearchEnvironmentMutation = gql(`
  mutation ArchiveResearchEnvironment($id: String!, $archived: Boolean!) {
    updateResearchEnvironment(selector: { _id: $id }, data: { archived: $archived }) {
      data {
        _id
        archived
      }
    }
  }
`);

const SidebarStatusesQuery = gql(`
  query ResearchConversationSidebarStatuses($projectId: String!) {
    researchConversationSidebarStatuses(projectId: $projectId) {
      conversationId
      turnActive
      awaitingInput
      lastActivityAt
      lastReadAt
    }
  }
`);

const STATUS_POLL_MS = 10_000;

interface SidebarConversationStatus {
  turnActive: boolean;
  awaitingInput: boolean;
  unread: boolean;
}

function deriveConversationStatus(status: {
  turnActive: boolean;
  awaitingInput: boolean;
  lastActivityAt: Date | string | null;
  lastReadAt: Date | string | null;
}): SidebarConversationStatus {
  // Null lastReadAt = never stamped (pre-feature conversations) — treat as
  // read so the whole sidebar doesn't light up on ship.
  const unread = !status.turnActive
    && !!status.lastReadAt
    && !!status.lastActivityAt
    && new Date(status.lastActivityAt).valueOf() > new Date(status.lastReadAt).valueOf();
  return { turnActive: status.turnActive, awaitingInput: status.awaitingInput, unread };
}

const styles = defineStyles('ProjectSidebar', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
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
    '&:hover $itemEditButton': {
      display: 'flex',
    },
  },
  itemActive: researchCompactRowActive(theme),
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
  itemIconUnread: {
    color: theme.palette.primary.main,
  },
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
  // "Waiting for your input" (a pending AskUserQuestion): the highest-priority
  // state — an amber dot, larger and pulsing more insistently (and less faded)
  // than the sage "working" pulse, so it reads as "needs you", not "busy".
  statusDotAwaiting: {
    animation: '$sidebarAwaitingPulse 1.15s ease-in-out infinite',
    '&:before': {
      width: 10,
      height: 10,
      background: 'light-dark(#d9820c, #f4a836)',
    },
  },
  '@keyframes sidebarAwaitingPulse': {
    '0%, 100%': { opacity: 0.6, transform: 'scale(0.92)' },
    '50%': { opacity: 1, transform: 'scale(1.12)' },
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
  panelIcon: {
    fontSize: 13,
    display: 'block',
  },
  rowIconButton: {
    flex: 'none',
    width: 18,
    height: 18,
    padding: 0,
    border: 'none',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: researchRadius.xs,
    cursor: 'pointer',
    '&:hover': {
      background: researchWarmAlpha(0.1),
    },
  },
  iconEmoji: {
    fontSize: 14,
    lineHeight: 1,
  },
  iconSvg: {
    fontSize: 15,
    display: 'block',
    color: theme.palette.text.dim,
  },
  dragging: {
    opacity: 0.5,
  },
  empty: {
    padding: '4px 8px',
    fontSize: 12,
    color: theme.palette.text.dim,
    fontStyle: 'italic',
  },
  // The hand-drawn archive glyph, sized to sit in the hover-button slot next
  // to rename/panel. (Restore uses the ForumIcon Undo glyph via editIcon.)
  archiveIcon: {
    fontSize: 13,
    display: 'block',
  },
  // Leading icon slot for the (non-interactive) archived rows — matches the
  // 18px footprint of the live rows' emoji-picker trigger, minus the button
  // affordances.
  rowIconStatic: {
    flex: 'none',
    width: 18,
    height: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.text.dim,
  },
  // Bottom-pinned "Archived" drawer: flex-none so it sits below the scrolling
  // body, kept recessive with a low opacity that lifts on hover / when open.
  archivedSection: {
    flex: 'none',
    borderTop: `1px solid ${researchWarmAlpha(0.08)}`,
    opacity: 0.5,
    transition: `opacity ${researchTransition}`,
    '&:hover': {
      opacity: 0.85,
    },
  },
  archivedSectionOpen: {
    opacity: 0.85,
  },
  archivedToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: '8px 10px',
    ...researchEyebrow(theme),
    '&:hover': {
      color: theme.palette.text.primary,
    },
  },
  archivedChevron: {
    '--icon-size': '12px',
    flex: 'none',
    transition: `transform ${researchTransition}`,
  },
  archivedChevronOpen: {
    transform: 'rotate(90deg)',
  },
  archivedCount: {
    marginLeft: 'auto',
    fontVariantNumeric: 'tabular-nums',
  },
  archivedBody: {
    maxHeight: 260,
    overflowY: 'auto',
    padding: '0 6px 8px',
    ...researchScrollbars(theme),
  },
  archivedGroup: {
    paddingTop: 6,
  },
  archivedGroupLabel: {
    padding: '0 8px 2px',
    ...researchEyebrow(theme),
  },
}));

const ProjectSidebar = ({
  projectId,
  activeDocumentId,
  onSelectDocument,
  onSelectConversation,
  onInsertConversationBlock,
  onOpenConversationChat,
  onStartNewConversation,
  onCollapse,
}: ProjectSidebarProps) => {
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const { flash } = useMessages();
  const [creatingDoc, setCreatingDoc] = useState(false);

  // Plain click navigates (instant); Cmd/Ctrl+click drops a live copy of the
  // conversation block into the current document at the cursor, without jumping.
  const handleConversationClick = useCallback((e: React.MouseEvent, conversationId: string) => {
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      onInsertConversationBlock(conversationId);
    } else {
      onSelectConversation(conversationId);
    }
  }, [onSelectConversation, onInsertConversationBlock]);

  const { data, loading, refetch } = useQuery(ProjectSidebarQuery, {
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

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
  const [setDocumentIcon] = useMutation(SetResearchDocumentIconMutation);
  const [setConversationIcon] = useMutation(SetResearchConversationIconMutation);
  const [reorderDocuments] = useMutation(ReorderResearchDocumentsMutation);
  const [archiveDocument] = useMutation(ArchiveResearchDocumentMutation);
  const [archiveConversation] = useMutation(ArchiveResearchConversationMutation);
  const [archiveEnvironment] = useMutation(ArchiveResearchEnvironmentMutation);

  // Whether the bottom "Archived" drawer is expanded.
  const [archivedOpen, setArchivedOpen] = useState(false);

  const [iconEditor, setIconEditor] = useState<
    { kind: 'document' | 'conversation'; id: string; anchor: { left: number; bottom: number } } | null
  >(null);

  const [documentOrderOverride, setDocumentOrderOverride] = useState<string[] | null>(null);
  useEffect(() => { setDocumentOrderOverride(null); }, [projectId]);
  const latestReorderRef = useRef<string[] | null>(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const { data: environmentsData, refetch: refetchEnvironments } = useQuery(ResearchEnvironmentsByProjectQuery, {
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
  });
  const snapshots = environmentsData?.researchEnvironments?.results ?? [];
  const archivedSnapshots = environmentsData?.archivedEnvironments?.results ?? [];

  const project = data?.researchProject?.result;
  const documents = useMemo(() => {
    const list = [...(data?.researchDocuments?.results ?? [])];
    list.sort((a, b) => {
      const ao = a.sortOrder ?? Infinity;
      const bo = b.sortOrder ?? Infinity;
      if (ao !== bo) return ao - bo;
      const at = a.createdAt ? new Date(a.createdAt).valueOf() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).valueOf() : 0;
      return at - bt;
    });
    if (!documentOrderOverride) return list;
    const byId = new Map(list.map((d) => [d._id, d]));
    const ordered = documentOrderOverride.map((id) => byId.get(id)).filter((d): d is typeof list[number] => !!d);
    const coveredIds = new Set(documentOrderOverride);
    for (const d of list) if (!coveredIds.has(d._id)) ordered.push(d);
    return ordered;
  }, [data?.researchDocuments?.results, documentOrderOverride]);
  const documentIds = useMemo(() => documents.map((d) => d._id), [documents]);

  const handleDocumentDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = documentIds.indexOf(String(active.id));
    const newIndex = documentIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(documentIds, oldIndex, newIndex);
    setDocumentOrderOverride(newOrder);
    latestReorderRef.current = newOrder;
    try {
      await reorderDocuments({ variables: { projectId, orderedIds: newOrder } });
      // Pull the persisted sortOrders into the cache before dropping the
      // override, so the list doesn't flash back to the stale order.
      await refetch();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[research] document reorder failed', err);
      flash({ messageString: 'Failed to save the new document order.', type: 'error' });
    } finally {
      // A newer drag may have started while this one persisted — only the
      // latest drag clears (or reverts) the override.
      if (latestReorderRef.current === newOrder) {
        setDocumentOrderOverride(null);
        latestReorderRef.current = null;
      }
    }
  }, [documentIds, reorderDocuments, projectId, refetch, flash]);

  const handleSetIcon = useCallback(async (kind: 'document' | 'conversation', id: string, icon: string | null) => {
    setIconEditor(null);
    if (kind === 'document') await setDocumentIcon({ variables: { id, icon } });
    else await setConversationIcon({ variables: { id, icon } });
  }, [setDocumentIcon, setConversationIcon]);

  const conversations = useMemo(() => {
    const list = [...(data?.researchConversations?.results ?? [])];
    list.sort((a, b) => {
      const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).valueOf() : 0;
      const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).valueOf() : 0;
      return bTime - aTime;
    });
    return list;
  }, [data?.researchConversations?.results]);

  // Archived items feed the bottom drawer. Most-recently-touched first, so a
  // just-archived item lands at the top of its group.
  const archivedDocuments = useMemo(() => {
    const list = [...(data?.archivedDocuments?.results ?? [])];
    list.sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).valueOf() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).valueOf() : 0;
      return bt - at;
    });
    return list;
  }, [data?.archivedDocuments?.results]);
  const archivedConversations = useMemo(() => {
    const list = [...(data?.archivedConversations?.results ?? [])];
    list.sort((a, b) => {
      const at = a.lastActivityAt ? new Date(a.lastActivityAt).valueOf() : 0;
      const bt = b.lastActivityAt ? new Date(b.lastActivityAt).valueOf() : 0;
      return bt - at;
    });
    return list;
  }, [data?.archivedConversations?.results]);
  const archivedCount = archivedDocuments.length + archivedConversations.length + archivedSnapshots.length;

  const handleRenameDocument = async (id: string, title: string | null) => {
    await renameDocument({ variables: { id, title } });
  };
  const handleRenameConversation = async (id: string, title: string | null) => {
    await renameConversation({ variables: { id, title } });
  };
  const handleRenameSnapshot = async (id: string, label: string | null) => {
    if (!label) return;
    await renameEnvironment({ variables: { id, label } });
  };

  // Archive/restore just flips the `archived` flag; the item then moves
  // between the main lists and the bottom drawer on the next refetch (both
  // active and archived lists come from the same query).
  const handleArchiveDocument = async (id: string, archived: boolean) => {
    await archiveDocument({ variables: { id, archived } });
    await refetch();
  };
  const handleArchiveConversation = async (id: string, archived: boolean) => {
    await archiveConversation({ variables: { id, archived } });
    await refetch();
  };
  const handleArchiveSnapshot = async (id: string, archived: boolean) => {
    await archiveEnvironment({ variables: { id, archived } });
    await refetchEnvironments();
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
          {/* Stable id: dnd-kit's auto-incremented one differs between SSR and
              client, tripping a hydration-mismatch warning on aria-describedby. */}
          <DndContext id="project-documents-dnd" sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDocumentDragEnd}>
            <SortableContext items={documentIds} strategy={verticalListSortingStrategy}>
              <ul className={classes.list}>
                {documents.map((doc) => (
                  <SortableDocumentRow
                    key={doc._id}
                    classes={classes}
                    doc={doc}
                    active={doc._id === activeDocumentId}
                    onSelect={() => onSelectDocument(doc._id)}
                    onRename={(next) => handleRenameDocument(doc._id, next)}
                    onEditIcon={(anchor) => setIconEditor({ kind: 'document', id: doc._id, anchor })}
                    onArchive={() => handleArchiveDocument(doc._id, true)}
                  />
                ))}
                {!loading && documents.length === 0 ? (
                  <li className={classes.empty}>No documents yet</li>
                ) : null}
              </ul>
            </SortableContext>
          </DndContext>
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
                  onClick={(e) => handleConversationClick(e, conv._id)}
                  role="button"
                  tabIndex={0}
                >
                  {status?.awaitingInput ? (
                    <span
                      className={classNames(classes.statusDot, classes.statusDotAwaiting)}
                      title="Waiting for your input"
                      aria-label="Waiting for your input"
                    />
                  ) : status?.turnActive ? (
                    <span
                      className={classNames(classes.statusDot, classes.statusDotActive)}
                      title="Agent is working"
                      aria-label="Agent is working"
                    />
                  ) : (
                    <SidebarRowIcon
                      classes={classes}
                      icon={conv.icon ?? null}
                      defaultIcon="ChatBubbleLeftRight"
                      unread={!!status?.unread}
                      label="Set conversation icon"
                      onEdit={(anchor) => setIconEditor({ kind: 'conversation', id: conv._id, anchor })}
                    />
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
                  <RowArchiveButton
                    classes={classes}
                    archived={false}
                    onToggle={() => handleArchiveConversation(conv._id, true)}
                  />
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
                    <RowArchiveButton
                      classes={classes}
                      archived={false}
                      onToggle={() => handleArchiveSnapshot(snapshot._id, true)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      {archivedCount > 0 ? (
        <div className={classNames(classes.archivedSection, archivedOpen && classes.archivedSectionOpen)}>
          <button
            type="button"
            className={classes.archivedToggle}
            onClick={() => setArchivedOpen((v) => !v)}
            aria-expanded={archivedOpen}
          >
            <ForumIcon
              icon="ChevronRight"
              className={classNames(classes.archivedChevron, archivedOpen && classes.archivedChevronOpen)}
            />
            <span>Archived</span>
            <span className={classes.archivedCount}>{archivedCount}</span>
          </button>
          {archivedOpen ? (
            <div className={classes.archivedBody}>
              {archivedDocuments.length > 0 ? (
                <div className={classes.archivedGroup}>
                  <div className={classes.archivedGroupLabel}>Documents</div>
                  <ul className={classes.list}>
                    {archivedDocuments.map((doc) => (
                      <ArchivedRow
                        key={doc._id}
                        classes={classes}
                        icon={doc.icon ?? null}
                        defaultIcon="Document"
                        title={doc.title ?? null}
                        placeholder="Untitled document"
                        onRestore={() => handleArchiveDocument(doc._id, false)}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}
              {archivedConversations.length > 0 ? (
                <div className={classes.archivedGroup}>
                  <div className={classes.archivedGroupLabel}>Conversations</div>
                  <ul className={classes.list}>
                    {archivedConversations.map((conv) => (
                      <ArchivedRow
                        key={conv._id}
                        classes={classes}
                        icon={conv.icon ?? null}
                        defaultIcon="ChatBubbleLeftRight"
                        title={conv.title ?? null}
                        placeholder="Untitled conversation"
                        onRestore={() => handleArchiveConversation(conv._id, false)}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}
              {archivedSnapshots.length > 0 ? (
                <div className={classes.archivedGroup}>
                  <div className={classes.archivedGroupLabel}>Snapshots</div>
                  <ul className={classes.list}>
                    {archivedSnapshots.map((snapshot) => (
                      <ArchivedRow
                        key={snapshot._id}
                        classes={classes}
                        icon={null}
                        defaultIcon="Tag"
                        title={snapshot.label}
                        placeholder="Untitled snapshot"
                        onRestore={() => handleArchiveSnapshot(snapshot._id, false)}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {iconEditor ? (
        <ResearchIconPicker
          anchor={iconEditor.anchor}
          onSelect={(icon) => handleSetIcon(iconEditor.kind, iconEditor.id, icon)}
          onClear={() => handleSetIcon(iconEditor.kind, iconEditor.id, null)}
          onClose={() => setIconEditor(null)}
        />
      ) : null}
    </div>
  );
};

type ForumIconName = React.ComponentProps<typeof ForumIcon>['icon'];

interface SidebarRowIconProps {
  classes: Record<string, string>;
  icon: string | null;
  defaultIcon: ForumIconName;
  unread?: boolean;
  label: string;
  onEdit: (anchor: { left: number; bottom: number }) => void;
}

const SidebarRowIcon = ({ classes, icon, defaultIcon, unread, label, onEdit }: SidebarRowIconProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    onEdit({ left: r.left, bottom: r.bottom });
  };
  return (
    <button
      type="button"
      className={classes.rowIconButton}
      onClick={handleClick}
      title={label}
      aria-label={label}
    >
      {icon
        ? <ResearchItemIcon icon={icon} emojiClassName={classes.iconEmoji} svgClassName={classes.iconSvg} />
        : <ForumIcon icon={defaultIcon} className={unread ? classNames(classes.itemIcon, classes.itemIconUnread) : classes.itemIcon} />}
    </button>
  );
};

interface RowArchiveButtonProps {
  classes: Record<string, string>;
  archived: boolean;
  onToggle: () => void;
}

/** The trailing hover action that archives a live row (archive glyph) or
 * restores an archived one (undo glyph). Stops propagation so it never
 * triggers the row's own select/navigate. */
const RowArchiveButton = ({ classes, archived, onToggle }: RowArchiveButtonProps) => (
  <button
    type="button"
    className={classes.itemEditButton}
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    title={archived ? 'Restore' : 'Archive'}
    aria-label={archived ? 'Restore' : 'Archive'}
  >
    {archived
      ? <ForumIcon icon="Undo" className={classes.editIcon} />
      : <ResearchItemIcon icon="svg:archive" emojiClassName={classes.archiveIcon} svgClassName={classes.archiveIcon} />}
  </button>
);

interface ArchivedRowProps {
  classes: Record<string, string>;
  icon: string | null;
  defaultIcon: ForumIconName;
  title: string | null;
  placeholder: string;
  onRestore: () => void;
}

/** A read-only archived-item row: leading glyph, dimmed title, and a restore
 * button on hover. Not navigable — the drawer is for review + restore. */
const ArchivedRow = ({ classes, icon, defaultIcon, title, placeholder, onRestore }: ArchivedRowProps) => (
  <li>
    <div className={classNames(classes.item, classes.itemStatic)}>
      {icon ? (
        <span className={classes.rowIconStatic}>
          <ResearchItemIcon icon={icon} emojiClassName={classes.iconEmoji} svgClassName={classes.iconSvg} />
        </span>
      ) : (
        <span className={classes.rowIconStatic}>
          <ForumIcon icon={defaultIcon} className={classes.itemIcon} />
        </span>
      )}
      <span className={classNames(classes.itemLabel, !title && classes.itemLabelUntitled)}>
        {title ?? placeholder}
      </span>
      <RowArchiveButton classes={classes} archived onToggle={onRestore} />
    </div>
  </li>
);

interface SortableDocumentRowProps {
  classes: Record<string, string>;
  doc: { _id: string; title: string | null; icon: string | null };
  active: boolean;
  onSelect: () => void;
  onRename: (next: string | null) => Promise<unknown>;
  onEditIcon: (anchor: { left: number; bottom: number }) => void;
  onArchive: () => void;
}

const SortableDocumentRow = ({ classes, doc, active, onSelect, onRename, onEditIcon, onArchive }: SortableDocumentRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: doc._id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div
        className={classNames(classes.item, {
          [classes.itemActive]: active,
          [classes.dragging]: isDragging,
        })}
        onClick={onSelect}
        role="button"
        tabIndex={0}
      >
        <SidebarRowIcon
          classes={classes}
          icon={doc.icon}
          defaultIcon="Document"
          label="Set document icon"
          onEdit={onEditIcon}
        />
        <EditableTitle
          classes={classes}
          title={doc.title}
          placeholder="Untitled document"
          onRename={onRename}
        />
        <RowArchiveButton classes={classes} archived={false} onToggle={onArchive} />
      </div>
    </li>
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
