import ChevronRightIcon from '@heroicons/react/20/solid/ChevronRightIcon';
import classNames from 'classnames';
import React, { useId } from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("SearchFilterRow", (theme: ThemeType) => ({
  root: {marginBottom: 2},
  header: {
    display: "flex", alignItems: "center", width: "fit-content", maxWidth: "100%", minWidth: 0,
    borderRadius: 4,
  },
  toggle: {
    ...theme.typography.body2,
    display: "flex", alignItems: "center", gap: 8, flex: "0 1 auto", minWidth: 0,
    minHeight: 40, padding: "2px 10px", border: "none", background: "transparent",
    color: theme.palette.text.normal, textAlign: "left", cursor: "pointer",
    borderRadius: 4,
    "&:focus-visible": {outline: `2px solid ${theme.palette.primary.main}`},
  },
  chevron: {
    width: 16, height: 16, flexShrink: 0, color: theme.palette.text.dim,
    transition: "transform 200ms ease-out",
    "@media (prefers-reduced-motion: reduce)": {transition: "none"},
  },
  expanded: {transform: "rotate(90deg)"},
  expandedUp: {transform: "rotate(-90deg)"},
  label: {minWidth: 82, fontWeight: 500, fontSize: 13},
  summary: {fontSize: 13, color: theme.palette.text.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"},
  active: {color: theme.palette.primary.main},
  reset: {
    ...theme.typography.body2, minHeight: 40, padding: "0 8px", border: "none", flexShrink: 0,
    borderRadius: 4,
    background: "transparent", color: theme.palette.primary.main, cursor: "pointer",
    "&:focus-visible": {outline: `2px solid ${theme.palette.primary.main}`},
  },
  controls: {padding: "4px 10px 12px", minWidth: 0, "&[hidden]": {display: "none"}},
}));

interface SearchFilterRowProps {
  label: string;
  summary: string;
  active: boolean;
  expanded: boolean;
  expandDirection?: "up" | "down";
  onToggle: () => void;
  onReset: () => void;
  controlsId?: string;
  children?: React.ReactNode;
}

export default function SearchFilterRow({label, summary, active, expanded, expandDirection = "down", onToggle, onReset, controlsId, children}: SearchFilterRowProps) {
  const classes = useStyles(styles);
  const id = useId();
  return <div className={classes.root}>
    <div className={classes.header}>
      <button type="button" className={classes.toggle} aria-expanded={expanded} aria-controls={controlsId ?? id} onClick={onToggle}>
        <ChevronRightIcon aria-hidden="true" className={classNames(classes.chevron, {[classes.expanded]: expanded && expandDirection === "down", [classes.expandedUp]: expanded && expandDirection === "up"})} />
        <span className={classes.label}>{label}</span>
        <span className={classNames(classes.summary, {[classes.active]: active})}>{summary}</span>
      </button>
      {active && <button type="button" className={classes.reset} aria-label={`Reset ${label.toLowerCase()}`} onClick={onReset}>Reset</button>}
    </div>
    {children !== undefined && <div id={id} className={classes.controls} hidden={!expanded}>{children}</div>}
  </div>;
}
