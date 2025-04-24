import React, { useCallback } from 'react';
import ArrowUpwardIcon from '@/lib/vendor/@material-ui/icons/src/ArrowUpward';
import ArrowDownwardIcon from '@/lib/vendor/@material-ui/icons/src/ArrowDownward';
import UnfoldLessIcon from '@/lib/vendor/@material-ui/icons/src/UnfoldLess';
import type { OverflowNavResult } from './OverflowNavObserverContext'
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
  both: {
    position: 'sticky',
    bottom: 128,
    float: 'right',
    marginRight: -64,
    [theme.breakpoints.down('sm')]: {
      position: 'fixed',
      marginRight: 0,
      right: 12,
      bottom: 24,
    },
  },
  onlyUp: {
    position: 'absolute',
    right: -48,
    bottom: 0,
    [theme.breakpoints.down('sm')]: {
      position: 'absolute',
      right: 12,
      bottom: 24,
    },
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

  const containerClass = (showUp && !showDown) ? classes.onlyUp : classes.both;

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
