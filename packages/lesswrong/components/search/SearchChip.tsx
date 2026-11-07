import React from 'react';
import classNames from 'classnames';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("SearchChip", (theme: ThemeType) => ({
  chip: {
    ...theme.typography.body2,
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "2px 10px",
    flexShrink: 0,
    whiteSpace: "nowrap",
    fontSize: 13,
    color: theme.palette.text.normal,
    backgroundColor: "transparent",
    border: "none",
    borderRadius: 4,
    minHeight: 32,
    boxSizing: "border-box",
    cursor: "pointer",
    "@media (pointer: coarse)": {minHeight: 40},
    "&:hover": {
      backgroundColor: theme.palette.greyAlpha(0.08),
    },
    "&:focus-visible": {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: -2,
    },
    [theme.breakpoints.up('sm')]: {
      fontSize: 14,
      gap: 6,
      padding: "2px 12px",
    },
  },
  selected: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  icon: {
    width: 14,
    height: 14,
    [theme.breakpoints.up('sm')]: {
      width: 16,
      height: 16,
    },
  },
}));

const SearchChip = ({selected, onToggle, Icon, children, className}: {
  selected: boolean,
  onToggle: () => void,
  Icon?: React.ComponentType<{className?: string}>,
  children: React.ReactNode,
  className?: string,
}) => {
  const classes = useStyles(styles);
  return <button
    type="button"
    role="checkbox"
    aria-checked={selected}
    className={classNames(classes.chip, {[classes.selected]: selected}, className)}
    onClick={onToggle}
  >
    {Icon && <Icon className={classes.icon} />}
    {children}
  </button>;
};

export default SearchChip;
