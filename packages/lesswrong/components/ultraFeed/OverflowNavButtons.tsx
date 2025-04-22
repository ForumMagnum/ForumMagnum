import React, { useCallback } from 'react';
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
    right: 12,
    bottom: 128,
    [theme.breakpoints.down('sm')]: {
      bottom: 24,
    },
  },
  absoluteTop: {
    position: 'absolute',
    right: 12,
    top: 24,
  },
  absoluteBottom: {
    position: 'absolute',
    right: 12,
    bottom: 24,
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.palette.type === 'dark' ? theme.palette.grey[400] : theme.palette.panelBackground.tooltipBackground2,
    borderRadius: '40%',
    opacity: theme.palette.type === 'dark' ? 0.8 : 0.4,
    color: theme.palette.text.alwaysWhite,
    width: 36,
    height: 36,
    cursor: 'pointer',
    transition: 'opacity 0.5s ease',
    // would be nice to have hover effect, but it gets stuck as applied which is worse than not having it
    // '&:hover': {
    //   opacity: 0.7,
    // },
  },
  hidden: {
    opacity: '0 !important',
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
    <div className={classNames(classes.base, containerClass)}>
      {onCollapse && <div onClick={handleCollapse} className={classes.button} >
          <UnfoldLessIcon fontSize="medium" />
        </div>}
      <div onClick={onTop} className={classNames(classes.button, { [classes.hidden]: !showUp })} >
        <ArrowUpwardIcon fontSize="small" />
      </div>
      <div onClick={onBottom} className={classNames(classes.button, { [classes.hidden]: !showDown })} >
        <ArrowDownwardIcon fontSize="small" />
      </div>
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
