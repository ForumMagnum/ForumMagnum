import React, { useId } from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("SearchFilterRow", (theme: ThemeType) => ({
  root: {borderBottom: theme.palette.greyBorder("1px", 0.08)},
  header: {display: "flex", alignItems: "center", minWidth: 0},
  toggle: {
    ...theme.typography.body2,
    display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0,
    minHeight: 40, padding: "4px 0", border: "none", background: "transparent",
    color: theme.palette.text.normal, textAlign: "left", cursor: "pointer",
    "&:focus-visible": {outline: `2px solid ${theme.palette.primary.main}`},
  },
  label: {minWidth: 82, fontWeight: 500, fontSize: 13},
  summary: {fontSize: 13, color: theme.palette.text.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"},
  reset: {
    ...theme.typography.body2, minHeight: 40, padding: "0 8px", border: "none",
    background: "transparent", color: theme.palette.primary.main, cursor: "pointer",
    "&:focus-visible": {outline: `2px solid ${theme.palette.primary.main}`},
  },
  controls: {padding: "2px 0 6px", minWidth: 0, "&[hidden]": {display: "none"}},
}));

interface SearchFilterRowProps {
  label: string;
  summary: string;
  active: boolean;
  expanded: boolean;
  onToggle: () => void;
  onReset: () => void;
  controlsId?: string;
  children?: React.ReactNode;
}

export default function SearchFilterRow({label, summary, active, expanded, onToggle, onReset, controlsId, children}: SearchFilterRowProps) {
  const classes = useStyles(styles);
  const id = useId();
  return <div className={classes.root}>
    <div className={classes.header}>
      <button type="button" className={classes.toggle} aria-expanded={expanded} aria-controls={controlsId ?? id} onClick={onToggle}>
        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
        <span className={classes.label}>{label}</span>
        <span className={classes.summary}>{summary}</span>
      </button>
      {active && <button type="button" className={classes.reset} aria-label={`Reset ${label.toLowerCase()}`} onClick={onReset}>Reset</button>}
    </div>
    {children !== undefined && <div id={id} className={classes.controls} hidden={!expanded}>{children}</div>}
  </div>;
}
