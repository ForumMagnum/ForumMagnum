import React, { useCallback } from 'react';
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
import ArrowUpwardIcon from '@/lib/vendor/@material-ui/icons/src/ArrowUpward';
import ArrowDownwardIcon from '@/lib/vendor/@material-ui/icons/src/ArrowDownward';
import UnfoldLessIcon from '@/lib/vendor/@material-ui/icons/src/UnfoldLess';
import type { OverflowNavResult } from './hooks/useOverflowNav';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { registerComponent } from '@/lib/vulcan-lib/components';
import classNames from 'classnames';

const styles = defineStyles('OverflowNavButtons', (theme: ThemeType) => ({
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: "8px",
    zIndex: theme.zIndexes.overflowNavButtons,
  },
  fixed: {
    position: 'fixed',
    right: 16,
    bottom: 128,
    [theme.breakpoints.down('sm')]: {
      bottom: 24,
    },
  },
  absoluteTop: {
    position: 'absolute',
    right: 16,
    top: 24,
  },
  absoluteBottom: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
  button: {
    background: theme.palette.grey[900],
    opacity: 0.5,
    color: '#fff',
    width: 36,
    height: 36,
    transition: 'opacity 0.3s ease',
    '&:hover': {
      opacity: 0.7
    },
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
}));

interface Props {
  nav: OverflowNavResult;
  onCollapse?: () => void;
}

export const OverflowNavButtons = ({ nav, onCollapse }: Props) => {
  const { showUp, showDown, scrollToTop: onTop, scrollToBottom: onBottom } = nav;
  const classes = useStyles(styles);

  const handleCollapse = useCallback(() => {
    onCollapse?.();
    onTop();
  }, [onCollapse, onTop]);

  let containerClass = classes.fixed;
  if (showUp && !showDown) {
    containerClass = classes.absoluteBottom;
  } else if (showDown && !showUp) {
    containerClass = classes.fixed;
  }

  return (
    <div className={`${classes.base} ${containerClass}`}>
      {onCollapse && (
        <IconButton onClick={handleCollapse} className={classes.button}>
          <UnfoldLessIcon fontSize="medium" />
        </IconButton>
      )}
      <IconButton
        onClick={onTop}
        className={classNames(classes.button, { [classes.hidden]: !showUp })}
      >
        <ArrowUpwardIcon fontSize="small" />
      </IconButton>
      <IconButton
        onClick={onBottom}
        className={classNames(classes.button, { [classes.hidden]: !showDown })}
      >
        <ArrowDownwardIcon fontSize="small" />
      </IconButton>
    </div>
  );
};


const OverflowNavButtonsComponent = registerComponent("OverflowNavButtons", OverflowNavButtons);

export default OverflowNavButtonsComponent;

declare global {
  interface ComponentTypes {
    OverflowNavButtons: typeof OverflowNavButtonsComponent
  }
} 
