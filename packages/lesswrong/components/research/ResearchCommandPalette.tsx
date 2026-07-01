'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useMutation } from '@apollo/client/react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useNavigate } from '@/lib/routeUtil';
import ForumIcon, { type ForumIconName } from '@/components/common/ForumIcon';
import { ProjectSidebarQuery } from './projectSidebarQuery';
import {
  researchCompactRow,
  researchCompactRowActive,
  researchEyebrow,
  researchMono,
  researchRadius,
  researchScrollbars,
  researchWarmAlpha,
  researchCanvas,
  researchUiSans,
} from './researchStyleUtils';

const CreatePaletteDocumentMutation = gql(`
  mutation CreateResearchDocumentPalette($projectId: String!) {
    createResearchDocument(data: { projectId: $projectId, title: null }) {
      data {
        _id
        title
      }
    }
  }
`);

const MAX_RESULTS = 14;

const styles = defineStyles('ResearchCommandPalette', (theme: ThemeType) => ({
  scrim: {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    background: researchWarmAlpha(0.18),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  panel: {
    marginTop: '16vh',
    width: 560,
    maxWidth: 'calc(100vw - 48px)',
    maxHeight: '56vh',
    display: 'flex',
    flexDirection: 'column',
    background: researchCanvas(theme),
    border: `1px solid ${researchWarmAlpha(0.1)}`,
    borderRadius: researchRadius.lg,
    boxShadow: `0 16px 60px ${researchWarmAlpha(0.22)}, 0 2px 8px ${researchWarmAlpha(0.08)}`,
    overflow: 'hidden',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    padding: '13px 16px',
    fontSize: 14.5,
    fontFamily: researchUiSans,
    color: theme.palette.text.primary,
    borderBottom: `1px solid ${researchWarmAlpha(0.07)}`,
    '&::placeholder': {
      color: researchWarmAlpha(0.32),
    },
    // Global styles restyle input borders on focus; restate "none".
    '&:focus': {
      border: 'none',
      borderBottom: `1px solid ${researchWarmAlpha(0.07)}`,
    },
  },
  results: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '6px 6px 8px',
    ...researchScrollbars(theme),
  },
  sectionLabel: {
    ...researchEyebrow(theme),
    padding: '8px 10px 3px',
  },
  item: {
    ...researchCompactRow(theme),
    minHeight: 30,
    gap: 9,
  },
  itemActive: researchCompactRowActive(theme),
  itemIcon: {
    '--icon-size': '14px',
    flex: 'none',
    color: theme.palette.text.dim,
  },
  itemLabel: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemLabelDim: {
    color: theme.palette.text.dim,
  },
  itemHint: {
    flex: 'none',
    fontFamily: researchMono,
    fontSize: 10,
    color: researchWarmAlpha(0.35),
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  empty: {
    padding: '14px 12px',
    fontSize: 13,
    color: theme.palette.text.dim,
    fontStyle: 'italic',
  },
}));

interface PaletteEntry {
  key: string;
  label: string;
  hint: string;
  icon: ForumIconName;
  section: 'actions' | 'documents' | 'conversations';
  untitled?: boolean;
  run: () => void | Promise<void>;
}

interface ResearchCommandPaletteProps {
  projectId: string;
  activeDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onStartNewConversation: () => void;
  onToggleSidebar: () => void;
}

/**
 * ⌘K command palette: fuzzy-jump to any document or conversation in the
 * project, plus core workspace actions. Hand-rolled (input + ranked list +
 * keyboard nav) — no portal dependency needed since the workspace owns the
 * viewport.
 */
const ResearchCommandPalette = ({
  projectId,
  activeDocumentId,
  onSelectDocument,
  onSelectConversation,
  onStartNewConversation,
  onToggleSidebar,
}: ResearchCommandPaletteProps) => {
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { data } = useQuery(ProjectSidebarQuery, {
    variables: { projectId },
    fetchPolicy: 'cache-first',
    skip: !open,
  });
  const [createDocument] = useMutation(CreatePaletteDocumentMutation, {
    refetchQueries: [ProjectSidebarQuery],
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery('');
        setActiveIndex(0);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const entries = useMemo<PaletteEntry[]>(() => {
    if (!open) return [];
    const documents = data?.researchDocuments?.results ?? [];
    const conversations = [...(data?.researchConversations?.results ?? [])].sort((a, b) => {
      const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).valueOf() : 0;
      const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).valueOf() : 0;
      return bTime - aTime;
    });
    const actionEntries: PaletteEntry[] = [
      {
        key: 'action:new-document',
        label: 'New document',
        hint: 'action',
        icon: 'PlusSmall',
        section: 'actions',
        run: async () => {
          const result = await createDocument({ variables: { projectId } });
          const created = result.data?.createResearchDocument?.data;
          if (created) onSelectDocument(created._id);
        },
      },
      {
        key: 'action:new-conversation',
        label: 'New conversation',
        hint: 'action',
        icon: 'ChatBubbleLeftRight',
        section: 'actions',
        run: () => onStartNewConversation(),
      },
      {
        key: 'action:toggle-sidebar',
        label: 'Toggle sidebar',
        hint: 'action',
        icon: 'ChevronDoubleLeft',
        section: 'actions',
        run: () => onToggleSidebar(),
      },
      {
        key: 'action:all-projects',
        label: 'All research projects',
        hint: 'action',
        icon: 'ChevronLeft',
        section: 'actions',
        run: () => navigate('/research'),
      },
      {
        key: 'action:back-to-lw',
        label: 'Back to LessWrong',
        hint: 'action',
        icon: 'ChevronLeft',
        section: 'actions',
        run: () => navigate('/'),
      },
    ];
    const documentEntries: PaletteEntry[] = documents.map((doc) => ({
      key: `doc:${doc._id}`,
      label: doc.title ?? 'Untitled document',
      hint: doc._id === activeDocumentId ? 'open' : 'doc',
      icon: 'Document',
      section: 'documents',
      untitled: !doc.title,
      run: () => onSelectDocument(doc._id),
    }));
    const conversationEntries: PaletteEntry[] = conversations.map((conv) => ({
      key: `conv:${conv._id}`,
      label: conv.title ?? 'Untitled conversation',
      hint: 'chat',
      icon: 'ChatBubbleLeftRight',
      section: 'conversations',
      untitled: !conv.title,
      run: () => onSelectConversation(conv._id),
    }));
    return [...actionEntries, ...documentEntries, ...conversationEntries];
  }, [open, data, projectId, activeDocumentId, createDocument, navigate, onSelectDocument, onSelectConversation, onStartNewConversation, onToggleSidebar]);

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return entries.slice(0, MAX_RESULTS);
    const scored: Array<{ entry: PaletteEntry; score: number }> = [];
    for (const entry of entries) {
      const score = fuzzyScore(trimmed, entry.label.toLowerCase());
      if (score !== null) scored.push({ entry, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, MAX_RESULTS).map((s) => s.entry);
  }, [entries, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const runEntry = useCallback((entry: PaletteEntry) => {
    close();
    void entry.run();
  }, [close]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const entry = results[activeIndex];
      if (entry) runEntry(entry);
    }
  }, [close, results, activeIndex, runEntry]);

  if (!open) return null;

  // Group consecutive results by section for the eyebrow labels.
  let lastSection: PaletteEntry['section'] | null = null;

  return (
    <div className={classes.scrim} onMouseDown={close}>
      <div className={classes.panel} onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className={classes.input}
          value={query}
          placeholder="Jump to a document or conversation, or run a command…"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          spellCheck={false}
        />
        <div className={classes.results}>
          {results.length === 0 ? (
            <div className={classes.empty}>No matches.</div>
          ) : (
            results.map((entry, index) => {
              const showLabel = entry.section !== lastSection;
              lastSection = entry.section;
              return (
                <React.Fragment key={entry.key}>
                  {showLabel ? (
                    <div className={classes.sectionLabel}>{SECTION_LABELS[entry.section]}</div>
                  ) : null}
                  <div
                    className={classNames(classes.item, index === activeIndex && classes.itemActive)}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => runEntry(entry)}
                    role="button"
                    tabIndex={-1}
                  >
                    <ForumIcon icon={entry.icon} className={classes.itemIcon} />
                    <span className={classNames(classes.itemLabel, entry.untitled && classes.itemLabelDim)}>
                      {entry.label}
                    </span>
                    <span className={classes.itemHint}>{entry.hint}</span>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const SECTION_LABELS: Record<PaletteEntry['section'], string> = {
  actions: 'Actions',
  documents: 'Documents',
  conversations: 'Conversations',
};

/**
 * Tiny fuzzy matcher: prefix beats word-boundary substring beats substring
 * beats in-order subsequence; null = no match. Good enough for a few hundred
 * project entries — no dependency needed.
 */
function fuzzyScore(query: string, target: string): number | null {
  if (target.startsWith(query)) return 1000 - target.length;
  const substringIdx = target.indexOf(query);
  if (substringIdx >= 0) {
    const atWordBoundary = substringIdx === 0 || target[substringIdx - 1] === ' ';
    return (atWordBoundary ? 600 : 400) - substringIdx - target.length / 100;
  }
  let queryIdx = 0;
  for (let i = 0; i < target.length && queryIdx < query.length; i++) {
    if (target[i] === query[queryIdx]) queryIdx++;
  }
  if (queryIdx === query.length) return 100 - target.length / 10;
  return null;
}

export default ResearchCommandPalette;
