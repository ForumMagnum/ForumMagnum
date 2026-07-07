'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LexicalEditor } from 'lexical';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LWDialog from '@/components/common/LWDialog';
import FormatDate from '@/components/common/FormatDate';
import ForumIcon from '@/components/common/ForumIcon';
import { useQuery } from '@/lib/crud/useQuery';
import { ProjectSidebarQuery } from '../projectSidebarQuery';
import { ResearchItemIcon } from '../researchIconSet';
import {
  researchCanvas,
  researchChatSurface,
  researchTextInput,
  researchScrollbars,
  researchEyebrow,
  researchMono,
  researchUiSans,
  researchWarmAlpha,
  researchAccentTint,
  researchRadius,
  researchSquircle,
  researchTransition,
} from '../researchStyleUtils';
import { $insertConversationBlockAtSelection } from './WorkspaceIntentPlugin';

const styles = defineStyles('InsertResearchChatDialog', (theme: ThemeType) => ({
  paper: {
    width: 'min(480px, 92vw)',
    maxWidth: 'min(480px, 92vw)',
    background: researchCanvas(theme),
    border: `1px solid ${researchWarmAlpha(0.1)}`,
    borderRadius: researchRadius.lg,
    ...researchSquircle,
    boxShadow: `0 12px 40px ${researchWarmAlpha(0.18)}`,
    overflow: 'hidden',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    fontFamily: researchUiSans,
    color: theme.palette.text.primary,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '16px 16px 12px',
    borderBottom: `1px solid ${researchWarmAlpha(0.07)}`,
  },
  eyebrow: {
    ...researchEyebrow(theme),
  },
  search: {
    ...researchTextInput(theme),
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    padding: 6,
    maxHeight: 340,
    overflowY: 'auto',
    ...researchScrollbars(theme),
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'left',
    padding: '9px 10px',
    borderRadius: researchRadius.sm,
    ...researchSquircle,
    border: '1px solid transparent',
    background: 'transparent',
    color: theme.palette.text.primary,
    cursor: 'pointer',
    transition: `background ${researchTransition}, border-color ${researchTransition}`,
  },
  rowActive: {
    background: researchAccentTint(0.12),
    borderColor: researchAccentTint(0.28),
  },
  iconSlot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: '0 0 auto',
    width: 22,
    height: 22,
    borderRadius: researchRadius.xs,
    ...researchSquircle,
    background: researchChatSurface(theme),
    border: `1px solid ${researchWarmAlpha(0.08)}`,
    fontSize: 14,
    lineHeight: 1,
    color: theme.palette.text.dim,
    '--icon-size': '13px',
  },
  rowBody: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: '1 1 auto',
    gap: 1,
  },
  rowTitle: {
    fontSize: 14,
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  untitled: {
    fontStyle: 'italic',
    color: theme.palette.text.dim,
  },
  rowMeta: {
    flex: '0 0 auto',
    fontFamily: researchMono,
    fontSize: 11,
    letterSpacing: '0.02em',
    color: theme.palette.text.dim,
    fontVariantNumeric: 'tabular-nums',
  },
  empty: {
    padding: '22px 12px',
    textAlign: 'center',
    fontSize: 13,
    color: theme.palette.text.dim,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '9px 14px',
    borderTop: `1px solid ${researchWarmAlpha(0.07)}`,
    fontFamily: researchMono,
    fontSize: 11,
    color: theme.palette.text.dim,
  },
  hint: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
  },
  key: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 16,
    height: 16,
    padding: '0 4px',
    borderRadius: 4,
    background: researchWarmAlpha(0.07),
    border: `1px solid ${researchWarmAlpha(0.1)}`,
    fontSize: 10,
    lineHeight: 1,
  },
}));

interface PickerConversation {
  _id: string;
  title: string | null;
  icon: string | null;
  lastActivityAt: Date | string | null;
}

