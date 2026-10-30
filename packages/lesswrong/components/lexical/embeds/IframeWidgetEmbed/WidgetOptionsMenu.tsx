'use client';
// EXPERIMENT (experiment/iframe-layout-ronny-exp2): what a widget's gear button opens in the drag editor:
// full width or left/right, the top or bottom of its paragraph, and its width. Each change is one undo
// step (the plugin's handleLayoutChange). It stays open for more changes; Escape, a press outside it or
// the gear again closes it.
import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import {
  IframeWidgetLayout, alignOf, offeredWidths, shouldWrapWidget, widgetWidthPx, withAlign, wrappableWidths,
} from '@/components/contents/iframeWidgetLayout';

/** A widget switched from full width to a side gets this width. */
const DEFAULT_WRAP_WIDTH = '33%';
export const OPTIONS_MENU_WIDTH = 240;

const styles = defineStyles('WidgetOptionsMenu', (theme: ThemeType) => ({
  menu: {
    ...theme.typography.body2,
    position: 'absolute',
    zIndex: 6,
    width: OPTIONS_MENU_WIDTH,
    boxSizing: 'border-box',
    padding: '6px 10px 10px',
    background: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder('1px', 0.15),
    borderRadius: 8,
    boxShadow: `0 4px 16px ${theme.palette.boxShadowColor(0.18)}`,
    fontSize: 12,
    color: theme.palette.text.normal,
  },
  label: {
    margin: '8px 0 4px',
    color: theme.palette.grey[600],
    fontSize: 11,
  },
  buttons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 3,
  },
  button: {
    padding: '4px 9px',
    borderRadius: 5,
    border: theme.palette.greyBorder('1px', 0.15),
    background: 'transparent',
    color: theme.palette.text.normal,
    cursor: 'pointer',
    font: 'inherit',
    '&:hover': {
      background: theme.palette.grey[200],
    },
    '&:disabled': {
      color: theme.palette.grey[400],
      background: 'transparent',
      cursor: 'default',
    },
  },
  active: {
    background: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    '&:hover': {
      background: theme.palette.primary.main,
    },
  },
  note: {
    marginTop: 8,
    color: theme.palette.grey[600],
  },
}));

const preventDefault = (e: React.SyntheticEvent) => e.preventDefault();

export function WidgetOptionsMenu({ layout, columnWidth, onlyWrapping = false, onDelete, style, onChange, onClose }: {
  layout: IframeWidgetLayout,
  columnWidth: number,
  /**
   * EXPERIMENT (experiment/iframe-layout-ronny-exp3): a widget inside a quote, list item, collapsible
   * section or AI content offers only the widths that wrap against that block's text (Ronny, Oct 29 2026:
   * keep the 300px rule): 25/33/38% in a quote at the normal width, 50% too in AI content, which is as
   * wide as the column. Measured, so it follows the window.
   */
  onlyWrapping?: boolean,
  /** EXPERIMENT (experiment/iframe-layout-ronny-exp3): a Delete button (a widget inside a block, which has no grip to select it by). */
  onDelete?: () => void,
  style: React.CSSProperties,
  onChange: (layout: IframeWidgetLayout) => void,
  /** refocus: closed with Escape, so the gear gets the focus back. */
  onClose: (refocus?: boolean) => void,
}) {
  const classes = useStyles(styles);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      // (The gear button toggles it itself.)
      if (ref.current?.contains(target) || target?.closest('[data-testid=widget-options]')) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose(true);
    };
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [onClose]);

  const side = layout.position === 'left' || layout.position === 'right' ? layout.position : null;
  const width = layout.width ?? DEFAULT_WRAP_WIDTH;
  // The widths not too narrow to use in this column (inside a block: the ones that wrap), plus the widget's
  // own (which it keeps, even where it can't wrap: it shows full width, with the note below).
  const px = (w: string) => widgetWidthPx({ position: 'left', width: w }, columnWidth) ?? columnWidth;
  const offered = onlyWrapping ? wrappableWidths(columnWidth) : offeredWidths(columnWidth);
  const widths = !side || offered.includes(width) ? offered : [...offered, width].sort((a, b) => px(a) - px(b));
  const button = (option: string, label: string, active: boolean, next: IframeWidgetLayout, disabled = false) => <button
    key={option}
    type="button"
    className={classNames(classes.button, active && classes.active)}
    disabled={disabled}
    aria-pressed={active}
    data-option={option}
    onMouseDown={preventDefault}
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!active) onChange(next); }}
  >{label}</button>;

  return <div ref={ref} className={classes.menu} style={style} role="dialog" aria-label="Widget options" data-testid="widget-options-menu">
    <div className={classes.label}>Placement</div>
    <div className={classes.buttons}>
      {button('full', 'Full width', !side, { position: 'inline', width: null })}
      {button('left', 'Left', side === 'left', { ...layout, position: 'left', width })}
      {button('right', 'Right', side === 'right', { ...layout, position: 'right', width })}
    </div>
    <div className={classes.label}>Lines up with its paragraph's</div>
    <div className={classes.buttons}>
      {button('top', 'Top', !!side && alignOf(layout) === 'top', withAlign(layout, 'top'), !side)}
      {button('bottom', 'Bottom', !!side && alignOf(layout) === 'bottom', withAlign(layout, 'bottom'), !side)}
    </div>
    <div className={classes.label}>Width</div>
    <div className={classes.buttons}>
      {widths.map(w => button(w, w, !!side && w === width, { ...layout, width: w }, !side))}
    </div>
    {side && !shouldWrapWidget(layout, columnWidth) && <div className={classes.note}>
      Full width at this window size: no room for text beside it.
    </div>}
    {onDelete && <>
      <div className={classes.label}>Widget</div>
      <div className={classes.buttons}>
        <button
          type="button"
          className={classes.button}
          data-option="delete"
          onMouseDown={preventDefault}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
        >Delete widget</button>
      </div>
    </>}
  </div>;
}
