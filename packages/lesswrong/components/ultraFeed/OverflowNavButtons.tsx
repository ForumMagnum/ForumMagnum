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
      width: "fit-content",
      marginRight: -4,
    },
  },
  onlyUp: {
    position: 'absolute',
    right: -48,
    bottom: 0,
    [theme.breakpoints.down('sm')]: {
      right: 12,
      bottom: 24,
    },
  },
  commentOnlyUp: {
    /* unfortunate to need to adjust between post and comment items,
    but better than having to force containing components to be structured exactly the same */
    right: -64,
    [theme.breakpoints.down('sm')]: {
      right: -4,
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
  fontSmall: {
    fontSize: 20,
  },
}));

interface Props {
  nav: OverflowNavResult;
  onCollapse?: () => void;
  // slightly different styles for comments
  applyCommentStyle?: boolean;
}

export const OverflowNavButtonsInner = ({ nav, onCollapse, applyCommentStyle }: Props) => {
  const { showUp, showDown, scrollToTop: onTop, scrollToBottom: onBottom } = nav;
  const classes = useStyles(styles);

  const handleCollapse = useCallback(() => {
    onCollapse?.();
    onTop();
  }, [onCollapse, onTop]);

  const containerClass = (showUp && !showDown)
    ? classNames(classes.onlyUp, { [classes.commentOnlyUp]: applyCommentStyle })
    : classes.both;

  return (
    <div className={classNames(classes.base, containerClass)}>
      {onCollapse && <div onClick={handleCollapse} className={classes.button}>
        <UnfoldLessIcon />
      </div>}
      <div onClick={onTop} className={classNames(classes.button, { [classes.hidden]: !showUp })}>
        <ArrowUpwardIcon className={classes.fontSmall} />
      </div>
      <div onClick={onBottom} className={classNames(classes.button, { [classes.hidden]: !showDown })}>
        <ArrowDownwardIcon className={classes.fontSmall} />
      </div>
    </div>
  );
};

export const OverflowNavButtons = registerComponent("OverflowNavButtons", OverflowNavButtonsInner);



declare global {
  interface ComponentTypes {
    OverflowNavButtons: typeof OverflowNavButtons
  }
} 
