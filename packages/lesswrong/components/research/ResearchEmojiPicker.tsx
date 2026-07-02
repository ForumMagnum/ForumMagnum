'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { researchCanvas, researchWarmAlpha, researchRadius, researchUiSans, researchMono } from './researchStyleUtils';

const styles = defineStyles('ResearchEmojiPicker', (theme: ThemeType) => ({
  popover: {
    position: 'fixed',
    zIndex: 1000,
    background: researchCanvas(theme),
    border: `1px solid ${researchWarmAlpha(0.16)}`,
    borderRadius: researchRadius.md,
    boxShadow: `0 6px 24px ${researchWarmAlpha(0.16)}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: researchUiSans,
    // emoji-mart's own theming handles the picker body; keep our chrome
    // minimal around it.
    '& em-emoji-picker': {
      '--rgb-accent': '95, 155, 101', // sage, matching primary.main
      height: 380,
    },
  },
  headerRow: {
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '4px 6px',
    borderBottom: `1px solid ${researchWarmAlpha(0.08)}`,
  },
  clearButton: {
    border: 'none',
    background: 'transparent',
    color: theme.palette.text.dim,
    cursor: 'pointer',
    fontFamily: researchMono,
    fontSize: 10.5,
    padding: '3px 7px',
    borderRadius: researchRadius.xs,
    whiteSpace: 'nowrap',
    '&:hover': { color: theme.palette.text.primary, background: researchWarmAlpha(0.06) },
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

const POPOVER_WIDTH = 352;
const POPOVER_MAX_HEIGHT = 420;

/**
 * Emoji picker popover for setting a document/conversation icon, backed by
 * emoji-mart (full Unicode 15 set: categories, search, skin tones, frequents —
 * the Notion-style palette). Portaled to the body, positioned near the
 * trigger and clamped to the viewport; closes on outside click or Esc. A slim
 * header carries the "Remove" (revert to default glyph) action.
 */
export const ResearchEmojiPicker = ({ anchor, onSelect, onClear, onClose }: ResearchEmojiPickerProps) => {
  const classes = useStyles(styles);
  const popoverRef = useRef<HTMLDivElement>(null);

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
      <div className={classes.headerRow}>
        <button type="button" className={classes.clearButton} onClick={onClear}>
          Remove icon
        </button>
      </div>
      <Picker
        data={data}
        onEmojiSelect={(emoji: { native?: string }) => {
          if (emoji.native) onSelect(emoji.native);
        }}
        theme="auto"
        previewPosition="none"
        skinTonePosition="search"
        autoFocus
        emojiButtonSize={30}
        emojiSize={20}
        perLine={9}
      />
    </div>,
    document.body,
  );
};
