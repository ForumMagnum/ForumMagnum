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
import { useMutation } from '@apollo/client/react';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useNavigate } from '../../lib/routeUtil';
import Loading from '../vulcan-core/Loading';
import ForumIcon from '../common/ForumIcon';
import { PanelRightIcon } from './PanelRightIcon';
import { ResearchEmojiPicker } from './ResearchEmojiPicker';
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
  // The default (non-emoji) glyph tinted to hint unread activity.
  itemIconUnread: {
    color: theme.palette.primary.main,
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
  // The leading icon slot doubles as the emoji-picker trigger.
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
  // Set icons (`svg:` values) sit in the same 18px slot as emoji; slightly
  // larger than the 13px default glyph since strokes read lighter than fills.
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
  const [setDocumentIcon] = useMutation(SetResearchDocumentIconMutation);
  const [setConversationIcon] = useMutation(SetResearchConversationIconMutation);
  const [reorderDocuments] = useMutation(ReorderResearchDocumentsMutation);

  // Emoji picker anchor state: which row's icon is being edited, and where to
  // pop the picker.
  const [iconEditor, setIconEditor] = useState<
    { kind: 'document' | 'conversation'; id: string; anchor: { left: number; bottom: number } } | null
  >(null);

  // A pending drag-reorder of documents, applied on top of the fetched list so
  // the new order shows immediately (before the refetch lands). Cleared when
  // switching projects so a stale order never leaks across projects.
  const [documentOrderOverride, setDocumentOrderOverride] = useState<string[] | null>(null);
  useEffect(() => { setDocumentOrderOverride(null); }, [projectId]);

  const dndSensors = useSensors(
    // A small activation distance so a click still selects the doc; only a
    // deliberate drag starts a reorder.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const { data: environmentsData } = useQuery(ResearchEnvironmentsByProjectQuery, {
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
  });
  const snapshots = environmentsData?.researchEnvironments?.results ?? [];

  const project = data?.researchProject?.result;
  const documents = useMemo(() => {
    const list = [...(data?.researchDocuments?.results ?? [])];
    // Base order: explicit sortOrder first (ascending), then unordered docs by
    // creation time. A null sortOrder sorts after any numbered doc.
    list.sort((a, b) => {
      const ao = a.sortOrder ?? Infinity;
      const bo = b.sortOrder ?? Infinity;
      if (ao !== bo) return ao - bo;
      const at = a.createdAt ? new Date(a.createdAt).valueOf() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).valueOf() : 0;
      return at - bt;
    });
    if (!documentOrderOverride) return list;
    // Apply the pending drag order: known ids in override order, then any docs
    // not covered by the override (newly created since) appended in base order.
    const byId = new Map(list.map((d) => [d._id, d]));
    const ordered = documentOrderOverride.map((id) => byId.get(id)).filter((d): d is typeof list[number] => !!d);
    const coveredIds = new Set(documentOrderOverride);
    for (const d of list) if (!coveredIds.has(d._id)) ordered.push(d);
    return ordered;
  }, [data?.researchDocuments?.results, documentOrderOverride]);
  const documentIds = useMemo(() => documents.map((d) => d._id), [documents]);

  const handleDocumentDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = documentIds.indexOf(String(active.id));
    const newIndex = documentIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(documentIds, oldIndex, newIndex);
    setDocumentOrderOverride(newOrder);
    void reorderDocuments({ variables: { projectId, orderedIds: newOrder } });
  }, [documentIds, reorderDocuments, projectId]);

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
          <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDocumentDragEnd}>
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
                  onClick={() => onSelectConversation(conv._id)}
                  role="button"
                  tabIndex={0}
                >
                  {status?.turnActive ? (
                    // Active-turn state takes the slot (transient, important);
                    // the icon becomes editable again once the turn finishes.
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
      {iconEditor ? (
        <ResearchEmojiPicker
          anchor={iconEditor.anchor}
          onSelect={(emoji) => handleSetIcon(iconEditor.kind, iconEditor.id, emoji)}
          onClear={() => handleSetIcon(iconEditor.kind, iconEditor.id, null)}
          onClose={() => setIconEditor(null)}
        />
      ) : null}
    </div>
  );
};

// ForumIcon's `icon` prop is a large string-literal union; the default-icon
// names used here are valid members. Kept as a loose string to avoid importing
// the union type for two call sites.
type ForumIconName = React.ComponentProps<typeof ForumIcon>['icon'];

interface SidebarRowIconProps {
  classes: Record<string, string>;
  icon: string | null;
  defaultIcon: ForumIconName;
  unread?: boolean;
  label: string;
  onEdit: (anchor: { left: number; bottom: number }) => void;
}

/** The leading icon slot: a custom emoji if set, else a default glyph. Clicking
 * it opens the emoji picker (anchored under the button). */
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

interface SortableDocumentRowProps {
  classes: Record<string, string>;
  doc: { _id: string; title: string | null; icon: string | null };
  active: boolean;
  onSelect: () => void;
  onRename: (next: string | null) => Promise<unknown>;
  onEditIcon: (anchor: { left: number; bottom: number }) => void;
}

/** A draggable document row (dnd-kit sortable). A plain click still selects the
 * doc; a deliberate drag reorders (PointerSensor activation distance). */
const SortableDocumentRow = ({ classes, doc, active, onSelect, onRename, onEditIcon }: SortableDocumentRowProps) => {
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