/**
 * Slash-menu ("Insert existing chat") dialog: lists the project's
 * conversations and, on selection, inserts a full v2 conversation block
 * (transcript + reply composer) bound to that conversation at the editor's
 * current selection — a second live view of the chat, same as
 * Cmd/Ctrl-clicking a sidebar chat. Fully keyboard-driven: type to filter,
 * ↑/↓ to move, ↵ to insert, esc to close.
 */
export function InsertResearchChatDialog({
  activeEditor,
  projectId,
  onClose,
}: {
  activeEditor: LexicalEditor;
  projectId: string;
  onClose: () => void;
}) {
  const classes = useStyles(styles);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { data, loading } = useQuery(ProjectSidebarQuery, {
    variables: { projectId },
  });

  const conversations: PickerConversation[] = useMemo(() => {
    const results = data?.researchConversations?.results ?? [];
    const needle = search.trim().toLowerCase();
    const filtered = needle
      ? results.filter((c) => (c.title ?? '').toLowerCase().includes(needle))
      : results;
    // Newest activity first, matching the sidebar's ordering.
    return [...filtered].sort((a, b) => {
      const at = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const bt = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return bt - at;
    });
  }, [data, search]);

  // Keep the highlight in range as the filtered list changes.
  useEffect(() => {
    setActiveIndex((i) => (conversations.length ? Math.min(i, conversations.length - 1) : 0));
  }, [conversations.length]);

  // Keep the highlighted row scrolled into view when moving by keyboard.
  useEffect(() => {
    rowRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const insertConversation = useCallback(
    (conversationId: string) => {
      activeEditor.update(() => {
        $insertConversationBlockAtSelection(conversationId);
      });
      onClose();
      activeEditor.focus();
    },
    [activeEditor, onClose],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const count = conversations.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (count) setActiveIndex((i) => (i + 1) % count);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (count) setActiveIndex((i) => (i - 1 + count) % count);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setActiveIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        if (count) setActiveIndex(count - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const target = conversations[activeIndex];
        if (target) insertConversation(target._id);
      }
    },
    [conversations, activeIndex, insertConversation],
  );

  return (
    <LWDialog open={true} onClose={onClose} maxWidth={false} paperClassName={classes.paper}>
      <div className={classes.root} onKeyDown={onKeyDown}>
        <div className={classes.header}>
          <div className={classes.eyebrow}>Insert existing chat</div>
          <input
            className={classes.search}
            placeholder="Search chats…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className={classes.list}>
          {conversations.map((conv, index) => (
            <button
              key={conv._id}
              type="button"
              ref={(el) => {
                rowRefs.current[index] = el;
              }}
              className={classNames(classes.row, index === activeIndex && classes.rowActive)}
              onMouseMove={() => setActiveIndex(index)}
              onClick={() => insertConversation(conv._id)}
            >
              <span className={classes.iconSlot}>
                {conv.icon ? (
                  <ResearchItemIcon icon={conv.icon} />
                ) : (
                  <ForumIcon icon="Robot" />
                )}
              </span>
              <span className={classes.rowBody}>
                <span
                  className={classNames(classes.rowTitle, !conv.title && classes.untitled)}
                >
                  {conv.title ?? 'Untitled conversation'}
                </span>
              </span>
              {conv.lastActivityAt && (
                <span className={classes.rowMeta}>
                  <FormatDate date={conv.lastActivityAt} />
                </span>
              )}
            </button>
          ))}
          {!conversations.length && (
            <div className={classes.empty}>
              {loading ? 'Loading chats…' : 'No chats match.'}
            </div>
          )}
        </div>

        <div className={classes.footer}>
          <span className={classes.hint}>
            <span className={classes.key}>↑</span>
            <span className={classes.key}>↓</span>
            <span>navigate</span>
          </span>
          <span className={classes.hint}>
            <span className={classes.key}>↵</span>
            <span>insert</span>
          </span>
          <span className={classes.hint}>
            <span className={classes.key}>esc</span>
            <span>close</span>
          </span>
        </div>
      </div>
    </LWDialog>
  );
}
