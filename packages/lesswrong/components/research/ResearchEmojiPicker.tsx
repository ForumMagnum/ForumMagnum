'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import emojiList from '@/components/lexical/utils/emoji-list';
import { researchCanvas, researchWarmAlpha, researchRadius, researchUiSans, researchMono, researchScrollbars } from './researchStyleUtils';

interface EmojiEntry {
  emoji: string;
  description: string;
  aliases: string[];
  tags: string[];
}

const EMOJIS = emojiList as EmojiEntry[];

const styles = defineStyles('ResearchEmojiPicker', (theme: ThemeType) => ({
  popover: {
    position: 'fixed',
    zIndex: 1000,
    width: 300,
    background: researchCanvas(theme),
    border: `1px solid ${researchWarmAlpha(0.16)}`,
    borderRadius: researchRadius.md,
    boxShadow: `0 6px 24px ${researchWarmAlpha(0.16)}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: researchUiSans,
  },
  searchRow: {
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderBottom: `1px solid ${researchWarmAlpha(0.08)}`,
  },
  search: {
    flex: 1,
    minWidth: 0,
    border: `1px solid ${researchWarmAlpha(0.12)}`,
    borderRadius: researchRadius.sm,
    padding: '5px 9px',
    fontSize: 13,
    fontFamily: researchUiSans,
    color: theme.palette.text.primary,
    background: 'light-dark(#FFFFFF, #302D27)',
    outline: 'none',
    '&:focus': { borderColor: theme.palette.primary.main },
    '&::placeholder': { color: researchWarmAlpha(0.35) },
  },
  clearButton: {
    flex: 'none',
    border: 'none',
    background: 'transparent',
    color: theme.palette.text.dim,
    cursor: 'pointer',
    fontFamily: researchMono,
    fontSize: 10.5,
    padding: '4px 6px',
    borderRadius: researchRadius.xs,
    whiteSpace: 'nowrap',
    '&:hover': { color: theme.palette.text.primary, background: researchWarmAlpha(0.06) },
  },
  grid: {
    flex: 1,
    minHeight: 0,
    maxHeight: 240,
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: 1,
    padding: 6,
    ...researchScrollbars(theme),
  },
  emojiButton: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 20,
    lineHeight: 1,
    width: '100%',
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: researchRadius.xs,
    padding: 0,
    '&:hover': { background: researchWarmAlpha(0.1) },
  },
  empty: {
    gridColumn: '1 / -1',
    padding: '16px 8px',
    textAlign: 'center',
    fontSize: 13,
    color: theme.palette.text.dim,
    fontStyle: 'italic',
  },
}));

interface ResearchEmojiPickerProps {
  /** Screen coords to anchor the popover near (usually the trigger's rect). */
  anchor: { left: number; bottom: number };
  onSelect: (emoji: string) => void;
  /** Clear the custom icon (revert to the default glyph). */
  onClear: () => void;
  onClose: () => void;
}

const POPOVER_WIDTH = 300;
const POPOVER_MAX_HEIGHT = 300;

/**
 * A compact emoji picker popover for setting a document/conversation icon.
 * Filters the bundled emoji dataset by description/alias/tag; portaled to the
 * body and positioned near the trigger, clamped to the viewport. Closes on
 * outside click or Esc.
 */
export const ResearchEmojiPicker = ({ anchor, onSelect, onClear, onClose }: ResearchEmojiPickerProps) => {
  const classes = useStyles(styles);
  const [query, setQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EMOJIS.slice(0, 240);
    const matches: EmojiEntry[] = [];
    for (const e of EMOJIS) {
      if (
        e.description.includes(q) ||
        e.aliases.some((a) => a.includes(q)) ||
        e.tags.some((t) => t.includes(q))
      ) {
        matches.push(e);
        if (matches.length >= 240) break;
      }
    }
    return matches;
  }, [query]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onPointerDown = (e: PointerEvent) => {
      if (popoverRef.current && e.target instanceof Node && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    // Capture phase so it fires before row-level handlers stop propagation.
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [onClose]);

  // Clamp to the viewport so the popover never overflows off-screen.
  const left = Math.min(anchor.left, (typeof window !== 'undefined' ? window.innerWidth : 1200) - POPOVER_WIDTH - 8);
  const top = typeof window !== 'undefined'
    ? Math.min(anchor.bottom + 4, window.innerHeight - POPOVER_MAX_HEIGHT - 8)
    : anchor.bottom + 4;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div ref={popoverRef} className={classes.popover} style={{ left: Math.max(8, left), top: Math.max(8, top) }}>
      <div className={classes.searchRow}>
        <input
          className={classes.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emoji…"
          autoFocus
        />
        <button type="button" className={classes.clearButton} onClick={onClear}>
          Remove
        </button>
      </div>
      <div className={classes.grid}>
        {results.length === 0 ? (
          <div className={classes.empty}>No emoji found</div>
        ) : (
          results.map((e) => (
            <button
              key={e.emoji}
              type="button"
              className={classes.emojiButton}
              title={e.description}
              onClick={() => onSelect(e.emoji)}
            >
              {e.emoji}
            </button>
          ))
        )}
      </div>
    </div>,
    document.body,
  );
};
