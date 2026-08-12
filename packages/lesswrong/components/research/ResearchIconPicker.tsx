'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import {
  researchCanvas,
  researchInputBackground,
  researchMono,
  researchRadius,
  researchUiSans,
  researchWarmAlpha,
} from './researchStyleUtils';
import {
  RESEARCH_ICON_GROUPS,
  RESEARCH_SVG_ICON_PREFIX,
  ResearchCustomIcon,
  type ResearchIconGroup,
} from './researchIconSet';

const styles = defineStyles('ResearchIconPicker', (theme: ThemeType) => ({
  popover: {
    position: 'fixed',
    zIndex: 1000,
    width: POPOVER_WIDTH,
    background: researchCanvas(theme),
    border: `1px solid ${researchWarmAlpha(0.16)}`,
    borderRadius: researchRadius.md,
    boxShadow: `0 6px 24px ${researchWarmAlpha(0.16)}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: researchUiSans,
  },
  headerRow: {
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    borderBottom: `1px solid ${researchWarmAlpha(0.08)}`,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    border: `1px solid ${researchWarmAlpha(0.14)}`,
    borderRadius: researchRadius.sm,
    background: researchInputBackground(theme),
    color: theme.palette.text.primary,
    fontFamily: researchUiSans,
    fontSize: 12.5,
    lineHeight: 1.4,
    padding: '4px 8px',
    outline: 'none',
    '&:focus': {
      borderColor: theme.palette.primary.main,
    },
    '&::placeholder': {
      color: theme.palette.text.dim,
    },
  },
  clearButton: {
    flex: 'none',
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
  body: {
    overflowY: 'auto',
    maxHeight: 440,
    padding: '8px 10px 10px',
  },
  divider: {
    borderTop: `1px solid ${researchWarmAlpha(0.08)}`,
    margin: '6px 2px',
  },
  iconGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, 1fr)',
  },
  iconButton: {
    border: 'none',
    background: 'transparent',
    width: 28,
    height: 28,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: researchRadius.xs,
    cursor: 'pointer',
    fontSize: 17,
    color: theme.palette.text.primary,
    '&:hover': { background: researchWarmAlpha(0.08) },
  },
  empty: {
    padding: '14px 2px',
    fontSize: 12,
    color: theme.palette.text.dim,
    fontStyle: 'italic',
  },
}));

interface ResearchIconPickerProps {
  anchor: { left: number; bottom: number };
  onSelect: (icon: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const POPOVER_WIDTH = 352;
const POPOVER_MAX_HEIGHT = 490;

function filterGroups(query: string): ResearchIconGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return RESEARCH_ICON_GROUPS;
  return RESEARCH_ICON_GROUPS
    .map((group) => ({
      title: group.title,
      icons: group.icons.filter(
        (def) => def.label.toLowerCase().includes(q) || def.id.includes(q),
      ),
    }))
    .filter((group) => group.icons.length > 0);
}

export const ResearchIconPicker = ({ anchor, onSelect, onClear, onClose }: ResearchIconPickerProps) => {
  const classes = useStyles(styles);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // Capture phase + preventDefault: claim this Escape so outer surfaces
    // (fullscreen chat's exit handler) don't also close on the same press.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (popoverRef.current && e.target instanceof Node && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [onClose]);

  const groups = useMemo(() => filterGroups(query), [query]);

  const left = Math.min(anchor.left, (typeof window !== 'undefined' ? window.innerWidth : 1200) - POPOVER_WIDTH - 8);
  const top = typeof window !== 'undefined'
    ? Math.min(anchor.bottom + 4, window.innerHeight - POPOVER_MAX_HEIGHT - 8)
    : anchor.bottom + 4;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div ref={popoverRef} className={classes.popover} style={{ left: Math.max(8, left), top: Math.max(8, top) }}>
      <div className={classes.headerRow}>
        <input
          type="text"
          className={classes.searchInput}
          placeholder="Filter icons…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button type="button" className={classes.clearButton} onClick={onClear}>
          Remove icon
        </button>
      </div>
      <div className={classes.body}>
        {groups.map((group, i) => (
          <React.Fragment key={group.title}>
            {i > 0 && <div className={classes.divider} />}
            <div className={classes.iconGrid}>
              {group.icons.map((def) => (
                <button
                  key={def.id}
                  type="button"
                  className={classes.iconButton}
                  title={def.label}
                  onClick={() => onSelect(RESEARCH_SVG_ICON_PREFIX + def.id)}
                >
                  <ResearchCustomIcon def={def} />
                </button>
              ))}
            </div>
          </React.Fragment>
        ))}
        {groups.length === 0 && <div className={classes.empty}>No icons match "{query}"</div>}
      </div>
    </div>,
    document.body,
  );
};
