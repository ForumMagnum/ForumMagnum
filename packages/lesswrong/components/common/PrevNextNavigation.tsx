import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("PrevNextNavigation", (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    flexGrow: 1,
    minHeight: 20,
    // Opt out of the bullet that SectionFooter puts after each of its children
    '&&:after': {
      content: '""',
      marginLeft: 0,
      marginRight: 0,
    },
  },
  button: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
    ...(theme.dark && {
      color: theme.palette.text.bannerAdOverlay,
    }),
    ...(theme.isAF && {
      fontWeight: 500,
    }),
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    '&:hover': {
      opacity: 0.5,
    },
    '&:disabled': {
      color: theme.palette.grey[400],
      cursor: "default",
      opacity: 1,
    },
  },
  pageNumber: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    minWidth: "2ch",
    textAlign: "center",
    fontVariantNumeric: "tabular-nums",
  },
  hidden: {
    visibility: "hidden",
  },
}));

export interface PrevNextNavigationProps {
  onPrevious?: () => void,
  onNext?: () => void,
  onNextHoverChange?: (hovered: boolean) => void,
  pageIndex?: number,
  canGoNext?: boolean,
  className?: string,
}

const PrevNextNavigation = ({ onPrevious, onNext, onNextHoverChange, pageIndex = 0, canGoNext = true, className }: PrevNextNavigationProps) => {
  const classes = useStyles(styles);
  const onFirstPage = pageIndex === 0;
  return <div className={classNames(classes.root, className)}>
    <button type="button" className={classes.button} onClick={onPrevious} disabled={onFirstPage}>
      Prev
    </button>
    <span className={classNames(classes.pageNumber, onFirstPage && classes.hidden)}>
      {pageIndex + 1}
    </span>
    <button
      type="button"
      className={classes.button}
      onClick={onNext}
      onPointerEnter={() => onNextHoverChange?.(true)}
      onPointerLeave={() => onNextHoverChange?.(false)}
      disabled={!canGoNext}
    >
      Next
    </button>
  </div>;
};

export default PrevNextNavigation;
