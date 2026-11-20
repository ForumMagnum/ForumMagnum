import React, { useRef } from 'react';
import classNames from 'classnames';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("SearchSegmentedControl", (theme: ThemeType) => ({
  root: {
    display: "inline-flex",
    maxWidth: "100%",
    padding: 2,
    gap: 2,
    boxSizing: "border-box",
    borderRadius: 6,
    backgroundColor: theme.palette.greyAlpha(0.06),
  },
  fullWidth: {
    display: "flex",
    width: "100%",
  },
  segment: {
    ...theme.typography.body2,
    flex: "1 1 auto",
    minWidth: 0,
    minHeight: 30,
    padding: "2px 10px",
    boxSizing: "border-box",
    border: "none",
    borderRadius: 4,
    backgroundColor: "transparent",
    color: theme.palette.text.dim,
    fontSize: 13,
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: "background-color 120ms, color 120ms",
    "@media (prefers-reduced-motion: reduce)": {transition: "none"},
    "@media (pointer: coarse)": {minHeight: 38},
    "&:hover": {
      color: theme.palette.text.normal,
      backgroundColor: theme.palette.greyAlpha(0.06),
    },
    "&:focus-visible": {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 1,
    },
  },
  checked: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 500,
    "&:hover": {
      color: theme.palette.primary.contrastText,
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

export interface SearchSegment<T extends string> {
  value: T,
  label: string,
  /** Spoken instead of the label when the label is short for the visible control ("Day" for "Past day"). */
  ariaLabel?: string,
}

/**
 * A single choice among a few options: a radio group drawn as connected segments.
 * Arrow keys move the choice, and only the checked segment is a tab stop.
 */
const SearchSegmentedControl = <T extends string>({label, segments, value, onChange, fullWidth, className}: {
  label: string,
  segments: SearchSegment<T>[],
  value: T | undefined,
  onChange: (value: T) => void,
  fullWidth?: boolean,
  className?: string,
}) => {
  const classes = useStyles(styles);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const checkedIndex = segments.findIndex(segment => segment.value === value);
  const tabStop = checkedIndex === -1 ? 0 : checkedIndex;

  const select = (index: number) => {
    onChange(segments[index].value);
    buttons.current[index]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = segments.length - 1;
    const target = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(target);
  };

  return <div role="radiogroup" aria-label={label} className={classNames(classes.root, {[classes.fullWidth]: fullWidth}, className)}>
    {segments.map((segment, index) => <button
      key={segment.value}
      ref={(element) => { buttons.current[index] = element; }}
      type="button"
      role="radio"
      aria-checked={index === checkedIndex}
      aria-label={segment.ariaLabel}
      tabIndex={index === tabStop ? 0 : -1}
      className={classNames(classes.segment, {[classes.checked]: index === checkedIndex})}
      onClick={() => select(index)}
      onKeyDown={(event) => onKeyDown(event, index)}
    >
      {segment.label}
    </button>)}
  </div>;
};

export default SearchSegmentedControl;
