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
}));

export interface PrevNextNavigationProps {
  onPrevious?: () => void,
  onNext?: () => void,
  onNextHoverChange?: (hovered: boolean) => void,
  canGoPrevious?: boolean,
  canGoNext?: boolean,
  className?: string,
}

const PrevNextNavigation = ({ onPrevious, onNext, onNextHoverChange, canGoPrevious = false, canGoNext = true, className }: PrevNextNavigationProps) => {
  const classes = useStyles(styles);
  return <div className={classNames(classes.root, className)}>
    <button type="button" className={classes.button} onClick={onPrevious} disabled={!canGoPrevious}>
      Prev
    </button>
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
