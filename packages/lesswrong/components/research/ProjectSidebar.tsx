"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import Loading from '../vulcan-core/Loading';
import ForumIcon, { type ForumIconName } from '../common/ForumIcon';
import type { EntrypointKind } from '../../lib/collections/researchConversations/entrypoint';

interface ProjectSidebarProps {
  projectId: string;
  activeDocumentId: string | null;
  activeChatConversationId: string | null;
  onSelectDocument: (documentId: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onCollapse: () => void;
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
    researchConversations(selector: { byProject: { projectId: $projectId } }, limit: 200) {
      results {
        _id
        title
        lastActivityAt
        entrypoint
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
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: 600,
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
    borderRadius: 4,
    background: 'transparent',
    color: theme.palette.text.dim,
    cursor: 'pointer',
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    '&:hover': {
      background: theme.palette.greyAlpha(0.06),
      color: theme.palette.text.primary,
    },
  },
  collapseButton: {
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    color: theme.palette.text.dim,
    cursor: 'pointer',
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    '&:hover': {
      background: theme.palette.greyAlpha(0.06),
      color: theme.palette.text.primary,
    },
  },
  icon: {
    '--icon-size': '15px',
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
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    '&:hover': {
      background: theme.palette.greyAlpha(0.06),
    },
    '&:hover $itemEditButton': {
      visibility: 'visible',
    },
  },
  itemLabel: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemEditInput: {
    flex: 1,
    minWidth: 0,
    padding: '2px 4px',
    margin: '-2px -4px',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    color: theme.palette.text.primary,
    background: theme.palette.background.default,
    border: theme.palette.greyBorder('1px', 0.2),
    borderRadius: 3,
    outline: 'none',
    '&:focus': {
      borderColor: theme.palette.primary.main,
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    visibility: 'hidden',
    '&:hover': {
      color: theme.palette.text.primary,
      background: theme.palette.greyAlpha(0.08),
    },
  },
  itemIcon: {
    '--icon-size': '14px',
    color: theme.palette.text.dim,
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
  // Conversation rows live inside a kind subsection — drop the per-row icon
  // (the subsection header carries the kind already) and indent so they sit
  // visually under the header.
  conversationItem: {
    paddingLeft: 36,
  },
  subsection: {
    display: 'flex',
    flexDirection: 'column',
  },
  subsectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 16px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: theme.palette.text.dim,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: 600,
    width: '100%',
    textAlign: 'left',
    '&:hover': {
      color: theme.palette.text.primary,
      background: theme.palette.greyAlpha(0.04),
    },
  },
  subsectionChevron: {
    '--icon-size': '12px',
    flex: 'none',
    transition: 'transform 120ms ease',
    // Trailing margin when collapsed is symmetric with the section's right
    // gutter; when expanded the rotate(90) flips its visual orientation but
    // doesn't change its layout box.
  },
  subsectionChevronExpanded: {
    transform: 'rotate(90deg)',
  },
  subsectionKindIcon: {
    '--icon-size': '13px',
    flex: 'none',
  },
  subsectionLabel: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  subsectionCount: {
    color: theme.palette.text.dim,
    fontWeight: 500,
    letterSpacing: 0,
    textTransform: 'none',
    fontSize: 11,
  },
}));

const ProjectSidebar = ({
  projectId,
  activeDocumentId,
  activeChatConversationId,
  onSelectDocument,
  onSelectConversation,
  onCollapse,
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
  const [renameDocument] = useMutation(RenameResearchDocumentMutation);
  const [renameConversation] = useMutation(RenameResearchConversationMutation);

  const project = data?.researchProject?.result;
  const documents = data?.researchDocuments?.results ?? [];
  const conversations = data?.researchConversations?.results ?? [];

  const handleRenameDocument = async (id: string, title: string | null) => {
    await renameDocument({ variables: { id, title } });
  };
  const handleRenameConversation = async (id: string, title: string | null) => {
    await renameConversation({ variables: { id, title } });
  };

  // Bucket by entrypoint kind so each subsection only walks its own slice.
  // The order in `KIND_ORDER` defines the visual order of the subsections.
  const conversationsByKind = useMemo(() => {
    const buckets: Record<EntrypointKind | 'unknown', typeof conversations> = {
      chat: [],
      document: [],
      subagent: [],
      fork: [],
      unknown: [],
    };
    for (const conv of conversations) {
      buckets[entrypointKindOf(conv.entrypoint)].push(conv);
    }
    return buckets;
  }, [conversations]);

  const [collapsedKinds, setCollapsedKinds] = useState<Set<string>>(new Set());
  const toggleKindCollapsed = (kind: string) => {
    setCollapsedKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
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

  const handleNewChat = () => {
    onStartNewChat();
  };

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <h2 className={classes.projectTitle}>{project?.title ?? (loading ? 'Loading…' : 'Project')}</h2>
        <button
          type="button"
          className={classes.collapseButton}
          onClick={onCollapse}
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <ForumIcon icon="ChevronLeft" className={classes.icon} />
        </button>
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
              aria-label="New document"
            >
              <ForumIcon icon="PlusSmall" className={classes.icon} />
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
                <ForumIcon icon="Document" className={classes.itemIcon} />
                <EditableTitle
                  classes={classes}
                  title={doc.title}
                  placeholder="Untitled document"
                  onRename={(next) => handleRenameDocument(doc._id, next)}
                />
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
              className={classes.sectionAction}
              onClick={handleNewChat}
              title="New chat"
              aria-label="New chat"
            >
              <ForumIcon icon="PlusSmall" className={classes.icon} />
            </button>
          </div>
          {loading && conversations.length === 0 ? <Loading /> : null}
          {!loading && conversations.length === 0 ? (
            <div className={classes.empty}>No conversations yet</div>
          ) : null}
          {KIND_ORDER.map((kind) => {
            const items = conversationsByKind[kind];
            if (items.length === 0) return null;
            const isCollapsed = collapsedKinds.has(kind);
            const meta = KIND_META[kind];
            return (
              <div key={kind} className={classes.subsection}>
                <button
                  type="button"
                  className={classes.subsectionHeader}
                  onClick={() => toggleKindCollapsed(kind)}
                  aria-expanded={!isCollapsed}
                  title={meta.title}
                >
                  <ForumIcon icon={meta.icon} className={classes.subsectionKindIcon} />
                  <span className={classes.subsectionLabel}>{meta.label}</span>
                  <span className={classes.subsectionCount}>{items.length}</span>
                  <ForumIcon
                    icon="ChevronRight"
                    className={classNames(
                      classes.subsectionChevron,
                      !isCollapsed && classes.subsectionChevronExpanded,
                    )}
                  />
                </button>
                {isCollapsed ? null : (
                  <ul className={classes.list}>
                    {items.map((conv) => (
                      <li
                        key={conv._id}
                        className={classNames(classes.item, classes.conversationItem, {
                          [classes.itemActive]: conv._id === activeChatConversationId,
                        })}
                        onClick={() => onSelectConversation(conv._id)}
                        title={meta.title}
                      >
                        <EditableTitle
                          classes={classes}
                          title={conv.title ?? null}
                          placeholder="Untitled conversation"
                          onRename={(next) => handleRenameConversation(conv._id, next)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
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
      <span className={classes.itemLabel}>{title ?? placeholder}</span>
      <button
        type="button"
        className={classes.itemEditButton}
        onClick={startEditing}
        title="Rename"
        aria-label="Rename"
      >
        <ForumIcon icon="Pencil" className={classes.icon} />
      </button>
    </>
  );
};

type KnownEntrypointKind = EntrypointKind | 'unknown';

interface KindMeta {
  label: string;
  icon: ForumIconName;
  title: string;
}

// Order is the visual order of subsections; chat first (the default user
// entrypoint), agent-internal byproducts (subagent/fork) last. Empty
// buckets are hidden, so order doesn't introduce blank rows.
const KIND_META: Record<KnownEntrypointKind, KindMeta> = {
  chat: { label: 'Chat', icon: 'ChatBubbleLeftRight', title: 'Started from chat' },
  document: { label: 'Document queries', icon: 'Document', title: 'Started from a document' },
  subagent: { label: 'Sub-agent calls', icon: 'Sparkles', title: 'Spawned by another agent' },
  fork: { label: 'Forks', icon: 'Copy', title: 'Forked from another conversation' },
  unknown: { label: 'Other', icon: 'ChatBubbleLeftRight', title: 'Conversation' },
};

const KIND_ORDER: ReadonlyArray<KnownEntrypointKind> = [
  'chat', 'document', 'subagent', 'fork', 'unknown',
];

// `entrypoint` arrives as opaque `JSON!` over GraphQL; narrow defensively.
function entrypointKindOf(entrypoint: unknown): KnownEntrypointKind {
  if (
    entrypoint &&
    typeof entrypoint === 'object' &&
    'kind' in entrypoint &&
    typeof (entrypoint as { kind: unknown }).kind === 'string'
  ) {
    const kind = (entrypoint as { kind: string }).kind;
    if (kind in KIND_META && kind !== 'unknown') {
      return kind as KnownEntrypointKind;
    }
  }
  return 'unknown';
}

export default ProjectSidebar;
